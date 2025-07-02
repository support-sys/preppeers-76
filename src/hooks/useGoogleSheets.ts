
import { useToast } from '@/hooks/use-toast';

export const useGoogleSheets = () => {
  const { toast } = useToast();

  const syncToGoogleSheets = async (data: any, type: 'interviewer' | 'interviewee') => {
    try {
      const response = await fetch('/api/sync-to-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, type }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync to Google Sheets');
      }

      toast({
        title: "Success",
        description: "Data synced to Google Sheets successfully!",
      });

      return { success: true };
    } catch (error) {
      console.error('Error syncing to Google Sheets:', error);
      
      toast({
        title: "Sync Failed",
        description: "Could not sync data to Google Sheets. Please try again.",
        variant: "destructive",
      });

      return { success: false, error };
    }
  };

  return { syncToGoogleSheets };
};
