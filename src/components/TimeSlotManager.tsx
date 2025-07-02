
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DayAvailability {
  [key: string]: {
    available: boolean;
    timeSlots: TimeSlot[];
  };
}

interface TimeSlotManagerProps {
  onClose: () => void;
}

const TimeSlotManager = ({ onClose }: TimeSlotManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<DayAvailability>({});

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('interviewers')
      .select('availability_days, time_slots')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      const initialAvailability: DayAvailability = {};
      
      daysOfWeek.forEach(day => {
        initialAvailability[day] = {
          available: data.availability_days?.includes(day) || false,
          timeSlots: []
        };
      });

      // Parse time_slots from database - handle JSON properly
      if (data.time_slots && typeof data.time_slots === 'object') {
        Object.entries(data.time_slots as Record<string, any>).forEach(([day, slots]) => {
          if (Array.isArray(slots)) {
            const validSlots = slots.filter((slot: any) => 
              slot && typeof slot === 'object' && 
              typeof slot.id === 'string' && 
              typeof slot.start === 'string' && 
              typeof slot.end === 'string'
            ) as TimeSlot[];
            
            initialAvailability[day] = {
              available: true,
              timeSlots: validSlots
            };
          }
        });
      }

      setAvailability(initialAvailability);
    } else {
      // Initialize empty availability
      const initialAvailability: DayAvailability = {};
      daysOfWeek.forEach(day => {
        initialAvailability[day] = {
          available: false,
          timeSlots: []
        };
      });
      setAvailability(initialAvailability);
    }
  };

  const handleDayToggle = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day]?.available,
        timeSlots: prev[day]?.available ? [] : prev[day]?.timeSlots || []
      }
    }));
  };

  const addTimeSlot = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [
          ...(prev[day]?.timeSlots || []),
          {
            id: Math.random().toString(36).substr(2, 9),
            start: "09:00",
            end: "17:00"
          }
        ]
      }
    }));
  };

  const removeTimeSlot = (day: string, slotId: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day]?.timeSlots.filter(slot => slot.id !== slotId) || []
      }
    }));
  };

  const updateTimeSlot = (day: string, slotId: string, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day]?.timeSlots.map(slot =>
          slot.id === slotId ? { ...slot, [field]: value } : slot
        ) || []
      }
    }));
  };

  const calculateCurrentAvailableDate = () => {
    const today = new Date();
    const availableDays = Object.keys(availability).filter(day => 
      availability[day]?.available && availability[day]?.timeSlots.length > 0
    );
    
    if (availableDays.length === 0) return null;

    // Find the next available date starting from today
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (availableDays.includes(dayName)) {
        return checkDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }
    }
    
    return null;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("User not authenticated");

      const availableDays = Object.keys(availability).filter(day => availability[day]?.available);
      const timeSlots: Record<string, TimeSlot[]> = {};
      
      availableDays.forEach(day => {
        if (availability[day]?.timeSlots.length > 0) {
          timeSlots[day] = availability[day].timeSlots;
        }
      });

      // Calculate current available date and current time slots for today/next available day
      const currentAvailableDate = calculateCurrentAvailableDate();
      const currentTimeSlots = currentAvailableDate ? timeSlots : {};

      // Convert to JSON format for Supabase
      const timeSlotsJson = JSON.parse(JSON.stringify(timeSlots));
      const currentTimeSlotsJson = JSON.parse(JSON.stringify(currentTimeSlots));

      // Check if interviewer record exists
      const { data: existingData } = await supabase
        .from('interviewers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('interviewers')
          .update({
            availability_days: availableDays,
            time_slots: timeSlotsJson,
            current_available_date: currentAvailableDate,
            current_time_slots: currentTimeSlotsJson
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('interviewers')
          .insert({
            user_id: user.id,
            availability_days: availableDays,
            time_slots: timeSlotsJson,
            current_available_date: currentAvailableDate,
            current_time_slots: currentTimeSlotsJson
          });

        if (error) throw error;
      }

      toast({
        title: "Schedule Updated",
        description: "Your availability has been saved successfully."
      });
      
      onClose();
    } catch (error: any) {
      console.error('Schedule update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Manage Schedule</CardTitle>
            <CardDescription className="text-slate-300">
              Set your availability and time slots for interviews
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onClose} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {daysOfWeek.map(day => (
          <div key={day} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={day}
                checked={availability[day]?.available || false}
                onCheckedChange={() => handleDayToggle(day)}
                className="bg-white/10 border-white/20 text-blue-500"
              />
              <Label htmlFor={day} className="text-white font-medium">{day}</Label>
            </div>

            {availability[day]?.available && (
              <div className="ml-6 space-y-3">
                {availability[day]?.timeSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Label className="text-slate-300 text-sm">From:</Label>
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(day, slot.id, 'start', e.target.value)}
                        className="bg-white/10 border-white/20 text-white w-32"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="text-slate-300 text-sm">To:</Label>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(day, slot.id, 'end', e.target.value)}
                        className="bg-white/10 border-white/20 text-white w-32"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTimeSlot(day, slot.id)}
                      className="bg-red-500/20 border-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(day)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            )}
          </div>
        ))}

        <Button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Schedule'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TimeSlotManager;
