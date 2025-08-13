
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'interviewer' | 'interviewee';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    const currentPath = window.location.pathname;
    return <Navigate to={`/auth?from=${encodeURIComponent(currentPath)}`} />;
  }

  if (requireRole && userRole !== requireRole) {
    // If user has wrong role, redirect to home instead of showing error
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
