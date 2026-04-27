import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex-none h-16 bg-white/70 backdrop-blur-xl border-b border-zinc-200/50 flex items-center justify-between px-6 z-20 shadow-sm sticky top-0"
    >
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900">DocuGen AI</span>
        </Link>

        {user ? (
          <div className="hidden md:flex items-center gap-1 bg-zinc-100/50 rounded-lg p-1 border border-zinc-200/50">
            <Link to="/" className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white shadow-sm rounded-md hover:text-zinc-900 transition-colors">Workspace</Link>
            <Link to="/about" className="px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">About Us</Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1 bg-zinc-100/50 rounded-lg p-1 border border-zinc-200/50">
            <Link to="/" className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white shadow-sm rounded-md hover:text-zinc-900 transition-colors">Test Chat Workspace</Link>
            <Link to="/about" className="px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">About Us</Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-zinc-700 hidden sm:block">
                {user.email}
              </div>
              <button 
                onClick={handleSignOut}
                className="flex items-center justify-center p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/about" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors mr-2">About Us</Link>
            <Link 
              to="/signin" 
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors px-3 py-2 rounded-md hover:bg-zinc-100"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors px-4 py-2 rounded-lg shadow-md"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
