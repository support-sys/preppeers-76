import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, CheckCircle, Clock, Calendar, Star, Award, ArrowRight } from "lucide-react";
import MatchQualityIndicator from "@/components/MatchQualityIndicator";
import PoorMatchWarning from "@/components/PoorMatchWarning";
import { useState, useEffect } from "react";
import { getPlanById } from "@/utils/planConfig";

interface InterviewerPreviewProps {
  matchedInterviewer: any;
  alternativeTimeSlot?: {
    candidatePreferred: string;
    interviewerAvailable: string;
  };
  onProceedToPayment: (selectedTimeSlot?: string) => void;
  onGoBack: () => void;
  formData: any;
}

const InterviewerPreview = ({ 
  matchedInterviewer, 
  alternativeTimeSlot,
  onProceedToPayment, 
  onGoBack,
  formData 
}: InterviewerPreviewProps) => {
  // Set default time slot for exact matches
  const defaultTimeSlot = matchedInterviewer?.hasExactTimeMatch ? formData?.timeSlot : '';
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(defaultTimeSlot);
  const isPoorMatch = matchedInterviewer?.skillQuality === 'poor';
  const isExcellentMatch = matchedInterviewer?.skillQuality === 'excellent';
  const isGoodMatch = matchedInterviewer?.skillQuality === 'good';

  // Get plan details for dynamic display
  const selectedPlan = getPlanById(formData?.selectedPlan || 'professional');
  const sessionDuration = selectedPlan?.duration || 60;

  // Scroll to top when component mounts
  useEffect(() => {
    // Scroll to top with smooth behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Also scroll the document body to top for mobile browsers
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  // Simple function to slice time slots based on plan duration
  const sliceTimeSlots = (timeSlots: string[], duration: number) => {
    if (!timeSlots || timeSlots.length === 0) return [];
    
    const slicedSlots = [];
    
    for (const slot of timeSlots) {
      // Handle format: "Tuesday, 26/08/2025 10:00-11:00" (Day, Date, Time)
      let timeMatch = slot.match(/(\w+),\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      
      if (!timeMatch) {
        // Try format: "Monday 10:00-11:00" (Day, Time)
        timeMatch = slot.match(/(\w+)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      }
      
      if (!timeMatch) {
        // Try format without day: "10:00-11:00"
        timeMatch = slot.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      }
      
      if (!timeMatch) {
        // Try 12-hour format with AM/PM: "10:00 AM - 11:00 AM"
        timeMatch = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
      }
      
      if (!timeMatch) {
        // Try format without spaces: "9:00AM-10:00AM"
        timeMatch = slot.match(/(\d{1,2}):(\d{2})(AM|PM)-(\d{1,2}):(\d{2})(AM|PM)/);
      }
      
      if (timeMatch) {
        let startHour, startMinute, endHour, endMinute, dayName, dateStr;
        
        if (timeMatch.length === 9) {
          // Format: "Tuesday, 26/08/2025 10:00-11:00" (Day, Date, Time)
          dayName = timeMatch[1];
          const day = timeMatch[2];
          const month = timeMatch[3];
          const year = timeMatch[4];
          startHour = parseInt(timeMatch[5]);
          startMinute = parseInt(timeMatch[6]);
          endHour = parseInt(timeMatch[7]);
          endMinute = parseInt(timeMatch[8]);
          
          // Format date as DD/MM/YYYY
          dateStr = `${day}/${month}/${year}`;
        } else if (timeMatch.length === 6) {
          // Format: "Monday 10:00-11:00" (Day, Time)
          dayName = timeMatch[1];
          startHour = parseInt(timeMatch[2]);
          startMinute = parseInt(timeMatch[3]);
          endHour = parseInt(timeMatch[4]);
          endMinute = parseInt(timeMatch[5]);
        } else if (timeMatch.length === 7) {
          // 12-hour format with AM/PM: "10:00 AM - 11:00 AM"
          startHour = parseInt(timeMatch[1]);
          startMinute = parseInt(timeMatch[2]);
          endHour = parseInt(timeMatch[4]);
          endMinute = parseInt(timeMatch[5]);
          
          // Convert PM hours to 24-hour format
          if (timeMatch[3] === 'PM' && startHour !== 12) startHour += 12;
          if (timeMatch[6] === 'PM' && endHour !== 12) endHour += 12;
          if (timeMatch[3] === 'AM' && startHour === 12) startHour = 0;
          if (timeMatch[6] === 'AM' && endHour === 12) endHour = 0;
        } else if (timeMatch.length === 5) {
          // 24-hour format: "09:00-10:00"
          startHour = parseInt(timeMatch[1]);
          startMinute = parseInt(timeMatch[2]);
          endHour = parseInt(timeMatch[3]);
          endMinute = parseInt(timeMatch[4]);
        }
        
        // Fallback: try to extract day name from original slot if not found
        if (!dayName) {
          const dayMatch = slot.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
          if (dayMatch) {
            dayName = dayMatch[1];
          }
        }
        
        // Validate that we have valid time values
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
          continue; // Skip this slot if time parsing failed
        }
        
        // Calculate total minutes in the slot
        const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        
        // If the slot is longer than needed duration, slice it
        if (totalMinutes >= duration) {
          const numSegments = Math.floor(totalMinutes / duration);
          
          for (let i = 0; i < numSegments; i++) {
            // Calculate start time for this segment
            const segmentStartMinutes = startHour * 60 + startMinute + (i * duration);
            const segmentStartHour = Math.floor(segmentStartMinutes / 60);
            const segmentStartMinute = segmentStartMinutes % 60;
            
            // Calculate end time for this segment
            const segmentEndMinutes = segmentStartMinutes + duration;
            const segmentEndHour = Math.floor(segmentEndMinutes / 60);
            const segmentEndMinute = segmentEndMinutes % 60;
            
            // Format time in 24-hour format for display
            const formatTime = (hour: number, minute: number) => {
              return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            };
            
            const segmentStart = formatTime(segmentStartHour, segmentStartMinute);
            const segmentEnd = formatTime(segmentEndHour, segmentEndMinute);
            
            // Construct display format: "Day, Date TimeStart-TimeEnd"
            let displayFormat = '';
            if (dayName && dateStr) {
              displayFormat = `${dayName}, ${dateStr} ${segmentStart}-${segmentEnd}`;
            } else if (dayName) {
              displayFormat = `${dayName}, ${segmentStart}-${segmentEnd}`;
            } else {
              displayFormat = `${segmentStart}-${segmentEnd}`;
            }
            
            const slicedSlot = {
              start: segmentStart,
              end: segmentEnd,
              display: displayFormat,
              originalSlot: slot,
              dayName: dayName,
              dateStr: dateStr
            };
            
            slicedSlots.push(slicedSlot);
          }
        }
      }
    }
    
    return slicedSlots;
  };

  // Get available time slots from interviewer and slice them based on plan duration
  const availableTimeSlots = matchedInterviewer?.alternativeTimeSlots 
    ? sliceTimeSlots(matchedInterviewer.alternativeTimeSlots, sessionDuration)
    : [];



  const getMatchTitle = () => {
    if (isExcellentMatch) return "Excellent Match Found! 🎯";
    if (isGoodMatch) return "Good Match Found! ✅";
    if (isPoorMatch) return "Interviewer Found ⚠️";
    return "Match Found 📋";
  };

  const getMatchDescription = () => {
    if (isExcellentMatch) return "We found an excellent interviewer with perfect skill alignment.";
    if (isGoodMatch) return "We found a good interviewer with strong skill compatibility."; 
    if (isPoorMatch) return "We found an available interviewer, but with limited skill overlap.";
    return "We found an interviewer for your requirements.";
  };

  // Show poor match warning if skill quality is poor
  if (isPoorMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <PoorMatchWarning 
              matchQuality={matchedInterviewer.skillQuality}
              matchScore={matchedInterviewer.matchScore}
              skillCategories={formData?.skillCategories || []}
              onAcceptMatch={onProceedToPayment}
              onWaitForBetter={() => {
                // For now, just go back - in future this could trigger notifications
                onGoBack();
              }}
              onModifyRequirements={onGoBack}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {getMatchTitle()}
            </h1>
            <p className="text-lg sm:text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
              {getMatchDescription()} Review the details below and proceed to secure your slot.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 xl:gap-10">
            {/* Interviewer Details */}
            <Card className="shadow-2xl backdrop-blur-lg border-2 bg-white/10 border-blue-400/30 h-fit overflow-hidden">
              <CardHeader className="text-center pb-6 px-6 pt-6">
                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 flex-shrink-0">
                  <User className="w-10 h-10 text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-blue-400 mb-2 leading-tight">
                  {matchedInterviewer?.name || matchedInterviewer?.full_name || 'Senior Interviewer'}
                </CardTitle>
                <CardDescription className="text-lg text-blue-200 leading-relaxed">
                  {matchedInterviewer?.position || 'Experienced Professional'} at {matchedInterviewer?.company || 'Top Company'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 px-6 pb-6">
                {/* Match Quality Indicator */}
                {matchedInterviewer?.skillQuality && (
                  <div className="mb-6">
                    <MatchQualityIndicator 
                      quality={matchedInterviewer.skillQuality}
                      score={matchedInterviewer.matchScore || 0}
                      maxScore={100}
                    />
                  </div>
                )}

                {/* Match Reasons */}
                {matchedInterviewer?.matchReasons && (
                  <div className="bg-white/5 backdrop-blur-sm border border-green-400/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-3">
                      <Star className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <h4 className="font-semibold text-green-400">Match Highlights:</h4>
                    </div>
                    <ul className="text-sm text-green-200 space-y-2">
                      {matchedInterviewer.matchReasons.map((reason: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Match Details */}
                {matchedInterviewer?.matchDetails && matchedInterviewer.matchDetails.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm border border-blue-400/30 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-400 mb-3">Detailed Match Analysis:</h4>
                    <ul className="text-sm text-blue-200 space-y-2">
                      {matchedInterviewer.matchDetails.map((detail: string, index: number) => (
                        <li key={index} className="leading-relaxed">• {detail}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Experience & Skills */}
                <div className="bg-white/5 backdrop-blur-sm border border-blue-400/30 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <Award className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <h4 className="font-semibold text-blue-400">Expertise</h4>
                  </div>
                  <div className="text-blue-200 text-sm space-y-2">
                    <p className="leading-relaxed"><strong>Experience:</strong> {matchedInterviewer?.experienceYears || '5+'} years</p>
                    <p className="leading-relaxed"><strong>Specialization:</strong> {formData?.skillCategories?.join(', ') || 'Technical Skills'}</p>
                    {matchedInterviewer?.companyTier && (
                      <p className="leading-relaxed"><strong>Company Tier:</strong> {matchedInterviewer.companyTier}</p>
                    )}
                  </div>
                </div>

                {/* Time Slot Information */}
                {alternativeTimeSlot ? (
                  <div className="bg-white/5 backdrop-blur-sm border border-orange-400/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <h4 className="font-semibold text-orange-400">Time Adjustment Needed</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="text-red-200 leading-relaxed">
                        <strong>Your preference:</strong> {alternativeTimeSlot.candidatePreferred}
                      </div>
                      <div className="text-green-200 leading-relaxed">
                        <strong>Interviewer available:</strong> {alternativeTimeSlot.interviewerAvailable}
                      </div>
                    </div>
                  </div>
                ) : matchedInterviewer?.hasExactTimeMatch ? (
                  <div className="bg-white/5 backdrop-blur-sm border border-green-400/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <h4 className="font-semibold text-green-400">Perfect Time Match!</h4>
                    </div>
                    <p className="text-green-200 text-sm leading-relaxed">
                      Available for your preferred time: {formData?.timeSlot}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm border border-blue-400/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <h4 className="font-semibold text-blue-400">Choose Your Interview Time</h4>
                    </div>
                    <div className="space-y-4">
                      <RadioGroup value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                        {/* Show available time slots - limit to next 2 */}
                        {availableTimeSlots && availableTimeSlots.length > 0 ? (
                          availableTimeSlots.slice(0, 2).map((slot, index) => {
                            // Use the display format as the value, which is properly formatted
                            const uniqueValue = slot.display;
                            return (
                              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-green-400/30 bg-green-400/10">
                                <RadioGroupItem value={uniqueValue} id={`alt-time-${index}`} className="mt-1 flex-shrink-0" />
                                <Label htmlFor={`alt-time-${index}`} className="flex-1 cursor-pointer">
                                  <div className="text-green-200">
                                    <strong>Available slot {index + 1}:</strong> {slot.display}
                                    <div className="text-xs text-green-300 mt-2 leading-relaxed">
                                      ✓ Confirmed available • {sessionDuration} min session
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-blue-200 text-sm p-3 rounded-lg border border-blue-400/30 bg-blue-400/10 leading-relaxed">
                            {matchedInterviewer?.alternativeTimeSlots && matchedInterviewer.alternativeTimeSlots.length > 0 
                              ? `No ${sessionDuration}-minute slots available from the provided time slots. Please contact support.`
                              : 'No time slots available. Please contact support.'
                            }
                          </div>
                        )}
                      </RadioGroup>
                      
                      {availableTimeSlots && availableTimeSlots.length > 2 && (
                        <div className="text-xs text-blue-300 text-center mt-3 leading-relaxed">
                          Showing next 2 available slots. {availableTimeSlots.length - 2} more slots available.
                        </div>
                      )}
                      
                      {selectedTimeSlot && (
                        <div className="text-center text-sm text-green-300 bg-green-400/10 p-3 rounded-lg border border-green-400/30 leading-relaxed">
                          Selected: <strong>{selectedTimeSlot}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="shadow-2xl backdrop-blur-lg border-2 bg-white/10 border-purple-400/30 h-fit overflow-hidden">
              <CardHeader className="pb-6 px-6 pt-6">
                <CardTitle className="text-2xl font-bold text-purple-400 mb-2 leading-tight">
                  Booking Summary
                </CardTitle>
                <CardDescription className="text-purple-200 leading-relaxed">
                  Your interview session details
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 px-6 pb-6">
                <div className="space-y-5">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
                    <h4 className="font-semibold text-white mb-3">Session Details</h4>
                    <div className="text-sm text-slate-300 space-y-2">
                      <div className="leading-relaxed"><strong>Skills Focus:</strong> {formData?.skillCategories?.join(', ')}</div>
                      {formData?.specificSkills && (
                        <div className="leading-relaxed"><strong>Specific Skills:</strong> {formData.specificSkills.join(', ')}</div>
                      )}
                      <div className="leading-relaxed"><strong>Experience Level:</strong> {formData?.experienceYears} years</div>
                      <div className="leading-relaxed"><strong>Session Duration:</strong> {sessionDuration} minutes</div>
                      <div className="leading-relaxed"><strong>Format:</strong> Video call with screen sharing</div>
                      <div className="leading-relaxed"><strong>Selected Plan:</strong> {formData?.selectedPlan || 'Professional'}</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/30 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-400 mb-3">What's Included:</h4>
                    <ul className="text-sm text-green-200 space-y-2">
                      {selectedPlan?.features && selectedPlan.features.length > 0 ? (
                        selectedPlan.features.map((feature: string, index: number) => (
                          <li key={index} className="leading-relaxed">• {feature}</li>
                        ))
                      ) : (
                        <>
                          <li className="leading-relaxed">• {sessionDuration}-minute focused mock interview</li>
                          <li className="leading-relaxed">• Real-time verbal feedback</li>
                          <li className="leading-relaxed">• Basic interview performance report</li>
                          <li className="leading-relaxed">• Quick tips and improvement areas</li>
                          <li className="leading-relaxed">• Interview recording (optional)</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-white mb-1">₹{selectedPlan?.price || 999}</div>
                    <div className="text-sm text-slate-400 leading-relaxed">One-time payment</div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button 
                    onClick={() => onProceedToPayment(selectedTimeSlot)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={!selectedTimeSlot}
                  >
                    {selectedTimeSlot ? 'Proceed to Payment' : 'Select a Time Slot'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <Button 
                    onClick={onGoBack}
                    variant="outline"
                    className="w-full border-2 border-slate-400/50 text-slate-400 hover:bg-slate-400/10 font-semibold py-4 rounded-xl transition-all duration-300"
                  >
                    Modify My Preferences
                  </Button>
                </div>

                <div className="text-center text-xs text-slate-400 pt-2 leading-relaxed">
                  Secure payment • 100% satisfaction guarantee
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerPreview;