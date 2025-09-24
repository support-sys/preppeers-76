import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getFunnelAnalytics } from '@/utils/bookingProgressTracker';
import { BarChart3, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';

interface FunnelData {
  total_users: number;
  profile_complete: number;
  plan_selected: number;
  time_selected: number;
  matched: number;
  payment_initiated: number;
  completed: number;
  plan_distribution: {
    essential: number;
    professional: number;
    executive: number;
  };
  avg_match_score: number;
}

const FunnelAnalytics: React.FC = () => {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);

  const loadFunnelData = async () => {
    try {
      setLoading(true);
      const { data, error } = await getFunnelAnalytics(dateRange || undefined);
      
      if (error) {
        setError(error.message || 'Failed to load funnel data');
        return;
      }
      
      setFunnelData(data);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading funnel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunnelData();
  }, [dateRange]);

  const calculateConversionRate = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Math.round((current / previous) * 100);
  };

  const funnelSteps = [
    { label: 'Profile Complete', value: funnelData?.profile_complete || 0, color: 'bg-blue-500' },
    { label: 'Plan Selected', value: funnelData?.plan_selected || 0, color: 'bg-green-500' },
    { label: 'Time Selected', value: funnelData?.time_selected || 0, color: 'bg-yellow-500' },
    { label: 'Interviewer Matched', value: funnelData?.matched || 0, color: 'bg-orange-500' },
    { label: 'Payment Initiated', value: funnelData?.payment_initiated || 0, color: 'bg-purple-500' },
    { label: 'Completed', value: funnelData?.completed || 0, color: 'bg-emerald-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading funnel analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={loadFunnelData} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No funnel data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Funnel Analytics</h2>
          <p className="text-gray-600">Track user progress through the booking process</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange?.from || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="date"
            value={dateRange?.to || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <Button onClick={loadFunnelData}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{funnelData.total_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculateConversionRate(funnelData.completed, funnelData.total_users)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Payment Initiated</p>
                <p className="text-2xl font-bold text-gray-900">{funnelData.payment_initiated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Match Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {funnelData.avg_match_score.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Funnel</CardTitle>
          <CardDescription>
            User progression through the booking process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelSteps.map((step, index) => {
              const previousStep = index > 0 ? funnelSteps[index - 1].value : funnelData.total_users;
              const conversionRate = calculateConversionRate(step.value, previousStep);
              
              return (
                <div key={step.label} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">{step.label}</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{step.value}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({conversionRate}%)
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${step.color} transition-all duration-500`}
                      style={{ 
                        width: `${Math.max(5, (step.value / funnelData.total_users) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Drop-off indicator */}
                  {index > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      Drop-off: {previousStep - step.value} users ({Math.round(((previousStep - step.value) / previousStep) * 100)}%)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
          <CardDescription>
            Popularity of different interview plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{funnelData.plan_distribution.essential}</div>
              <div className="text-sm text-gray-600">Essential</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{funnelData.plan_distribution.professional}</div>
              <div className="text-sm text-gray-600">Professional</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{funnelData.plan_distribution.executive}</div>
              <div className="text-sm text-gray-600">Executive</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FunnelAnalytics;
