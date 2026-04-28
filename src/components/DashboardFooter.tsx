import React from 'react';

interface DashboardFooterProps {
  onOpenModal: (modal: string) => void;
}

const DashboardFooter: React.FC<DashboardFooterProps> = ({ onOpenModal }) => {
  return (
    <footer className="bg-brand-surface py-6 border-t border-brand-border text-center mt-auto flex-shrink-0">
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="https://somali-programmer.github.io/2018_exit_exam-/logo.png" alt="HU Logo" className="w-6 h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
          <p className="text-brand-muted text-xs font-medium tracking-wide">
            © {new Date().getFullYear()} Haramaya University CS Department
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
          <button 
            onClick={() => onOpenModal('privacy')}
            className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => onOpenModal('terms')}
            className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
          >
            Terms & Conditions
          </button>
          <button 
            onClick={() => onOpenModal('attendance')}
            className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
          >
            Attendance Policy
          </button>
          <button 
            onClick={() => onOpenModal('support')}
            className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
          >
            Sys-Instructions
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest opacity-60">HU-AMS V2.2.0-STABLE</p>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
