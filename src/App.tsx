import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { Group } from './types';
import { Loader2, MessageSquare } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        const userData = {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous',
          photoURL: user.photoURL || '',
          email: user.email || '',
          lastSeen: serverTimestamp(),
          status: 'online'
        };

        if (!userSnap.exists()) {
          await setDoc(userRef, userData);
        } else {
          await setDoc(userRef, { lastSeen: serverTimestamp(), status: 'online' }, { merge: true });
        }
        
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F0F2F5]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Sidebar - Group List & Profile */}
      <Sidebar 
        onSelectGroup={(g) => setActiveGroup(g)} 
        activeGroupId={activeGroup?.id} 
      />

      {/* Main Content Area */}
      {activeGroup ? (
        <ChatWindow group={activeGroup} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F0F2F5] border-b-[6px] border-[#00A884] space-y-4">
          <div className="w-64 h-64 opacity-20">
             <MessageSquare className="w-full h-full text-emerald-600" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-light text-gray-700">Connect Hub for Web</h1>
            <p className="text-sm text-gray-500 max-w-sm px-4">
              Send and receive messages without keeping your phone online.
              Use Connect Hub on up to 4 linked devices and 1 phone at the same time.
            </p>
          </div>
          <div className="mt-8 text-xs text-gray-400 font-medium tracking-wider flex items-center gap-2">
             <span>SECURE & END-TO-END ENCRYPTED</span>
          </div>
        </div>
      )}
    </div>
  );
}
