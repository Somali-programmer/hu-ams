import React from 'react';
import { Book, Shield, Users, MapPin, Zap, Database, Lock, Server } from 'lucide-react';
import { motion } from 'motion/react';

const Documentation: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-bg md:p-12 p-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-brand-primary">
            <Book className="w-8 h-8" />
            <h1 className="text-4xl font-serif font-bold tracking-tight">System Documentation</h1>
          </div>
          <p className="text-gray-500 text-lg">
            A comprehensive guide to the HU Smart Attendance Management System.
          </p>
        </header>

        <section className="space-y-8">
          <div className="hu-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-hu-gold" />
              <h2 className="text-2xl font-bold text-brand-text">1. User Roles & Access</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-bold text-brand-primary">Administration</h3>
                <p className="text-sm text-gray-500">Super-users responsible for department configuration, bulk student registration, section assignments, and system-wide audit logs.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-brand-primary">Instructors</h3>
                <p className="text-sm text-gray-500">Subject matter experts who initiate attendance sessions, manage course policies, and monitor real-time class attendance trends.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-brand-primary">Students</h3>
                <p className="text-sm text-gray-500">End-users who verify their presence via GPS-validated 6-digit tokens and track their modular academic records.</p>
              </div>
            </div>
          </div>

          <div className="hu-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-brand-primary" />
              <h2 className="text-2xl font-bold text-brand-text">2. Attendance Workflow</h2>
            </div>
            <div className="space-y-4 text-gray-600 list-decimal pl-4">
              <div className="flex gap-4">
                <div className="font-bold text-brand-primary">Step 01:</div>
                <p>Instructor initializes a session. This generates a unique 6-digit token and sets the geofence center to the instructor's current GPS coordinates.</p>
              </div>
              <div className="flex gap-4">
                <div className="font-bold text-brand-primary">Step 02:</div>
                <p>Students within the section see the active session. They must read and accept the specific Course Policy once per semester.</p>
              </div>
              <div className="flex gap-4">
                <div className="font-bold text-brand-primary">Step 03:</div>
                <p>Students enter the 6-digit token. The system verifies their coordinates against the geofence radius (50m - 100m).</p>
              </div>
              <div className="flex gap-4">
                <div className="font-bold text-brand-primary">Step 04:</div>
                <p>Upon success, a cryptographically signed attendance record is stored in the database ledger.</p>
              </div>
            </div>
          </div>

          <div className="hu-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-brand-text">3. Security Protocals</h2>
            </div>
            <ul className="grid md:grid-cols-2 gap-6 list-disc pl-4 text-sm text-gray-500">
              <li><strong>GPS Spoofing Protection:</strong> Backend cross-references IP mapping and coordinate accuracy.</li>
              <li><strong>Token Rotation:</strong> Session tokens expire after a set duration (typically 15-30 minutes).</li>
              <li><strong>Role-Based Access (RBAC):</strong> Strict separation of concerns via JWT (JSON Web Tokens).</li>
              <li><strong>Audit Integrity:</strong> Every administrative change is logged with a timestamp and the performer's identity.</li>
            </ul>
          </div>
          <div className="hu-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-brand-primary" />
              <h2 className="text-2xl font-bold text-brand-text">4. Database & SQL Setup</h2>
            </div>
            <p className="text-sm text-gray-500">
              The system uses <strong>Supabase (PostgreSQL)</strong>. Admins must execute the <code className="bg-brand-bg px-2 py-0.5 rounded text-brand-primary font-bold">SUPABASE_SETUP.sql</code> script in the Supabase SQL Editor to initialize the organizational hierarchy and attendance tables.
            </p>
            <div className="bg-brand-bg rounded-xl p-4 text-[10px] font-mono text-brand-muted">
              -- Run the provided SQL script to create Tables, Enums, and RLS Policies.
            </div>
          </div>
        </section>

        <footer className="pt-12 border-t border-brand-border text-center">
          <p className="text-brand-muted text-xs uppercase tracking-widest font-bold">Haramaya University • Computer Science Department</p>
        </footer>
      </div>
    </div>
  );
};

export default Documentation;
