
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Clock, Save } from 'lucide-react';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

interface ScheduleEditorProps {
  onClose: () => void;
}

const ScheduleEditor = ({ onClose }: ScheduleEditorProps) => {
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(
    DAYS_OF_WEEK.map(day => ({
      day,
      startTime: '09:00',
      endTime: '17:00',
      enabled: day !== 'Saturday' && day !== 'Sunday'
    }))
  );

  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: string | boolean) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
    setTimeSlots(newTimeSlots);
  };

  const handleSave = async () => {
    try {
      // Here you would save to your backend/Supabase
      console.log('Saving schedule:', timeSlots);
      
      toast({
        title: "Success",
        description: "Your schedule has been updated successfully!",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Edit Schedule
        </CardTitle>
        <CardDescription className="text-slate-300">
          Set your available hours for each day of the week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeSlots.map((slot, index) => (
          <div key={slot.day} className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={slot.enabled}
                onCheckedChange={(checked) => handleTimeSlotChange(index, 'enabled', checked as boolean)}
              />
              <Label className="text-white font-medium w-20">{slot.day}</Label>
            </div>
            
            {slot.enabled && (
              <>
                <div className="flex items-center space-x-2">
                  <Label className="text-slate-300">From:</Label>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                    className="bg-white/10 border-white/20 text-white w-32"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label className="text-slate-300">To:</Label>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                    className="bg-white/10 border-white/20 text-white w-32"
                  />
                </div>
              </>
            )}
          </div>
        ))}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleEditor;
