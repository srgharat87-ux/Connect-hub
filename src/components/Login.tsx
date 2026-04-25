import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function Login() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <MessageCircle className="text-white w-12 h-12" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Connect Hub</h1>
          <p className="text-gray-500">Real-time collaboration and group messaging</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => signInWithGoogle()}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Real-time</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
