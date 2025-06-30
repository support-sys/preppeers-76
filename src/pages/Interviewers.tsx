import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ArrowRight, User, Briefcase, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const skillOptions = {
  "Frontend Development": ["React", "Vue.js", "Angular", "JavaScript", "TypeScript", "HTML/CSS", "Next.js", "Svelte"],
  "Backend Development": ["Node.js", "Python", "Java", "Go", "Ruby", "PHP", "C#", ".NET", "Spring Boot"],
  "Full Stack Development": ["MERN Stack", "MEAN Stack", "Django", "Rails", "Laravel", "Express.js"],
  "Mobile Development": ["React Native", "Flutter", "iOS (Swift)", "Android (Kotlin)", "Ionic", "Xamarin"],
  "DevOps & Cloud": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible"],
  "Data Science & AI": ["Python", "R", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "SQL"],
  "System Design": ["Microservices", "Database Design", "Scalability", "Load Balancing", "Caching", "API Design"]
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Interviewers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  
  const [interviewerData, setInterviewerData] = useState({
    experienceYears: "",
    company: "",
    position: "",
    skillCategory: "",
    skills: [] as string[],
    availableDays: [] as string[],
    timeSlots: {
      morning: false,
      afternoon: false,
      evening: false
    },
    hourlyRate: "",
    bio: "",
    linkedinUrl: "",
    githubUrl: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (userRole !== 'interviewer') {
      toast({
        title: "Access Denied",
        description: "This page is only for interviewers.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    // Load existing data if available
    loadExistingData();
  }, [user, userRole]);

  const loadExistingData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('interviewers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setInterviewerData({
        experienceYears: data.experience_years?.toString() || "",
        company: data.company || "",
        position: data.position || "",
        skillCategory: "", // This will be derived from skills
        skills: data.technologies || [],
        availableDays: data.availability_days || [],
        timeSlots: data.time_slots || { morning: false, afternoon: false, evening: false },
        hourlyRate: data.hourly_rate?.toString() || "",
        bio: data.bio || "",
        linkedinUrl: data.linkedin_url || "",
        githubUrl: data.github_url || ""
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInterviewerData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillCategoryChange = (value: string) => {
    setInterviewerData(prev => ({
      ...prev,
      skillCategory: value,
      skills: [] // Clear selected skills when category changes
    }));
  };

  const handleSkillChange = (skill: string) => {
    setInterviewerData(prev => {
      let newSkills = [...prev.skills];
      if (newSkills.includes(skill)) {
        newSkills = newSkills.filter(s => s !== skill);
      } else {
        newSkills.push(skill);
      }
      return { ...prev, skills: newSkills };
    });
  };

  const handleDayChange = (day: string) => {
    setInterviewerData(prev => {
      let newDays = [...prev.availableDays];
      if (newDays.includes(day)) {
        newDays = newDays.filter(d => d !== day);
      } else {
        newDays.push(day);
      }
      return { ...prev, availableDays: newDays };
    });
  };

  const handleTimeSlotChange = (slot: string) => {
    setInterviewerData(prev => ({
      ...prev,
      timeSlots: {
        ...prev.timeSlots,
        [slot]: !prev.timeSlots[slot]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Save to Supabase
      const { error } = await supabase
        .from('interviewers')
        .upsert({
          user_id: user.id,
          experience_years: parseInt(interviewerData.experienceYears),
          company: interviewerData.company,
          position: interviewerData.position,
          skills: [], // Legacy field
          technologies: interviewerData.skills,
          availability_days: interviewerData.availableDays,
          time_slots: interviewerData.timeSlots,
          hourly_rate: parseFloat(interviewerData.hourlyRate),
          bio: interviewerData.bio,
          linkedin_url: interviewerData.linkedinUrl,
          github_url: interviewerData.githubUrl
        });

      if (error) {
        throw error;
      }

      // Sync to Google Sheets
      try {
        await fetch(`${supabase.supabaseUrl}/functions/v1/sync-to-sheets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.supabaseKey}`
          },
          body: JSON.stringify({
            type: 'interviewer',
            data: {
              email: user.email,
              experience_years: interviewerData.experienceYears,
              company: interviewerData.company,
              position: interviewerData.position,
              skills: interviewerData.skills.join(', '),
              availability_days: interviewerData.availableDays.join(', '),
              time_slots: JSON.stringify(interviewerData.timeSlots),
              hourly_rate: interviewerData.hourlyRate,
              bio: interviewerData.bio,
              linkedin_url: interviewerData.linkedinUrl,
              github_url: interviewerData.githubUrl
            }
          })
        });
      } catch (sheetsError) {
        console.error('Failed to sync to Google Sheets:', sheetsError);
        // Don't fail the main operation if sheets sync fails
      }

      setIsSubmitted(true);
      toast({
        title: "Profile Updated!",
        description: "Your interviewer profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white mb-4">Profile Updated!</h1>
              <p className="text-xl text-slate-300 mb-8">
                Thank you for updating your profile. You are now ready to conduct interviews!
              </p>
              <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Become an Interviewer
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Share your expertise and help candidates ace their interviews. Complete your profile to get started.
            </p>
          </div>

          {/* Application Form */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Interviewer Application</CardTitle>
              <CardDescription className="text-slate-300">
                Provide details about your experience, skills, and availability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Experience */}
                <div>
                  <Label htmlFor="experienceYears" className="text-white">Years of Experience *</Label>
                  <Input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    value={interviewerData.experienceYears}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="Enter years of experience"
                    required
                  />
                </div>

                {/* Company */}
                <div>
                  <Label htmlFor="company" className="text-white">Company *</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={interviewerData.company}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="Enter your company"
                    required
                  />
                </div>

                {/* Position */}
                <div>
                  <Label htmlFor="position" className="text-white">Position *</Label>
                  <Input
                    id="position"
                    name="position"
                    type="text"
                    value={interviewerData.position}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="Enter your position"
                    required
                  />
                </div>

                {/* Skill Category */}
                <div>
                  <Label className="text-white">Skill Category *</Label>
                  <Select value={interviewerData.skillCategory} onValueChange={handleSkillCategoryChange}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select a skill category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {Object.keys(skillOptions).map(category => (
                        <SelectItem key={category} value={category} className="text-white hover:bg-slate-700">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Skills */}
                {interviewerData.skillCategory && (
                  <div>
                    <Label className="text-white">Skills *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {skillOptions[interviewerData.skillCategory].map(skill => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill}
                            checked={interviewerData.skills.includes(skill)}
                            onCheckedChange={() => handleSkillChange(skill)}
                            className="bg-white/10 border-white/20 text-blue-500 focus:ring-0 focus:ring-offset-0"
                          />
                          <Label htmlFor={skill} className="text-white">{skill}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                <div>
                  <Label className="text-white">Available Days *</Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {daysOfWeek.map(day => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={interviewerData.availableDays.includes(day)}
                          onCheckedChange={() => handleDayChange(day)}
                          className="bg-white/10 border-white/20 text-blue-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <Label htmlFor={day} className="text-white">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <Label className="text-white">Available Time Slots *</Label>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="morning"
                        checked={interviewerData.timeSlots.morning}
                        onCheckedChange={() => handleTimeSlotChange("morning")}
                        className="bg-white/10 border-white/20 text-blue-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <Label htmlFor="morning" className="text-white">Morning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="afternoon"
                        checked={interviewerData.timeSlots.afternoon}
                        onCheckedChange={() => handleTimeSlotChange("afternoon")}
                        className="bg-white/10 border-white/20 text-blue-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <Label htmlFor="afternoon" className="text-white">Afternoon</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="evening"
                        checked={interviewerData.timeSlots.evening}
                        onCheckedChange={() => handleTimeSlotChange("evening")}
                        className="bg-white/10 border-white/20 text-blue-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <Label htmlFor="evening" className="text-white">Evening</Label>
                    </div>
                  </div>
                </div>

                {/* Hourly Rate */}
                <div>
                  <Label htmlFor="hourlyRate" className="text-white">Hourly Rate ($) *</Label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    value={interviewerData.hourlyRate}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="Enter your hourly rate"
                    required
                  />
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio" className="text-white">Bio *</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={interviewerData.bio}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 resize-none"
                    placeholder="Write a short bio about yourself"
                    rows={4}
                    required
                  />
                </div>

                {/* LinkedIn URL */}
                <div>
                  <Label htmlFor="linkedinUrl" className="text-white">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    value={interviewerData.linkedinUrl}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="Enter your LinkedIn URL"
                  />
                </div>

                {/* GitHub URL */}
                <div>
                  <Label htmlFor="githubUrl" className="text-white">GitHub URL</Label>
                  <Input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    value={interviewerData.githubUrl}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="Enter your GitHub URL"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 4V2m0 16v2m8-8h2M4 12H2M17.66 6.34l1.42-1.42M6.34 17.66l-1.42 1.42M6.34 6.34L4.93 4.93M17.66 17.66l-1.42 1.42"/>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Interviewers;
