
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleSheets = () => {
  const { toast } = useToast();

  const syncInterviewerToGoogleSheets = async (data: any) => {
    try {
      const { error } = await supabase.functions.invoke('sync-to-sheets', {
        body: { 
          data, 
          type: 'interviewer' 
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Interviewer data synced to Google Sheets successfully!",
      });

      return { success: true };
    } catch (error) {
      console.error('Error syncing interviewer to Google Sheets:', error);
      
      toast({
        title: "Sync Failed",
        description: "Could not sync interviewer data to Google Sheets. Please try again.",
        variant: "destructive",
      });

      return { success: false, error };
    }
  };

  const syncCandidateToGoogleSheets = async (data: any) => {
    try {
      const { error } = await supabase.functions.invoke('sync-to-sheets', {
        body: { 
          data, 
          type: 'interviewee' 
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate booking synced to Google Sheets successfully!",
      });

      return { success: true };
    } catch (error) {
      console.error('Error syncing candidate to Google Sheets:', error);
      
      toast({
        title: "Sync Failed",
        description: "Could not sync candidate data to Google Sheets. Please try again.",
        variant: "destructive",
      });

      return { success: false, error };
    }
  };

  // Legacy method for backward compatibility
  const syncToGoogleSheets = async (data: any, type: 'interviewer' | 'interviewee') => {
    if (type === 'interviewer') {
      return syncInterviewerToGoogleSheets(data);
    } else {
      return syncCandidateToGoogleSheets(data);
    }
  };

  return { 
    syncToGoogleSheets,
    syncInterviewerToGoogleSheets,
    syncCandidateToGoogleSheets
  };
};
