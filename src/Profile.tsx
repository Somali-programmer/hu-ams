import React from 'react';
import { useAuth } from './AuthContext';
import { motion } from 'motion/react';
import { User as UserIcon, Mail, Phone, Building, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from './lib/utils';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hu-card-alt overflow-hidden"
      >
        <div className="h-40 bg-gradient-to-r from-hu-green to-hu-gold relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </div>
        <div className="px-8 md:px-12 pb-12">
          <div className="relative -mt-16 mb-8">
            <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-8 border-white">
              <div className="w-full h-full bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                <UserIcon className="w-10 h-10 md:w-12 md:h-12 md:w-16 md:h-16" />
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <h1 className="text-2xl md:text-4xl font-serif font-bold text-brand-text">{user.fullName}</h1>
              <p className="text-gray-black/40 capitalize font-bold tracking-[0.2em] text-xs mt-1">{user.role}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-10 border-t border-brand-border">
              {[
                { label: 'Email Address', value: user.email, icon: Mail },
                { label: 'Department', value: user.department, icon: Building },
                { label: 'Phone Number', value: user.phone || 'Not provided', icon: Phone },
                { label: 'Account Status', value: 'Active', icon: Shield, color: 'text-brand-primary' },
                { 
                  label: 'Joined On', 
                  value: user.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy') : 'N/A', 
                  icon: Calendar 
                }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="hu-label mb-0">{item.label}</p>
                    <p className={cn("text-sm font-bold", item.color || "text-brand-text")}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <button className="hu-button-rounded w-full">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
