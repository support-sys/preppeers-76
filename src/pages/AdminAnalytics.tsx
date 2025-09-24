import React from 'react';
import Navigation from '@/components/Navigation';
import FunnelAnalytics from '@/components/FunnelAnalytics';

const AdminAnalytics: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <FunnelAnalytics />
      </div>
    </div>
  );
};

export default AdminAnalytics;
