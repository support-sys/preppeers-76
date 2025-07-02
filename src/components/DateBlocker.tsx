
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { CalendarX, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface DateBlockerProps {
  onClose: () => void;
}

const DateBlocker = ({ onClose }: DateBlockerProps) => {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([
    // Some example blocked dates
    new Date(2025, 0, 15), // January 15, 2025
    new Date(2025, 0, 20), // January 20, 2025
  ]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const isAlreadySelected = selectedDates.some(
      selectedDate => selectedDate.toDateString() === date.toDateString()
    );
    
    if (isAlreadySelected) {
      setSelectedDates(selectedDates.filter(
        selectedDate => selectedDate.toDateString() !== date.toDateString()
      ));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: "No dates selected",
        description: "Please select dates to block.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would save blocked dates to your backend/Supabase
      console.log('Blocking dates:', selectedDates);
      
      const newBlockedDates = [...blockedDates, ...selectedDates];
      setBlockedDates(newBlockedDates);
      setSelectedDates([]);
      
      toast({
        title: "Success",
        description: `${selectedDates.length} date(s) have been blocked successfully!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block dates. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnblockDate = async (dateToUnblock: Date) => {
    try {
      const updatedBlockedDates = blockedDates.filter(
        date => date.toDateString() !== dateToUnblock.toDateString()
      );
      setBlockedDates(updatedBlockedDates);
      
      toast({
        title: "Success",
        description: "Date has been unblocked successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock date. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(blockedDate => 
      blockedDate.toDateString() === date.toDateString()
    );
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CalendarX className="w-5 h-5 mr-2" />
            Block Dates
          </CardTitle>
          <CardDescription className="text-slate-300">
            Select dates when you're not available for interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={handleDateSelect}
            className="bg-white/5 rounded-md p-3"
            modifiers={{
              blocked: blockedDates,
              selected: selectedDates,
            }}
            modifiersStyles={{
              blocked: { backgroundColor: 'rgba(239, 68, 68, 0.5)' },
              selected: { backgroundColor: 'rgba(59, 130, 246, 0.5)' },
            }}
            disabled={(date) => date < new Date()}
          />
          
          <div className="mt-4 space-y-2">
            {selectedDates.length > 0 && (
              <div>
                <p className="text-sm text-slate-300 mb-2">Selected dates to block:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedDates.map((date, index) => (
                    <span key={index} className="bg-blue-600/50 text-white px-2 py-1 rounded text-xs">
                      {format(date, 'MMM dd, yyyy')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBlockDates}
                className="bg-red-600 hover:bg-red-700"
                disabled={selectedDates.length === 0}
              >
                Block Selected Dates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Currently Blocked Dates</CardTitle>
          <CardDescription className="text-slate-300">
            Dates when you're unavailable for interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-slate-300">No dates are currently blocked.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {blockedDates.map((date, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-white">{format(date, 'EEEE, MMMM dd, yyyy')}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnblockDate(date)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DateBlocker;
