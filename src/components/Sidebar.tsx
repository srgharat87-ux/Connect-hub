import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  MessageSquarePlus, 
  LogOut,
  User as UserIcon,
  Users
} from 'lucide-react';
import { auth, db, logout } from '../lib/firebase';
import { collection, query, onSnapshot, where, orderBy, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Group, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  onSelectGroup: (group: Group) => void;
  activeGroupId?: string;
}

export default function Sidebar({ onSelectGroup, activeGroupId }: SidebarProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // In a real app, we'd query member-of groups. 
    // For this demo, we'll list all groups the user has access to.
    const q = query(collection(db, 'groups'), orderBy('lastMessageTime', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      setGroups(gList);
    });

    return () => unsubscribe();
  }, [user]);

  const createGroup = async () => {
    const name = prompt('Enter group name:');
    if (!name) return;

    try {
      const gRef = doc(collection(db, 'groups'));
      const groupId = gRef.id;
      
      const newGroup = {
        name,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
      };

      await setDoc(gRef, newGroup);
      
      // Add self as admin member
      await setDoc(doc(db, 'groups', groupId, 'members', user!.uid), {
        userId: user?.uid,
        groupId,
        role: 'admin',
        joinedAt: serverTimestamp()
      });

      alert('Group created!');
    } catch (err) {
      console.error(err);
      alert('Failed to create group. Check permissions.');
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-[410px] h-full flex flex-col border-r border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="h-[60px] bg-[#F0F2F5] px-4 flex items-center justify-between">
        <button 
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 hover:ring-2 hover:ring-emerald-500 transition-all"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Me" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <UserIcon />
            </div>
          )}
        </button>

        <div className="flex items-center gap-4 text-gray-600">
          <button onClick={createGroup} className="p-2 hover:bg-gray-200 rounded-full transition-colors" title="New Group">
            <MessageSquarePlus className="w-6 h-6" />
          </button>
          <div className="relative group">
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <MoreVertical className="w-6 h-6" />
            </button>
            <div className="absolute right-0 top-10 w-48 bg-white border border-gray-100 shadow-lg rounded-lg py-1 hidden group-hover:block z-50">
              <button 
                onClick={() => logout()}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 bg-white flex items-center gap-2">
        <div className="flex-1 bg-[#F0F2F5] rounded-xl flex items-center px-4 py-1.5 group focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-gray-200 transition-all">
          <Search className="w-5 h-5 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search or start new chat" 
            className="flex-1 bg-transparent border-none outline-none px-4 py-1 text-sm text-gray-900 placeholder:text-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center space-y-4">
            <Users className="w-12 h-12 opacity-20" />
            <p className="text-sm">No groups found.<br/>Create one to start chatting!</p>
          </div>
        ) : (
          filteredGroups.map(group => (
            <button 
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className={`w-full flex items-center px-4 py-3 gap-4 hover:bg-[#F5F6F6] transition-colors border-b border-gray-50 text-left ${activeGroupId === group.id ? 'bg-[#EBECEC]' : ''}`}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600">
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} />
                ) : (
                  <Users className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                  <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                    {group.lastMessageTime ? formatDistanceToNow(group.lastMessageTime.toDate(), { addSuffix: false }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate italic">
                  {group.lastMessage || 'No messages yet'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Profile Sidebar Overlay */}
      <AnimatePresence>
        {showProfile && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-[#F0F2F5] flex flex-col"
          >
            <div className="h-[108px] bg-[#008069] flex items-end p-5 text-white gap-6 shadow-md">
              <button onClick={() => setShowProfile(false)} className="mb-1">
                <Search className="w-6 h-6 rotate-45" /> {/* Use as back arrow for simplicity */}
              </button>
              <h2 className="text-lg font-bold mb-0.5">Profile</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-8 py-8">
              <div className="flex justify-center">
                <div className="w-52 h-52 rounded-full overflow-hidden shadow-lg border-4 border-white">
                  <img src={user?.photoURL || ''} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
              
              <div className="bg-white px-8 py-4 shadow-sm space-y-1">
                <label className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Your Name</label>
                <div className="text-lg text-gray-900 font-medium">{user?.displayName}</div>
              </div>

              <div className="bg-white px-8 py-4 shadow-sm space-y-1">
                <label className="text-xs text-emerald-600 font-medium uppercase tracking-wider">About</label>
                <div className="text-md text-gray-700 italic">"Hey there! I am using Connect Hub."</div>
              </div>

              <div className="px-8 text-sm text-gray-500 leading-relaxed">
                This is not your username or pin. This name will be visible to your Connect Hub contacts.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
