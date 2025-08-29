import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, ChevronDown, User, Settings, Clock, Link, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PlanSelection from "./PlanSelection";
import TimeSlotPicker from "./TimeSlotPicker";
import { getDefaultPlan, getPlanById } from "@/utils/planConfig";

/*
const skillOptions = {
  "Frontend Development": ["React", "Vue.js", "Angular", "JavaScript", "TypeScript", "HTML/CSS", "Next.js", "Svelte"],
  "Backend Development": ["Node.js", "Python", "Java", "Go", "Ruby", "PHP", "C#", ".NET", "Spring Boot"],
  "Full Stack Development": ["MERN Stack", "MEAN Stack", "Django", "Rails", "Laravel", "Express.js"]
};*/

const skillOptions = {
  "Frontend Developer": [
    "HTML", "CSS", "JavaScript", "TypeScript",
    "React", "Vue.js", "Angular", "Svelte", "Next.js",
    "State Management (Redux, Vuex, Pinia)",
    "Responsive Design", "API Integration", "Jest", "Cypress"
  ],
  "Java Backend Developer": [
    "Java", "Spring Boot", "Hibernate/JPA",
    "REST APIs", "Microservices", "SQL", "NoSQL",
    "Kafka", "RabbitMQ", "Redis", "Docker", "Kubernetes",
    "CI/CD (Jenkins, GitHub Actions)", "JUnit", "Mockito"
  ],
  "Python Backend Developer": [
    "Python", "Django", "Flask", "FastAPI",
    "REST APIs", "SQLAlchemy", "PostgreSQL", "MySQL",
    "Celery", "Redis", "Microservices", "Docker",
    "Kubernetes", "CI/CD", "Pytest"
  ],
  ".NET Backend Developer": [
    "C#", ".NET Core", "ASP.NET", "Entity Framework",
    "SQL Server", "REST APIs", "Microservices",
    "Docker", "Kubernetes", "CI/CD", "Redis", "xUnit"
  ],
  "Full Stack Developer": [
    "Angular", "React", "Node.js", "Express.js", "Java", "Spring Boot", "MongoDB",
    "JavaScript", "TypeScript", "REST APIs", "GraphQL", "Microservices",
    "JWT/Auth", "State Management", "Docker", "CI/CD"
  ],
  "Mobile Developer (Android)": [
    "Java", "Kotlin", "Android SDK", "Jetpack Compose",
    "XML Layouts", "SQLite", "Room", "REST APIs", "Firebase",
    "Unit Testing (JUnit, Espresso)"
  ],
  "Mobile Developer (iOS)": [
    "Swift", "SwiftUI", "Objective-C",
    "iOS SDK", "CoreData", "SQLite",
    "REST APIs", "Firebase", "Unit Testing (XCTest)"
  ],
  "Mobile Developer (Cross-Platform)": [
    "React Native", "Flutter", "Dart",
    "JavaScript", "TypeScript", "REST APIs",
    "Firebase", "SQLite", "CI/CD"
  ],
  "DevOps Engineer": [
    "Linux", "Shell Scripting", "CI/CD Pipelines",
    "Docker", "Kubernetes", "Terraform", "Ansible",
    "AWS", "GCP", "Azure", "Monitoring (Prometheus, Grafana)",
    "Logging (ELK Stack)", "Git", "Networking Basics"
  ]
};
/*
"Mobile Development": ["React Native", "Flutter", "iOS (Swift)", "Android (Kotlin)", "Ionic", "Xamarin"],
  "DevOps & Cloud": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible"],
  "Data Science & AI": ["Python", "R", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "SQL"],
*/

interface CandidateFormData {
  // Professional Information
  currentPosition: string;
  company: string;
  experienceYears: number;
  bio: string;
  
  // Skills & Technologies
  skillCategories: string[];
  specificSkills: string[];
  
  // Interview Preferences
  timeSlot: string;
  noticePeriod: string;
  
  // Professional Links
  linkedinUrl: string;
  githubUrl: string;
  resume: File | null;
  resumeUrl?: string; // Added for storing uploaded resume URL
  
  // Plan Selection (NEW)
  selectedPlan?: string;
  interviewDuration?: number;
  amount?: number;
}

interface CandidateRegistrationFormProps {
  onSubmit: (data: CandidateFormData) => void;
  isLoading?: boolean;
  onStepChange?: (step: 'form' | 'plan-selection') => void;
}

const CandidateRegistrationForm = ({ onSubmit, isLoading = false, onStepChange }: CandidateRegistrationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<CandidateFormData>({
    // Professional Information
    currentPosition: "",
    company: "",
    experienceYears: 0,
    bio: "",
    
    // Skills & Technologies
    skillCategories: [],
    specificSkills: [],
    
    // Interview Preferences
    timeSlot: "",
    noticePeriod: "",
    
    // Professional Links
    linkedinUrl: "",
    githubUrl: "",
    resume: null,
    resumeUrl: "",
    
    // Plan Selection (NEW)
    selectedPlan: getDefaultPlan().id,
    interviewDuration: getDefaultPlan().duration,
    amount: getDefaultPlan().price,
  });

  const [openSections, setOpenSections] = useState({
    professional: true,
    skills: false,
    preferences: false,
    links: false,
  });

  const [uploadingResume, setUploadingResume] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Validate time slot to prevent past dates
    if (name === 'timeSlot' && value) {
      const selectedDate = new Date(value);
      const now = new Date();
      
      if (selectedDate <= now) {
        toast({
          title: "Invalid Time Selection",
          description: "Please select a future date and time for your interview.",
          variant: "destructive",
        });
        return; // Don't update the state with past time
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, resume: file }));
  };

  // Upload resume to Supabase storage
  const uploadResume = async (file: File): Promise<string | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setUploadingResume(true);
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PDF, DOC, and DOCX files are allowed');
      }

      // Generate unique filename
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `resumes/${user.id}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      console.log('Uploading resume:', fileName);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('candidate-resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading resume:', error);
        throw new Error(`Failed to upload resume: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('candidate-resumes')
        .getPublicUrl(fileName);

      console.log('Resume uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error: any) {
      console.error('Resume upload error:', error);
      throw error;
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSkillCategoryChange = (category: string) => {
    setFormData(prev => {
      // For radio button, always set to single selection
      const newCategories = [category];
      
      // Clear specific skills when category changes
      const newSpecificSkills: string[] = [];
      
      return {
        ...prev,
        skillCategories: newCategories,
        specificSkills: newSpecificSkills
      };
    });
  };

  const handleSpecificSkillChange = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      specificSkills: prev.specificSkills.includes(skill)
        ? prev.specificSkills.filter(s => s !== skill)
        : [...prev.specificSkills, skill]
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.skillCategories.length || !formData.currentPosition || !formData.resume) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Skill Categories, Current Position, Resume, Specific Skills).",
        variant: "destructive",
      });
      return;
    }

    // Validate specific skills are selected
    if (!formData.specificSkills.length) {
      toast({
        title: "Specific Skills Required",
        description: "Please select at least one specific skill from your chosen categories.",
        variant: "destructive",
      });
      return;
    }

    // Validate time slot is mandatory
    if (!formData.timeSlot) {
      toast({
        title: "Time Slot Required",
        description: "Please select your preferred interview date and time.",
        variant: "destructive",
      });
      return;
    }

    // Validate time slot is in the future
    const selectedDate = new Date(formData.timeSlot);
    const now = new Date();
    
    if (selectedDate <= now) {
      toast({
        title: "Invalid Time Selection",
        description: "Please select a future date and time for your interview.",
        variant: "destructive",
      });
      return;
    }

    // Show plan selection after form validation
    setShowPlanSelection(true);
    
    // Scroll to top immediately for better mobile UX
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 100);
  };

  const handlePlanContinue = async () => {
    try {
      // Upload resume first
      let resumeUrl = formData.resumeUrl;
      if (formData.resume && !resumeUrl) {
        console.log('Uploading resume...');
        resumeUrl = await uploadResume(formData.resume);
        if (!resumeUrl) {
          throw new Error('Failed to upload resume');
        }
      }

      // Create or update interviewee profile using upsert
      if (user) {
        const { error } = await supabase
          .from('interviewees')
          .upsert({
            user_id: user.id,
            current_position: formData.currentPosition,
            experience: formData.experienceYears.toString() + " years",
            notice_period: formData.noticePeriod,
            target_role: formData.skillCategories.join(', ') || 'Not specified',
            linkedin_url: formData.linkedinUrl || null,
            github_url: formData.githubUrl || null,
            bio: formData.bio || null,
            resume_url: resumeUrl || null, // Add resume URL to profile
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error("Error saving candidate data:", error);
          toast({
            title: "Error",
            description: "Failed to save your information. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Pass the complete form data with plan details to parent component
      const completeFormData = {
        ...formData,
        resumeUrl: resumeUrl || "",
        selectedPlan: formData.selectedPlan,
        interviewDuration: formData.interviewDuration,
        amount: formData.amount
      };

      onSubmit(completeFormData);
    } catch (error: any) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const availableSpecificSkills = formData.skillCategories.flatMap(category => 
    skillOptions[category] || []
  );

  // Scroll to top when plan selection is shown
  useEffect(() => {
    if (showPlanSelection) {
      // Scroll to top with smooth behavior
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Also scroll the document body to top for mobile browsers
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // Notify parent component about step change
      onStepChange?.('plan-selection');
    } else {
      // Notify parent component about step change
      onStepChange?.('form');
    }
  }, [showPlanSelection, onStepChange]);

  // If showing plan selection, render that instead of the form
  if (showPlanSelection) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setShowPlanSelection(false)}
            className="text-slate-400 hover:text-white"
          >
            ← Back to Form
          </Button>
        </div>
        
        <PlanSelection
          selectedPlan={formData.selectedPlan || getDefaultPlan().id}
          onPlanSelect={(planId) => {
            const plan = getPlanById(planId);
            if (plan) {
              setFormData(prev => ({
                ...prev,
                selectedPlan: planId,
                interviewDuration: plan.duration,
                amount: plan.price
              }));
            }
          }}
          onContinue={handlePlanContinue}
        />
      </div>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Professional Interview Profile</CardTitle>
        <CardDescription className="text-slate-300">
          Complete your professional profile to get matched with the best interviewer for your needs.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Professional Information Section */}
          <Collapsible 
            open={openSections.professional} 
            onOpenChange={(open) => setOpenSections(prev => ({ ...prev, professional: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span className="font-semibold">Professional Information</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${openSections.professional ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentPosition" className="text-white">Current Position *</Label>
                  <Input
                    id="currentPosition"
                    name="currentPosition"
                    value={formData.currentPosition}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="e.g., Software Engineer, Product Manager"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-white">Current Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="e.g., Google, Microsoft, Startup"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="experienceYears" className="text-white">Years of Experience</Label>
                <Input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  className="bg-white/10 border-white/20 text-white"
                  min="0"
                  max="50"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-white">About You</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 resize-none"
                  placeholder="Brief description of your background and career goals..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Skills & Technologies Section */}
          <Collapsible 
            open={openSections.skills} 
            onOpenChange={(open) => setOpenSections(prev => ({ ...prev, skills: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span className="font-semibold">Skills & Technologies</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${openSections.skills ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div>
                <Label className="text-white">Skill Categories *</Label>
                <p className="text-sm text-slate-400 mb-2">Select your primary role for matching with interviewers</p>
                <RadioGroup
                  value={formData.skillCategories[0] || ''}
                  onValueChange={(value) => handleSkillCategoryChange(value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2"
                >
                  {Object.keys(skillOptions).map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={category}
                        id={category}
                        className="bg-white/10 border-white/20"
                      />
                      <Label htmlFor={category} className="text-white">{category}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {availableSpecificSkills.length > 0 && (
                <div>
                  <Label className="text-white">Specific Skills *</Label>
                  <p className="text-sm text-slate-400 mb-2">Select all skill you want to be interviewed on</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {availableSpecificSkills.map(skill => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={formData.specificSkills.includes(skill)}
                          onCheckedChange={() => handleSpecificSkillChange(skill)}
                          className="bg-white/10 border-white/20"
                        />
                        <Label htmlFor={skill} className="text-white text-sm">{skill}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CollapsibleContent>
          </Collapsible>

          {/* Interview Preferences Section */}
          <Collapsible 
            open={openSections.preferences} 
            onOpenChange={(open) => setOpenSections(prev => ({ ...prev, preferences: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Interview Preferences</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${openSections.preferences ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">

              <div>
                <Label className="text-white">Preferred Interview Time *</Label>
                <TimeSlotPicker
                  value={formData.timeSlot}
                  onChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label className="text-white">Notice Period</Label>
                <RadioGroup
                  value={formData.noticePeriod}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, noticePeriod: value }))}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="less_than_30_days" id="notice-30" />
                    <Label htmlFor="notice-30" className="text-white">Less than 30 days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="less_than_90_days" id="notice-90" />
                    <Label htmlFor="notice-90" className="text-white">Less than 90 days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_on_notice" id="notice-none" />
                    <Label htmlFor="notice-none" className="text-white">Not on notice period</Label>
                  </div>
                </RadioGroup>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Professional Links Section */}
          <Collapsible 
            open={openSections.links} 
            onOpenChange={(open) => setOpenSections(prev => ({ ...prev, links: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-2">
                <Link className="w-5 h-5" />
                <span className="font-semibold">Professional Links & Resume</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${openSections.links ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedinUrl" className="text-white">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="https://linkedin.com/in/yourprofile"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="githubUrl" className="text-white">GitHub URL</Label>
                  <Input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    value={formData.githubUrl}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="https://github.com/yourusername"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="resume" className="text-white">Upload Resume *</Label>
                <div className="mt-2">
                  <label htmlFor="resume" className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingResume ? (
                        <Loader2 className="w-8 h-8 mb-4 text-slate-400 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 mb-4 text-slate-400" />
                      )}
                      <p className="mb-2 text-sm text-slate-300">
                        {uploadingResume ? (
                          <span className="font-semibold">Uploading...</span>
                        ) : (
                          <span className="font-semibold">Click to upload</span>
                        )} or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">PDF, DOC, or DOCX (MAX. 5MB)</p>
                    </div>
                    <input
                      id="resume"
                      name="resume"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={isLoading || uploadingResume}
                    />
                  </label>
                  {formData.resume && (
                    <p className="text-sm text-green-400 mt-2">
                      ✓ {formData.resume.name}
                    </p>
                  )}
                  {formData.resumeUrl && (
                    <p className="text-sm text-blue-400 mt-2">
                      ✓ Resume uploaded successfully
                    </p>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
          >
            {isLoading ? "Processing..." : "Continue to Plan Selection"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CandidateRegistrationForm;