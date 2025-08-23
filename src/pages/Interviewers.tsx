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
    githubUrl: "",
    payoutMethod: "",
    upiId: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    accountHolderName: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncingToSheets, setSyncingToSheets] = useState(false);
  const [isProfileLocked, setIsProfileLocked] = useState(false);

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
    
    // Get basic profile data (non-sensitive)
    const { data } = await supabase
      .from('interviewers')
      .select('id, bio, linkedin_url, github_url, company, position, skills, technologies, experience_years, availability_days, is_eligible, payout_details_verified, payout_details_submitted_at, payout_details_locked')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get sensitive payout details using secure function
    const { data: payoutData } = await supabase.rpc('get_my_payout_details');

    if (data) {
      // Check if profile is locked (has payout details submitted)
      const profileLocked = data.payout_details_submitted_at !== null;
      setIsProfileLocked(profileLocked);
      
      setInterviewerData({
        experienceYears: data.experience_years?.toString() || "",
        company: data.company || "",
        position: data.position || "",
        selectedCategories: [],
        skills: data.technologies || [],
        bio: data.bio || "",
        linkedinUrl: data.linkedin_url || "",
        githubUrl: data.github_url || "",
        payoutMethod: payoutData?.[0]?.payout_method || "",
        upiId: payoutData?.[0]?.upi_id || "",
        bankName: payoutData?.[0]?.bank_name || "",
        bankAccountNumber: payoutData?.[0]?.bank_account_number || "",
        bankIfscCode: payoutData?.[0]?.bank_ifsc_code || "",
        accountHolderName: payoutData?.[0]?.account_holder_name || ""
      });
      
      // If profile is locked, mark as submitted to show read-only view
      if (profileLocked) {
        setIsSubmitted(true);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
     // Convert value to number if it's the experienceYears field
    if (name === "experienceYears") {
      const numValue = Number(value);
      if (numValue < 3 && value !== "") {
        return; // ❌ stop updating state if less than 3 (but allow empty so user can clear input)
      }
    }
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

      // Validate payout details
      if (!interviewerData.payoutMethod) {
        throw new Error("Please select a payout method");
      }
      
      if (interviewerData.payoutMethod === 'upi' && !interviewerData.upiId) {
        throw new Error("Please enter your UPI ID");
      }
      
      if (interviewerData.payoutMethod === 'bank_account') {
        if (!interviewerData.bankName || !interviewerData.bankAccountNumber || !interviewerData.bankIfscCode || !interviewerData.accountHolderName) {
          throw new Error("Please fill all bank account details");
        }
      }

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
        github_url: interviewerData.githubUrl,
        payout_details_submitted_at: new Date().toISOString(),
        payout_details_locked: true
      };

      if (existingData) {
        // Update existing record
        const { error: profileError } = await supabase
          .from('interviewers')
          .update(profileData)
          .eq('user_id', user.id);

        if (profileError) throw profileError;
      } else {
        // Insert new record
        const { error: profileError } = await supabase
          .from('interviewers')
          .insert({
            user_id: user.id,
            ...profileData
          });

        if (profileError) throw profileError;
      }

      // Handle financial data using secure function
      const { error: financialError } = await supabase.rpc('update_my_payout_details', {
        p_payout_method: interviewerData.payoutMethod,
        p_upi_id: interviewerData.payoutMethod === 'upi' ? interviewerData.upiId : null,
        p_bank_name: interviewerData.payoutMethod === 'bank_account' ? interviewerData.bankName : null,
        p_bank_account_number: interviewerData.payoutMethod === 'bank_account' ? interviewerData.bankAccountNumber : null,
        p_bank_ifsc_code: interviewerData.payoutMethod === 'bank_account' ? interviewerData.bankIfscCode : null,
        p_account_holder_name: interviewerData.payoutMethod === 'bank_account' ? interviewerData.accountHolderName : null
      });

      if (financialError) {
        console.error("Financial data error:", financialError);
        throw financialError;
      }

      // Send welcome email for new registrations
      if (!existingData) {
        try {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          await supabase.functions.invoke('send-interviewer-welcome', {
            body: {
              interviewer_name: userProfile?.full_name || user.email,
              interviewer_email: user.email,
              company: interviewerData.company,
              position: interviewerData.position,
              experience_years: parseInt(interviewerData.experienceYears),
              skills: interviewerData.selectedCategories,
              technologies: interviewerData.skills,
              payout_method: interviewerData.payoutMethod
            }
          });

          console.log("Welcome email sent successfully");
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't fail the registration if email fails
        }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-2xl">
                {isProfileLocked ? "Profile Locked" : "Profile Complete!"}
              </CardTitle>
              <CardDescription className="text-slate-300">
                {isProfileLocked 
                  ? "Your profile details are locked for security. Contact support to make changes."
                  : "Your interviewer profile has been successfully created and submitted."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isProfileLocked && (
                <div className="bg-amber-500/20 border border-amber-500/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-amber-300 mb-2">🔒 Profile Locked</h4>
                  <p className="text-amber-100 text-sm">
                    Your profile details are locked for security purposes. This includes your experience, 
                    company, position, skills, and payout information. If you need to make changes, 
                    please contact our support team at{" "}
                    <a href="mailto:support@interviewise.in" className="text-amber-300 underline">
                      support@interviewise.in
                    </a>
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {!isProfileLocked && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSubmitted(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
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
                    min={3}
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
                  <Label htmlFor="linkedinUrl" className="text-white">LinkedIn URL *</Label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    value={interviewerData.linkedinUrl}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    placeholder="Enter your LinkedIn URL"
                    required
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

                {/* Payout Details Section */}
                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-xl font-semibold text-white mb-4">💰 Payout Information</h3>
                  <p className="text-slate-300 text-sm mb-6">
                    <strong>Important:</strong> Payout details cannot be changed easily once submitted. 
                    If you need to update them later, you'll need to contact support@interviewise.in
                  </p>
                  
                  {/* Payout Method */}
                  <div className="mb-4">
                    <Label className="text-white">Payout Method *</Label>
                    <Select 
                      value={interviewerData.payoutMethod} 
                      onValueChange={(value) => setInterviewerData(prev => ({ ...prev, payoutMethod: value }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select payout method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_account">Bank Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* UPI Details */}
                  {interviewerData.payoutMethod === 'upi' && (
                    <div>
                      <Label htmlFor="upiId" className="text-white">UPI ID *</Label>
                      <Input
                        id="upiId"
                        name="upiId"
                        type="text"
                        value={interviewerData.upiId}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        placeholder="Enter your UPI ID (e.g., name@paytm)"
                        required
                      />
                    </div>
                  )}

                  {/* Bank Account Details */}
                  {interviewerData.payoutMethod === 'bank_account' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="accountHolderName" className="text-white">Account Holder Name *</Label>
                        <Input
                          id="accountHolderName"
                          name="accountHolderName"
                          type="text"
                          value={interviewerData.accountHolderName}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter account holder name"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bankName" className="text-white">Bank Name *</Label>
                        <Input
                          id="bankName"
                          name="bankName"
                          type="text"
                          value={interviewerData.bankName}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter bank name"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bankAccountNumber" className="text-white">Account Number *</Label>
                        <Input
                          id="bankAccountNumber"
                          name="bankAccountNumber"
                          type="text"
                          value={interviewerData.bankAccountNumber}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter account number"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bankIfscCode" className="text-white">IFSC Code *</Label>
                        <Input
                          id="bankIfscCode"
                          name="bankIfscCode"
                          type="text"
                          value={interviewerData.bankIfscCode}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter IFSC code"
                          required
                        />
                      </div>
                    </div>
                  )}
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
