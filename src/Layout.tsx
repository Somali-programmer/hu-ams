import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop & Mobile */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 transform transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-hu-green rounded-xl flex items-center justify-center text-white shadow-lg shadow-hu-green/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-serif font-bold text-lg md:text-xl tracking-tight text-black">HU-AMS</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 md:p-3 text-black bg-hu-green/10 rounded-xl transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 pb-12 px-4 sm:px-8 lg:px-12 pt-6 md:pt-8 lg:pt-12">
          {children}
        </main>
        <footer className="max-w-7xl mx-auto px-8 lg:px-12 py-12 border-t border-gray-100 w-full">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <p className="text-gray-400 text-sm font-medium">
              &copy; 2026 Haramaya University. All rights reserved.
            </p>
            <div className="flex items-center gap-4 md:gap-8 text-center md:text-left">
              <a href="#" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-hu-gold transition-colors">Privacy</a>
              <a href="#" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-hu-gold transition-colors">Terms</a>
              <a href="#" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-hu-gold transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
