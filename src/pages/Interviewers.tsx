import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ArrowRight } from "lucide-react";
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
  "System Design": ["Microservices", "Database Design", "Scalability", "Load Balancing", "Caching", "API Design"]
};

/* 

"Mobile Development": ["React Native", "Flutter", "iOS (Swift)", "Android (Kotlin)", "Ionic", "Xamarin"],
  "DevOps & Cloud": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible"],
  "Data Science & AI": ["Python", "R", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "SQL"],
*/

const Interviewers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [interviewerData, setInterviewerData] = useState({
    experienceYears: "",
    company: "",
    position: "",
    selectedCategories: [] as string[],
    skills: [] as string[],
    bio: "",
    linkedinUrl: "",
    githubUrl: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncingToSheets, setSyncingToSheets] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole !== 'interviewer') {
      toast({
        title: "Access Denied",
        description: "This page is only for interviewers.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    loadExistingData();
  }, [user, userRole]);

  const loadExistingData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('interviewers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setInterviewerData({
        experienceYears: data.experience_years?.toString() || "",
        company: data.company || "",
        position: data.position || "",
        selectedCategories: [],
        skills: data.technologies || [],
        bio: data.bio || "",
        linkedinUrl: data.linkedin_url || "",
        githubUrl: data.github_url || ""
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInterviewerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (category: string) => {
    setInterviewerData(prev => {
      let newCategories = [...prev.selectedCategories];
      if (newCategories.includes(category)) {
        newCategories = newCategories.filter(c => c !== category);
        // Remove all skills from this category
        const categorySkills = skillOptions[category];
        const filteredSkills = prev.skills.filter(skill => !categorySkills.includes(skill));
        return {
          ...prev,
          selectedCategories: newCategories,
          skills: filteredSkills
        };
      } else {
        newCategories.push(category);
        return {
          ...prev,
          selectedCategories: newCategories
        };
      }
    });
  };

  const handleSkillChange = (skill: string) => {
    setInterviewerData(prev => {
      let newSkills = [...prev.skills];
      if (newSkills.includes(skill)) {
        newSkills = newSkills.filter(s => s !== skill);
      } else {
        newSkills.push(skill);
      }
      return {
        ...prev,
        skills: newSkills
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if interviewer record exists
      const { data: existingData } = await supabase
        .from('interviewers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const profileData = {
        experience_years: parseInt(interviewerData.experienceYears),
        company: interviewerData.company,
        position: interviewerData.position,
        skills: interviewerData.selectedCategories, // Store skill categories in the skills field
        technologies: interviewerData.skills, // Store individual skills in technologies for backward compatibility
        availability_days: [],
        time_slots: {},
        bio: interviewerData.bio,
        linkedin_url: interviewerData.linkedinUrl,
        github_url: interviewerData.githubUrl
      };

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('interviewers')
          .update(profileData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('interviewers')
          .insert({
            user_id: user.id,
            ...profileData
          });

        if (error) throw error;
      }

      // Database save successful
      toast({
        title: "Profile Saved!",
        description: "Your interviewer profile has been saved to the database."
      });

      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Database save failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive"
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
                Thank you for updating your profile. You can now manage your schedule and availability in the dashboard!
              </p>
              <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const availableSkills = interviewerData.selectedCategories.flatMap(category => 
    skillOptions[category] || []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Interviewer Profile
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Share your expertise and help candidates ace their interviews. Complete your profile to get started.
            </p>
          </div>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Professional Information</CardTitle>
              <CardDescription className="text-slate-300">
                Provide details about your experience and skills.
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
                  <Label htmlFor="company" className="text-white">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={interviewerData.company}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="Enter your company"
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

                {/* Skill Categories */}
                <div>
                  <Label className="text-white">Skill Categories *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.keys(skillOptions).map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={interviewerData.selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryChange(category)}
                          className="bg-white/10 border-white/20 text-blue-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <Label htmlFor={category} className="text-white">{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                {availableSkills.length > 0 && (
                  <div>
                    <Label className="text-white">Skills *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableSkills.map(skill => (
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
                  disabled={loading || syncingToSheets}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 4V2m0 16v2m8-8h2M4 12H2M17.66 6.34l1.42-1.42M6.34 17.66l-1.42 1.42M6.34 6.34L4.93 4.93M17.66 17.66l-1.42 1.42" />
                      </svg>
                      Saving Profile...
                    </>
                  ) : syncingToSheets ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 4V2m0 16v2m8-8h2M4 12H2M17.66 6.34l1.42-1.42M6.34 17.66l-1.42 1.42M6.34 6.34L4.93 4.93M17.66 17.66l-1.42 1.42" />
                      </svg>
                      Syncing to Google Sheets...
                    </>
                  ) : (
                    <>
                      Submit Profile
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
