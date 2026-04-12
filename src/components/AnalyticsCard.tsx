import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, subtitle, children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("hu-card-alt p-5 md:p-8 space-y-6", className)}
    >
      <div className="space-y-1">
        <h3 className="text-lg md:text-xl font-serif font-bold text-black">{title}</h3>
        {subtitle && <p className="text-xs font-bold text-gray-black/40 uppercase tracking-widest">{subtitle}</p>}
      </div>
      <div className="w-full h-[300px]">
        {children}
      </div>
    </motion.div>
  );
};

export default AnalyticsCard;
