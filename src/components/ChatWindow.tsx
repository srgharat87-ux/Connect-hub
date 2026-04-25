import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Search, 
  MoreVertical, 
  Users,
  CheckCheck,
  Sparkles,
  Loader2
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, limit } from 'firebase/firestore';
import { Group, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { summarizeMessages } from '../services/geminiService';

interface ChatWindowProps {
  group: Group;
}

export default function ChatWindow({ group }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    setAiSummary(null); // Clear summary when changing group
    const q = query(
      collection(db, 'groups', group.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(mList);
    });

    return () => unsubscribe();
  }, [group.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    setIsSummarizing(true);
    try {
      const summary = await summarizeMessages(messages);
      setAiSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const text = inputText;
    setInputText('');

    try {
      const msgData = {
        text,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        senderPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        groupId: group.id
      };

      await addDoc(collection(db, 'groups', group.id, 'messages'), msgData);
      
      // Update group's last message
      await updateDoc(doc(db, 'groups', group.id), {
        lastMessage: text,
        lastMessageTime: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#efeae2] relative overflow-hidden">
      {/* Dynamic Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cartographer.png')` }}
      />

      {/* Header */}
      <div className="h-[60px] bg-[#F0F2F5] px-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            {group.avatar ? <img src={group.avatar} alt={group.name} /> : <Users className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-medium text-gray-900">{group.name}</h2>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Active Group</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-gray-600">
          <button 
            onClick={handleSummarize}
            disabled={isSummarizing || messages.length === 0}
            className="flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5 fill-emerald-100 italic" />}
            AI SUMMARIZE
          </button>
          <div className="h-6 w-px bg-gray-300 mx-1" />
          <button className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"><Search className="w-5 h-5"/></button>
          <button className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"><MoreVertical className="w-5 h-5"/></button>
        </div>
      </div>

      {/* AI Summary Banner */}
      <AnimatePresence>
        {aiSummary && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="z-20 bg-emerald-50 border-b border-emerald-100 shadow-sm"
          >
            <div className="max-w-2xl mx-auto p-4 relative">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Recent Catch-up</h4>
                  <p className="text-sm text-emerald-900 leading-relaxed">{aiSummary}</p>
                </div>
                <button 
                  onClick={() => setAiSummary(null)}
                  className="absolute top-2 right-2 text-emerald-400 hover:text-emerald-600"
                >
                   <Search className="w-4 h-4 rotate-45" /> {/* Close icon */}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-6 space-y-2 z-10 custom-scrollbar">
        {messages.map((msg, idx) => {
          const isOwn = msg.senderId === user?.uid;
          const showSender = idx === 0 || messages[idx-1].senderId !== msg.senderId;

          return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showSender ? 'mt-4' : 'mt-0'}`}
            >
              <div 
                className={`max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm relative group overflow-hidden ${
                  isOwn 
                    ? 'bg-[#D9FDD3] rounded-tr-none' 
                    : 'bg-white rounded-tl-none'
                }`}
              >
                {!isOwn && showSender && (
                  <p className="text-[12px] font-bold text-emerald-700 mb-0.5">{msg.senderName}</p>
                )}
                
                <div className="flex items-end gap-2 pr-10">
                  <p className="text-[14.5px] leading-relaxed text-gray-800 break-words">{msg.text}</p>
                  <div className="flex items-center gap-1.5 absolute bottom-1 right-2">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : '--:--'}
                    </span>
                    {isOwn && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="bg-[#F0F2F5] px-4 py-3 flex items-center gap-4 z-10 border-t border-gray-100">
        <div className="flex items-center gap-1 text-gray-500">
          <button className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Smile className="w-6 h-6" /></button>
          <button className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Paperclip className="w-6 h-6" /></button>
        </div>

        <form onSubmit={sendMessage} className="flex-1">
          <input 
            type="text" 
            placeholder="Type a message" 
            className="w-full bg-white rounded-xl px-4 py-2 text-[15px] outline-none border border-transparent focus:border-emerald-300 transition-all placeholder:text-gray-400"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </form>

        <button 
          onClick={sendMessage}
          disabled={!inputText.trim()}
          className={`p-2.5 rounded-full flex items-center justify-center transition-all shadow-sm ${
            inputText.trim() 
              ? 'bg-[#00A884] text-white hover:bg-[#008F6F] active:scale-95' 
              : 'text-gray-400 cursor-default'
          }`}
        >
          <Send className={`w-5 h-5 ${inputText.trim() ? 'fill-white' : ''}`} />
        </button>
      </div>
    </div>
  );
}
