import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';

type NotificationType = 'alert' | 'info' | 'success';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

const mockNotifications: Record<string, Notification[]> = {
  instructor: [
    { id: '1', title: 'System Maintenance', message: 'HU-AMS will undergo scheduled maintenance tonight at 2AM.', type: 'info', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', title: 'New Course Assigned', message: 'You have been assigned to teach SEng442: AI.', type: 'success', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
  ],
  student: [
    { id: '3', title: 'Attendance Warning', message: 'Your attendance for Compiler Design has dropped below 85%.', type: 'alert', isRead: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: '4', title: 'Session Started', message: 'A live session for AI has just started.', type: 'info', isRead: false, createdAt: new Date(Date.now() - 300000).toISOString() }
  ],
  qa_officer: [
    { id: '5', title: 'Weekly Report Generated', message: 'The attendance audit report for week 4 is ready.', type: 'success', isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() }
  ]
};

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Minimal notification state (just using mock data based on role for now)
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user?.role) {
      setNotifications(mockNotifications[user.role as keyof typeof mockNotifications] || []);
    }
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Simple relative time formatter
  const timeAgo = (dateString: string) => {
    const minDiff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (minDiff < 60) return `${minDiff}m ago`;
    const hourDiff = Math.floor(minDiff / 60);
    if (hourDiff < 24) return `${hourDiff}h ago`;
    return `${Math.floor(hourDiff / 24)}d ago`;
  };

  return (
    <div className="relative z-50 inline-block" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-brand-text bg-brand-surface rounded-xl hover:bg-brand-primary/10 transition-colors border border-brand-border h-9 w-9 flex items-center justify-center shadow-sm"
      >
        <Bell className="w-4 h-4 xl:w-5 xl:h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-brand-surface">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden origin-top-right flex flex-col"
          >
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-bg/50">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-text leading-tight">Notifications</h3>
                <p className="text-[10px] uppercase font-bold text-brand-muted tracking-widest mt-1">Updates & Alerts</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-brand-primary hover:text-brand-text uppercase tracking-wider px-2 py-1 bg-brand-primary/10 rounded-md transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={(e) => markAsRead(notif.id, e)}
                      className={cn(
                        "p-4 border-b border-brand-border/50 last:border-b-0 hover:bg-brand-bg transition-colors cursor-pointer relative",
                        !notif.isRead && "bg-brand-primary/5 hover:bg-brand-primary/10"
                      )}
                    >
                      {!notif.isRead && (
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-primary"></div>
                      )}
                      
                      <div className="flex gap-3 pr-4">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className={cn(
                            "text-sm font-semibold leading-tight",
                            notif.isRead ? "text-brand-text/80" : "text-brand-text"
                          )}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            <span>{timeAgo(notif.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-brand-primary/50" />
                  </div>
                  <p className="text-sm text-brand-muted font-medium">You're all caught up!</p>
                  <p className="text-xs text-brand-muted/60 mt-1">No new notifications right now.</p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-brand-bg/50 border-t border-brand-border text-center">
               <button className="text-[11px] font-bold text-brand-primary hover:text-brand-text uppercase tracking-widest transition-colors w-full h-full">
                 View All History
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
