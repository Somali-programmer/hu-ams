import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { AppDataProvider } from './AppDataContext';
import Layout from './Layout';
import Login from './Login';
import StudentDashboard from './StudentDashboard';
import InstructorDashboard from './InstructorDashboard';
import AdminDashboard from './AdminDashboard';
import QAOfficerDashboard from './QAOfficerDashboard';
import Profile from './Profile';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const DashboardRouter: React.FC<{ view?: string }> = ({ view = 'overview' }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    // User is authenticated but profile not found (should not happen normally)
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'student':
      return <StudentDashboard view={view as any} />;
    case 'instructor':
      return <InstructorDashboard view={view as any} />;
    case 'admin':
      return <AdminDashboard view={view as any} />;
    case 'qa':
      return <QAOfficerDashboard view={view as any} />;
    default:
      return <StudentDashboard view={view as any} />;
  }
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppDataProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardRouter view="overview" />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Admin Routes */}
              <Route path="/admin/staff" element={<ProtectedRoute><Layout><AdminDashboard view="staff" /></Layout></ProtectedRoute>} />
              <Route path="/admin/students" element={<ProtectedRoute><Layout><AdminDashboard view="students" /></Layout></ProtectedRoute>} />
              <Route path="/admin/courses" element={<ProtectedRoute><Layout><AdminDashboard view="courses" /></Layout></ProtectedRoute>} />
              <Route path="/admin/sections" element={<ProtectedRoute><Layout><AdminDashboard view="sections" /></Layout></ProtectedRoute>} />
              <Route path="/admin/semesters" element={<ProtectedRoute><Layout><AdminDashboard view="semesters" /></Layout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Layout><AdminDashboard view="settings" /></Layout></ProtectedRoute>} />
              
              {/* Instructor Routes */}
              <Route path="/instructor/sessions" element={<ProtectedRoute><Layout><InstructorDashboard view="sessions" /></Layout></ProtectedRoute>} />
              <Route path="/instructor/sections" element={<ProtectedRoute><Layout><InstructorDashboard view="sections" /></Layout></ProtectedRoute>} />
              <Route path="/instructor/reports" element={<ProtectedRoute><Layout><InstructorDashboard view="reports" /></Layout></ProtectedRoute>} />
              
              {/* QA Routes */}
              <Route path="/qa/audit" element={<ProtectedRoute><Layout><QAOfficerDashboard view="audit" /></Layout></ProtectedRoute>} />
              <Route path="/qa/corrections" element={<ProtectedRoute><Layout><QAOfficerDashboard view="corrections" /></Layout></ProtectedRoute>} />
              <Route path="/qa/reports" element={<ProtectedRoute><Layout><QAOfficerDashboard view="reports" /></Layout></ProtectedRoute>} />
              
              {/* Student Routes */}
              <Route path="/student/attendance" element={<ProtectedRoute><Layout><StudentDashboard view="attendance" /></Layout></ProtectedRoute>} />
              <Route path="/student/schedule" element={<ProtectedRoute><Layout><StudentDashboard view="schedule" /></Layout></ProtectedRoute>} />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Add other routes as needed */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </AuthProvider>
      </AppDataProvider>
    </ErrorBoundary>
  );
}
