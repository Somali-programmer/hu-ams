import React from 'react';
import { Server, Database, Layers, Cpu, Globe, Lock, Share2 } from 'lucide-react';

const SystemArchitecture: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-bg md:p-12 p-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-hu-gold">
            <Layers className="w-8 h-8" />
            <h1 className="text-4xl font-serif font-bold tracking-tight">System Architecture</h1>
          </div>
          <p className="text-gray-500 text-lg">
            A deep dive into the HU Attendance System technical stack and logic.
          </p>
        </header>

        <section className="space-y-12">
          {/* Tech Stack Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="hu-card p-6 space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Globe className="w-5 h-5" />
                <h3 className="font-bold">Frontend (Client)</h3>
              </div>
              <p className="text-sm text-gray-500">
                Built with <strong>React 18 + Vite</strong>. Utilizing Tailwind CSS for "Haramaya Branded" styling and Framer Motion for responsive interactions.
              </p>
              <ul className="text-[10px] uppercase font-bold tracking-widest text-brand-muted flex flex-wrap gap-2">
                <li className="bg-hu-cream px-2 py-1 rounded">TypeScript</li>
                <li className="bg-hu-cream px-2 py-1 rounded">Recharts</li>
                <li className="bg-hu-cream px-2 py-1 rounded">Lucide-React</li>
              </ul>
            </div>

            <div className="hu-card p-6 space-y-4 shadow-xl shadow-brand-primary/5">
              <div className="flex items-center gap-3 text-brand-primary">
                <Server className="w-5 h-5" />
                <h3 className="font-bold">Backend (API)</h3>
              </div>
              <p className="text-sm text-gray-500">
                Powered by <strong>Node.js & Express.js</strong>. Implements a layered architecture (Controller -&gt; Service -&gt; Repository) for scalable performance.
              </p>
              <ul className="text-[10px] uppercase font-bold tracking-widest text-brand-muted flex flex-wrap gap-2">
                <li className="bg-hu-cream px-2 py-1 rounded">JWT Auth</li>
                <li className="bg-hu-cream px-2 py-1 rounded">Bcrypt</li>
                <li className="bg-hu-cream px-2 py-1 rounded">Express Middleware</li>
              </ul>
            </div>
          </div>

          {/* Database Design */}
          <div className="hu-card p-8 space-y-8 bg-brand-surface border-brand-primary/10">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-brand-primary" />
              <h2 className="text-2xl font-bold text-brand-text">Supabase Relational Model</h2>
            </div>
            
            <p className="text-sm text-gray-500 max-w-2xl">
              Utilizing <strong>Supabase (PostgreSQL)</strong> as the managed database engine. This provides real-time event streaming and row-level security (RLS) for high-stakes academic data.
            </p>

            <div className="relative border-l-2 border-hu-cream pl-6 ml-4 space-y-8">
              <div className="space-y-2">
                <div className="absolute -left-2.5 w-5 h-5 bg-hu-gold rounded-full border-4 border-white dark:border-brand-surface" />
                <h4 className="font-bold text-brand-text">Identity & Profiles</h4>
                <p className="text-sm text-gray-500 italic">Table: users, student_profiles, staff_profiles</p>
                <p className="text-sm text-gray-600">Normalization ensures user identity is separate from academic roles, allowing students to use ID Numbers for login while staff use University Emails.</p>
              </div>
              
              <div className="space-y-2">
                <div className="absolute -left-2.5 w-5 h-5 bg-brand-primary rounded-full border-4 border-white dark:border-brand-surface" />
                <h4 className="font-bold text-brand-text">Academic Hierarchy</h4>
                <p className="text-sm text-gray-500 italic">Table: departments, programs, centers, batches, courses</p>
                <p className="text-sm text-gray-600">The "Smart Pivot Logic" links a Section to a specific Batch and Center, ensuring students only see what is relevant to their cohort.</p>
              </div>

              <div className="space-y-2">
                <div className="absolute -left-2.5 w-5 h-5 bg-brand-primary rounded-full border-4 border-white dark:border-brand-surface" />
                <h4 className="font-bold text-brand-text">High-Frequency Attendance</h4>
                <p className="text-sm text-gray-500 italic">Table: sessions, attendance</p>
                <p className="text-sm text-gray-600">Optimized for concurrent write operations (200+ students per second) using PostgreSQL indexing and spatial geofence validation.</p>
              </div>
            </div>
          </div>

          {/* Authentication System */}
          <div className="hu-card-alt p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-brand-primary" />
              <h2 className="text-2xl font-bold text-brand-text">Authentication Flow</h2>
            </div>
            <div className="bg-brand-bg rounded-xl p-6 font-mono text-[11px] text-brand-primary space-y-3 leading-relaxed">
              <p>POST /api/auth/login</p>
              <p className="text-gray-400">1. Receive Username (ID or Email) + Password</p>
              <p className="text-gray-400">2. Query HUB (Haramaya User Base) for existing records</p>
              <p className="text-gray-400">3. Compare cryptographically hashed credentials</p>
              <p className="text-gray-400">4. Issue Session Token (JWT) with encoded Permissions Scope</p>
              <p className="text-gray-400">5. Client stores Token in HttpOnly Secure Cookie (or Storage)</p>
            </div>
          </div>
        </section>

        <footer className="pt-12 text-center">
          <p className="text-brand-muted text-[10px] uppercase tracking-widest font-bold">Document Version 2.1.0 • System Architect: [Senior Lead]</p>
        </footer>
      </div>
    </div>
  );
};

export default SystemArchitecture;
