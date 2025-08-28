import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfDay, addHours, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  value,
  onChange,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [selectedHour, setSelectedHour] = useState<string>('10');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [customTime, setCustomTime] = useState<string>('');
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);

  // Generate available time slots (24 hours with 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayMinute = minute.toString().padStart(2, '0');
        
        slots.push({
          hour: hour,
          minute: minute,
          display: `${displayHour}:${displayMinute} ${period}`,
          value: `${hour.toString().padStart(2, '0')}:${displayMinute}`
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get minimum date (1 hour from now)
  const getMinDate = () => {
    const now = new Date();
    return addHours(now, 1);
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    return addDays(new Date(), 30);
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Auto-select first available time slot for the selected date
      if (selectedHour && selectedMinute) {
        const finalDate = setHours(setMinutes(date, parseInt(selectedMinute)), parseInt(selectedHour));
        onChange(finalDate.toISOString());
      }
    }
  };

  // Handle time selection
  const handleTimeSelect = (hour: string, minute: string, period: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    
    if (selectedDate) {
      let finalHour = parseInt(hour);
      if (period === 'PM' && finalHour !== 12) finalHour += 12;
      if (period === 'AM' && finalHour === 12) finalHour = 0;
      
      const finalDate = setHours(setMinutes(selectedDate, parseInt(minute)), finalHour);
      onChange(finalDate.toISOString());
    }
  };

  // Format display value
  const formatDisplayValue = () => {
    if (!value) return 'Select date and time';
    
    try {
      const date = new Date(value);
      const timeStr = format(date, 'h:mm a');
      const dateStr = format(date, 'MMM d, yyyy');
      return `${dateStr} at ${timeStr}`;
    } catch {
      return 'Select date and time';
    }
  };

  // Check if a date is disabled
  const isDateDisabled = (date: Date) => {
    const now = new Date();
    const minDate = getMinDate();
    const maxDate = getMaxDate();
    
    return date < startOfDay(minDate) || date > maxDate;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-white">Preferred Time Slot</Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20',
              !value && 'text-slate-400'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDisplayValue()}
          </Button>
        </PopoverTrigger>
        
                       <PopoverContent className="w-[280px] sm:w-auto p-0 bg-slate-900 border-slate-700" align="start">
                 <div className="p-3 border-b border-slate-700">
                   <div className="flex items-center justify-between mb-3">
                     <h4 className="font-medium text-white text-sm sm:text-base">Select Date</h4>
                     <div className="flex space-x-1">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           const newDate = selectedDate ? addDays(selectedDate, -1) : new Date();
                           if (!isDateDisabled(newDate)) {
                             handleDateSelect(newDate);
                           }
                         }}
                         className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                       >
                         <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           const newDate = selectedDate ? addDays(selectedDate, 1) : new Date();
                           if (!isDateDisabled(newDate)) {
                             handleDateSelect(newDate);
                           }
                         }}
                         className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                       >
                         <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                       </Button>
                     </div>
                   </div>
            
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className="rounded-md border-0"
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium text-white',
                nav: 'space-x-1 flex items-center',
                nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-400 hover:text-white',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-slate-400 rounded-md w-8 font-normal text-[0.8rem]',
                row: 'flex w-full mt-2',
                cell: cn(
                  'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
                  'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
                ),
                day: cn(
                  'h-8 w-8 p-0 font-normal aria-selected:opacity-100',
                  'text-slate-300 hover:text-white hover:bg-slate-800 rounded-md',
                  'focus:bg-slate-800 focus:text-white focus:outline-none'
                ),
                day_selected: 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700',
                day_today: 'bg-slate-800 text-white',
                day_outside: 'text-slate-500 opacity-50',
                day_disabled: 'text-slate-500 opacity-50',
                day_range_middle: 'aria-selected:bg-slate-800 aria-selected:text-white',
                day_hidden: 'invisible',
              }}
            />
          </div>
          
          {selectedDate && (
            <div className="p-3">
                                   <div className="flex items-center space-x-2 mb-3">
                       <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                       <h4 className="font-medium text-white text-sm sm:text-base">Select Time</h4>
                     </div>
                     
                     <div className="space-y-3">
                       {/* Quick time slots */}
                       <div>
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-xs text-slate-400">Quick Select:</span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setUseCustomTime(!useCustomTime)}
                             className="h-6 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                           >
                             {useCustomTime ? 'Use Quick Select' : 'Custom Time'}
                           </Button>
                         </div>
                         
                         {!useCustomTime ? (
                           <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-h-40 sm:max-h-48 overflow-y-auto">
                             {timeSlots.map((slot) => (
                               <Button
                                 key={`${slot.hour}-${slot.minute}`}
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleTimeSelect(slot.value.split(':')[0], slot.value.split(':')[1], slot.hour >= 12 ? 'PM' : 'AM')}
                                 className={cn(
                                   'h-7 sm:h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800',
                                   selectedHour === slot.value.split(':')[0] && 
                                   selectedMinute === slot.value.split(':')[1] && 
                                   selectedPeriod === (slot.hour >= 12 ? 'PM' : 'AM') &&
                                   'bg-blue-600 text-white hover:bg-blue-700'
                                 )}
                               >
                                 {slot.display}
                               </Button>
                             ))}
                           </div>
                         ) : (
                           <div className="space-y-3">
                             <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                               <Input
                                 type="number"
                                 min="1"
                                 max="12"
                                 placeholder="Hour"
                                 value={selectedHour}
                                 onChange={(e) => setSelectedHour(e.target.value)}
                                 className="h-7 sm:h-8 text-xs text-center bg-slate-800 border-slate-600 text-white"
                               />
                               <Input
                                 type="number"
                                 min="0"
                                 max="59"
                                 placeholder="Min"
                                 value={selectedMinute}
                                 onChange={(e) => setSelectedMinute(e.target.value.padStart(2, '0'))}
                                 className="h-7 sm:h-8 text-xs text-center bg-slate-800 border-slate-600 text-white"
                               />
                               <Select
                                 value={selectedPeriod}
                                 onValueChange={(value: 'AM' | 'PM') => setSelectedPeriod(value)}
                               >
                                 <SelectTrigger className="h-7 sm:h-8 text-xs bg-slate-800 border-slate-600 text-white">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="bg-slate-800 border-slate-600">
                                   <SelectItem value="AM" className="text-white hover:bg-slate-700">AM</SelectItem>
                                   <SelectItem value="PM" className="text-white hover:bg-slate-700">PM</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 if (selectedDate && selectedHour && selectedMinute) {
                                   handleTimeSelect(selectedHour, selectedMinute, selectedPeriod);
                                   setUseCustomTime(false);
                                 }
                               }}
                               className="w-full h-7 sm:h-8 text-xs bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                             >
                               Apply Custom Time
                             </Button>
                           </div>
                         )}
                       </div>
                     </div>
              
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <span className="text-xs sm:text-sm text-slate-400">Selected:</span>
                  <span className="text-xs sm:text-sm font-medium text-white break-words">
                    {selectedDate && format(selectedDate, 'MMM d, yyyy')} at {selectedHour}:{selectedMinute} {selectedPeriod}
                  </span>
                </div>
                
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-2 sm:py-3"
                >
                  Confirm Selection
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      
      <p className="text-sm text-slate-400">
        Choose any time that works for you - morning, afternoon, evening, or late night. We'll try to match your preferred time, or suggest alternatives. Must be at least 1 hour in the future.
      </p>
    </div>
  );
};

export default TimeSlotPicker;
