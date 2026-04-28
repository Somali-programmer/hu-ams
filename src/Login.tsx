import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ShieldCheck, User as UserIcon, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './lib/utils';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedUsername || !trimmedPassword) {
      setError('Please enter both ID/Email and password');
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await login(trimmedUsername, trimmedPassword);
    
    if (result.success) {
      navigate('/');
    } else {
      let msg = result.message || 'Login failed';
      if (msg.toLowerCase().includes('database configuration error')) {
        msg += ' (Check your Supabase URL and Service Key in Settings)';
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-4 relative overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-brand-surface rounded-[48px] shadow-2xl p-8 md:p-12 text-center border border-brand-border relative z-10"
      >
        <div className="mb-10">
          <div className="w-20 h-20 bg-brand-primary rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-primary/30 transform hover:rotate-6 transition-transform duration-500">
            <ShieldCheck className="text-brand-text dark:text-hu-charcoal w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-brand-text mb-2 tracking-tight transition-colors">
            HU <span className="text-brand-primary italic">Attendance</span>
          </h1>
          <p className="text-brand-muted font-medium uppercase tracking-[0.3em] text-[10px] transition-colors">Computer Science Department</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-brand-muted group-focus-within:text-brand-primary transition-colors">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Student ID or Staff Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-2xl py-4 pl-12 pr-6 text-sm text-brand-text focus:outline-none focus:border-brand-primary transition-all placeholder:text-brand-muted/50"
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-brand-muted group-focus-within:text-brand-primary transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-2xl py-4 pl-12 pr-6 text-sm text-brand-text focus:outline-none focus:border-brand-primary transition-all placeholder:text-brand-muted/50"
                required
              />
            </div>
          </div>

          <div className="text-left">
            <p className="text-[10px] text-brand-muted leading-relaxed font-medium">
              * For students, the default password is <span className="text-brand-primary">HU@ID_Number</span>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hu-button w-full flex items-center justify-center gap-4 py-5"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-brand-text/30 border-t-brand-text rounded-full animate-spin" />
            ) : (
              <>
                <span className="uppercase tracking-[0.2em] text-sm dark:text-hu-charcoal">Sign In</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="dark:text-hu-charcoal"
                >
                  →
                </motion.div>
              </>
            )}
          </button>

          <p className="text-[10px] font-bold text-brand-muted/40 uppercase tracking-[0.2em] pt-6 border-t border-brand-border mt-8">
            Haramaya University • &copy; 2026
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
