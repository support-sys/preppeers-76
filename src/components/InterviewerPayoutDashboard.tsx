import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, CheckCircle, Clock, XCircle, ArrowLeft, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTimeIST } from '@/utils/dateUtils';

interface Payout {
  id: string;
  interviewer_id: string;
  interview_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  interview_type: string;
  financial_data_id: string | null;
  paid_at: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  interview: {
    candidate_name: string;
    target_role: string;
    scheduled_time: string;
  };
  interviewer_financial_data: {
    payout_method: string;
    upi_id: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_ifsc_code: string | null;
  } | null;
}

interface InterviewerPayoutDashboardProps {
  onClose: () => void;
}

const InterviewerPayoutDashboard: React.FC<InterviewerPayoutDashboardProps> = ({ onClose }) => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(() => {
    // Default to current month in YYYY-MM format
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get interviewer_id
      const { data: interviewer } = await supabase
        .from('interviewers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!interviewer) {
        setLoading(false);
        return;
      }

      // Fetch payouts with related data
      // Join with interviews and interviewer_financial_data tables
      // Note: payouts table not yet in Supabase types, will work after migration
      const { data, error } = await (supabase as any)
        .from('payouts')
        .select(`
          *,
          interview:interviews (
            candidate_name,
            target_role,
            scheduled_time
          ),
          interviewer_financial_data (
            payout_method,
            upi_id,
            bank_name,
            bank_account_number,
            bank_ifsc_code
          )
        `)
        .eq('interviewer_id', interviewer.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payouts:', error);
      } else {
        setPayouts((data || []) as Payout[]);
      }
    } catch (error) {
      console.error('Error in fetchPayouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Helper function to check if a payout is in the selected month
  const isPayoutInMonth = (payout: Payout, monthYear: string | null): boolean => {
    if (!monthYear) return true; // Show all if no month selected
    
    const payoutDate = new Date(payout.created_at);
    const payoutMonth = `${payoutDate.getFullYear()}-${String(payoutDate.getMonth() + 1).padStart(2, '0')}`;
    return payoutMonth === monthYear;
  };

  // Helper function to format month display
  const formatMonthDisplay = (monthYear: string | null): string => {
    if (!monthYear) return 'All Time';
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (!selectedMonth) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    if (!selectedMonth) {
      // If "All Time" is selected, go to current month
      const now = new Date();
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      return;
    }
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);
    // Don't allow going to future months
    const now = new Date();
    const futureDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (date <= futureDate) {
      setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
  };

  // Navigate to current month
  const goToCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  // Filter payouts by month (for display count)
  const monthFilteredPayouts = payouts.filter(p => isPayoutInMonth(p, selectedMonth));

  // Filter payouts by status and month
  const filteredPayouts = payouts.filter(p => {
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    const monthMatch = isPayoutInMonth(p, selectedMonth);
    return statusMatch && monthMatch;
  });

  // Calculate totals for filtered payouts (by month and status)
  const totalEarned = filteredPayouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = filteredPayouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading payout history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <DollarSign className="w-6 h-6 mr-2" />
            Payout History
          </h2>
          <p className="text-slate-400 mt-1">Track your earnings and payment status</p>
        </div>
        <Button onClick={onClose} variant="outline" className="text-white border-white/20 hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">₹{totalEarned.toFixed(2)}</p>
            <p className="text-slate-300">Paid out</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-yellow-400" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-400">₹{totalPending.toFixed(2)}</p>
            <p className="text-slate-300">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Month Filter */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Filter by Month:</span>
              {selectedMonth && (
                <span className="text-slate-400 text-sm">
                  ({monthFilteredPayouts.length} payout{monthFilteredPayouts.length !== 1 ? 's' : ''} in {formatMonthDisplay(selectedMonth)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Previous Month Button */}
              <Button
                onClick={goToPreviousMonth}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={!selectedMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Month Display and Picker */}
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(e.target.value || null)}
                  max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                  className="bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark] placeholder:text-slate-400"
                  style={{ colorScheme: 'dark' }}
                />
                <span className="text-white text-sm font-medium min-w-[120px] hidden sm:inline">
                  {formatMonthDisplay(selectedMonth)}
                </span>
              </div>

              {/* Next Month Button */}
              <Button
                onClick={goToNextMonth}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={
                  selectedMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* Current Month Button */}
              <Button
                onClick={goToCurrentMonth}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 ml-2"
              >
                Today
              </Button>

              {/* All Time Button */}
              <Button
                onClick={() => setSelectedMonth(null)}
                variant={selectedMonth === null ? 'default' : 'outline'}
                size="sm"
                className={selectedMonth === null ? 'bg-blue-600 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
              >
                All Time
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'paid', 'cancelled'] as const).map((status) => (
          <Button
            key={status}
            onClick={() => setFilterStatus(status)}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            className={filterStatus === status ? 'bg-blue-600 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Payouts List */}
      {filteredPayouts.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="py-8 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-300 mb-2">No payouts found</p>
            <p className="text-slate-400 text-sm">
              {selectedMonth 
                ? `for ${formatMonthDisplay(selectedMonth)}${filterStatus !== 'all' ? ` with status "${filterStatus}"` : ''}`
                : filterStatus !== 'all' ? `with status "${filterStatus}"` : ''}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayouts.map((payout) => (
            <Card key={payout.id} className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(payout.status)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payout.status)} text-white`}>
                        {payout.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {payout.interview?.target_role || 'Mock Interview'}
                    </h3>
                    <p className="text-slate-300 text-sm mb-2">
                      {payout.interview?.candidate_name || 'Unknown Candidate'}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {payout.interview?.scheduled_time ? formatDateTimeIST(payout.interview.scheduled_time) : 'N/A'}
                    </p>
                    {payout.notes && (
                      <p className="text-slate-400 text-xs mt-2">{payout.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white mb-1">₹{Number(payout.amount).toFixed(2)}</p>
                    <p className="text-slate-400 text-xs capitalize">{payout.interview_type} Plan</p>
                    {payout.paid_at && (
                      <p className="text-slate-400 text-xs mt-2">Paid: {formatDateTimeIST(payout.paid_at)}</p>
                    )}
                    {payout.reference_number && (
                      <p className="text-slate-400 text-xs">Ref: {payout.reference_number}</p>
                    )}
                  </div>
                </div>

                {/* Financial Details */}
                {payout.interviewer_financial_data && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs text-slate-400 mb-2">
                      Payment via: <span className="text-white capitalize">{payout.interviewer_financial_data.payout_method}</span>
                    </p>
                    {payout.interviewer_financial_data.payout_method === 'upi' && payout.interviewer_financial_data.upi_id && (
                      <p className="text-xs text-slate-400">UPI ID: <span className="text-white">{payout.interviewer_financial_data.upi_id}</span></p>
                    )}
                    {payout.interviewer_financial_data.payout_method === 'bank' && (
                      <div className="text-xs text-slate-400 space-y-1">
                        {payout.interviewer_financial_data.bank_name && (
                          <p>Bank: <span className="text-white">{payout.interviewer_financial_data.bank_name}</span></p>
                        )}
                        {payout.interviewer_financial_data.bank_account_number && (
                          <p>Account: <span className="text-white">****{payout.interviewer_financial_data.bank_account_number.slice(-4)}</span></p>
                        )}
                        {payout.interviewer_financial_data.bank_ifsc_code && (
                          <p>IFSC: <span className="text-white">{payout.interviewer_financial_data.bank_ifsc_code}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewerPayoutDashboard;
