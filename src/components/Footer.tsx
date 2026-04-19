import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Layers, ShieldCheck, Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white dark:bg-brand-surface border-t border-brand-border py-12 px-6 md:px-12 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4 col-span-1 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg">H</div>
            <h3 className="font-serif font-bold text-xl text-brand-text">HU Smart Attendance</h3>
          </div>
          <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
            The official attendance management ecosystem for Haramaya University, Department of Computer Science. Engineered for accuracy, scalability, and academic integrity.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">System Resources</h4>
          <ul className="space-y-3">
            <li>
              <Link to="/documentation" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-brand-primary transition-colors">
                <Book className="w-4 h-4" />
                <span>Documentation</span>
              </Link>
            </li>
            <li>
              <Link to="/architecture" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-hu-gold transition-colors">
                <Layers className="w-4 h-4" />
                <span>System Architecture</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">Department Admin</h4>
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Support: cs.admin@haramaya.edu.et</p>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">SSL SECURED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
          © {new Date().getFullYear()} Haramaya University. All Rights Reserved.
        </p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">V2.1.0-STABLE</p>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">System Online</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
