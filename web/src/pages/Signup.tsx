import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Music2, Mail, Lock, User } from 'lucide-react';

export default function Signup() {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const handleGoogleSignUp = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      navigate('/');
    } catch (err: any) {
      if (err.message?.includes('api-key-not-valid') || err.code === 'auth/api-key-not-valid') {
        // Fallback for demo purposes when Firebase isn't configured
        setUser({
          uid: 'demo-user',
          email: 'demo@soundwave.com',
          displayName: 'Demo User',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
        });
        navigate('/');
        return;
      }
      setError(err.message || 'Failed to sign up with Google');
      console.error(err);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with the name
      await updateProfile(result.user, {
        displayName: name
      });
      
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: name,
        photoURL: null,
      });
      navigate('/');
    } catch (err: any) {
      if (err.message?.includes('api-key-not-valid') || err.code === 'auth/api-key-not-valid') {
        // Fallback for demo purposes when Firebase isn't configured
        setUser({
          uid: 'demo-user',
          email: email,
          displayName: name,
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
        });
        navigate('/');
        return;
      }
      setError(err.message || 'Failed to create account. Email might already be in use.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#FF9900] opacity-15 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#8B5CF6] opacity-20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl z-10 my-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#00A8E1] rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <Music2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-[#A1A1AA] text-sm text-center">
            Join Soundwave to build your library and discover endless music.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-[#A1A1AA]" />
            </div>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?" 
              className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-[#A1A1AA]" />
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address" 
              className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-[#A1A1AA]" />
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 6 characters)" 
              className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: '#9d75f7' }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            type="submit"
            className="w-full h-12 mt-2 bg-[#8B5CF6] text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </motion.button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#121212] text-[#A1A1AA]">or</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,1)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignUp}
          type="button"
          className="w-full h-12 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </motion.button>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[#A1A1AA] text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
