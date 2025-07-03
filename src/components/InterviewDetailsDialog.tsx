
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, User, Calendar, Clock, Building, FileText, Code, Award } from 'lucide-react';
import { formatDateTimeIST } from '@/utils/dateUtils';

interface InterviewDetailsDialogProps {
  interview: any;
  userRole: 'interviewer' | 'interviewee';
  open: boolean;
  onClose: () => void;
}

const InterviewDetailsDialog = ({ interview, userRole, open, onClose }: InterviewDetailsDialogProps) => {
  // Mock data for demonstration - in real app, this would come from database
  const interviewerDetails = {
    name: "Senior Software Engineer",
    designation: "Tech Lead",
    company: "Infosys",
    rating: 4.8,
    experience: "8+ years"
  };

  const candidateDetails = {
    name: interview?.candidate_name || "N/A",
    experience: interview?.experience || "N/A",
    skills: ["React", "Node.js", "TypeScript", "AWS"],
    technologies: ["JavaScript", "Python", "Docker", "Kubernetes"],
    resumeUrl: interview?.resume_url
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Interview Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Common Interview Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDateTimeIST(interview?.scheduled_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Building className="w-4 h-4" />
              <span className="text-sm">{interview?.target_role}</span>
            </div>
          </div>

          {userRole === 'interviewee' ? (
            /* Candidate View - Interviewer Details */
            <div className="space-y-4">
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Interviewer Information
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 text-sm">Name</label>
                    <p className="text-white">{interviewerDetails.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-slate-400 text-sm">Designation</label>
                    <p className="text-white">{interviewerDetails.designation}</p>
                  </div>
                  
                  <div>
                    <label className="text-slate-400 text-sm">Company</label>
                    <p className="text-white">{interviewerDetails.company}</p>
                  </div>
                  
                  <div>
                    <label className="text-slate-400 text-sm">Experience</label>
                    <p className="text-white">{interviewerDetails.experience}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-slate-400 text-sm">Rating</label>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">{interviewerDetails.rating}</span>
                      <span className="text-slate-400 text-sm">/5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Interviewer View - Candidate Details */
            <div className="space-y-4">
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Candidate Information
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 text-sm">Name</label>
                    <p className="text-white">{candidateDetails.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-slate-400 text-sm">Email</label>
                    <p className="text-white">{interview?.candidate_email}</p>
                  </div>
                  
                  <div>
                    <label className="text-slate-400 text-sm">Experience</label>
                    <p className="text-white">{candidateDetails.experience} years</p>
                  </div>
                  
                  <div>
                    <label className="text-slate-400 text-sm flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {candidateDetails.skills.map((skill, index) => (
                        <span key={index} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-md text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-slate-400 text-sm flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Technologies
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {candidateDetails.technologies.map((tech, index) => (
                        <span key={index} className="bg-green-600/20 text-green-300 px-2 py-1 rounded-md text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {candidateDetails.resumeUrl && (
                    <div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-blue-600/20 border-blue-400/30 text-blue-300 hover:bg-blue-600/30"
                        onClick={() => window.open(candidateDetails.resumeUrl, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Resume
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-slate-700">
          <Button variant="outline" onClick={onClose} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewDetailsDialog;
