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
    selectedCategory: "", // Changed from array to single string
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
  const [errors, setErrors] = useState<{[key: string]: string | undefined}>({});
  
  // Schedule management state
  const [availability, setAvailability] = useState<Record<string, { available: boolean; timeSlots: Array<{ id: string; start: string; end: string }> }>>({
    Monday: { available: false, timeSlots: [] },
    Tuesday: { available: false, timeSlots: [] },
    Wednesday: { available: false, timeSlots: [] },
    Thursday: { available: false, timeSlots: [] },
    Friday: { available: false, timeSlots: [] },
    Saturday: { available: false, timeSlots: [] },
    Sunday: { available: false, timeSlots: [] }
  });

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
        selectedCategory: "",
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

    setInterviewerData(prev => ({
      ...prev,
      [name]: value
    }));

      // live-validate experience years
    if (name === "experienceYears") {
      if (value === "") {
        // allow clearing; remove error
        setErrors(prev => ({ ...prev, experienceYears: undefined }));
        return;
      }

      const num = Number(value);

      if (!Number.isFinite(num)) {
        setErrors(prev => ({ ...prev, experienceYears: "Enter a valid number" }));
      } else if (num < 3) {
        setErrors(prev => ({ ...prev, experienceYears: "Minimum 3 years required" }));
      } else if (!Number.isInteger(num)) {
        // optional: if you only want whole years
        setErrors(prev => ({ ...prev, experienceYears: "Use whole years only" }));
      } else {
        setErrors(prev => ({ ...prev, experienceYears: undefined }));
      }
    }
  };

  const handleCategoryChange = (category: string) => {
    setInterviewerData(prev => {
      // Clear previous skills when category changes
      const categorySkills = skillOptions[category] || [];
      return {
        ...prev,
        selectedCategory: category,
        skills: [] // Reset skills when category changes
      };
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

  // Schedule management functions
  const handleDayToggle = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available
      }
    }));
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour <= 22; hour++) {
      options.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return options;
  };

  const formatTimeForDisplay = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
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
            end: "10:00" // Automatically 1 hour later
          }
        ]
      }
    }));
  };

  const updateTimeSlot = (day: string, slotId: string, field: 'start' | 'end', value: string) => {
    setAvailability(prev => {
      const updatedSlot = { ...prev[day]?.timeSlots.find(slot => slot.id === slotId) };
      if (!updatedSlot) return prev;
      
      updatedSlot[field] = value;
      
      // If updating start time, automatically set end time to 1 hour later
      if (field === 'start') {
        const startHour = parseInt(value.split(':')[0]);
        const endHour = Math.min(startHour + 1, 22); // Cap at 10 PM
        updatedSlot.end = `${endHour.toString().padStart(2, '0')}:00`;
      }
      
      return {
        ...prev,
        [day]: {
          ...prev[day],
          timeSlots: prev[day]?.timeSlots.map(slot =>
            slot.id === slotId ? updatedSlot : slot
          ) || []
        }
      };
    });
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

  // Validate that time slot is exactly 1 hour (60 minutes)
  const validateTimeSlot = (start: string, end: string): boolean => {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    const duration = endMinutes - startMinutes;
    return duration === 60; // Exactly 1 hour
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

      // Validate required fields
      if (!interviewerData.selectedCategory) {
        throw new Error("Please select a skill category");
      }
      
      if (interviewerData.skills.length === 0) {
        throw new Error("Please select at least one skill from the chosen category");
      }
      
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

      // Validate schedule if any days are selected
      const selectedDays = Object.keys(availability).filter(day => availability[day]?.available);
      if (selectedDays.length > 0) {
        for (const day of selectedDays) {
          if (availability[day]?.timeSlots.length === 0) {
            throw new Error(`${day} is selected but has no time slots. Please add time slots or uncheck ${day}.`);
          }
          
          // Validate that all time slots are exactly 1 hour
          for (const slot of availability[day].timeSlots) {
            if (!validateTimeSlot(slot.start, slot.end)) {
              throw new Error(`Time slot on ${day} must be exactly 1 hour (60 minutes). Current: ${slot.start} to ${slot.end}`);
            }
          }
        }
      }

      // Prepare availability data
      const availableDays = Object.keys(availability).filter(day => availability[day]?.available);
      const timeSlots: Record<string, Array<{ id: string; start: string; end: string }>> = {};
      
      // Add time slots for selected days
      for (const day of availableDays) {
        timeSlots[day] = availability[day].timeSlots;
      }

      const profileData = {
        experience_years: parseInt(interviewerData.experienceYears),
        company: interviewerData.company,
        position: interviewerData.position,
        skills: [interviewerData.selectedCategory], // Store single category in array format for backward compatibility
        technologies: interviewerData.skills, // Store individual skills in technologies for backward compatibility
        availability_days: availableDays,
        time_slots: timeSlots,
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
              skills: [interviewerData.selectedCategory],
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

    const availableSkills = interviewerData.selectedCategory ? 
    skillOptions[interviewerData.selectedCategory] || [] : [];

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
                    placeholder="Minimum 3 Years Experience Required for Interviewer"
                    min={3}
                    step={1} // optional: whole numbers only
                    aria-invalid={!!errors.experienceYears}
                    aria-describedby="experienceYears-error"
                    required
                  />
                   {errors.experienceYears && (
                    <p id="experienceYears-error" className="mt-1 text-sm text-red-400">
                      {errors.experienceYears}
                    </p>
                  )}
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
                  <Label className="text-white">Skill Category *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.keys(skillOptions).map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={category}
                          name="skillCategory"
                          value={category}
                          checked={interviewerData.selectedCategory === category}
                          onChange={() => handleCategoryChange(category)}
                          className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 focus:ring-blue-500 focus:ring-2"
                        />
                        <Label htmlFor={category} className="text-white">{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                {!interviewerData.selectedCategory ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-sm">
                      Please select a skill category above to see available skills
                    </p>
                  </div>
                ) : availableSkills.length > 0 ? (
                  <div>
                    <Label className="text-white">Skills *</Label>
                    <p className="text-slate-300 text-sm mb-3">
                      Select the skills you're proficient in from the {interviewerData.selectedCategory} category
                    </p>
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
                ) : null}

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

                {/* Schedule Management Section */}
                <div className="space-y-4">
                  <div className="border-t border-white/20 pt-6">
                    <h3 className="text-xl font-semibold text-white mb-4">📅 Availability Schedule</h3>
                    <p className="text-slate-300 text-sm mb-4">
                      Set your availability for interviews. Each time slot must be exactly 1 hour (60 minutes). 
                      You can always update this later from your dashboard.
                    </p>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg mb-4">
                      <p className="text-blue-100 text-sm">
                        💡 <strong>Tip:</strong> Select a start time and the end time will automatically be set to 1 hour later.
                      </p>
                    </div>
                    
                    {/* Days Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={availability[day]?.available || false}
                            onCheckedChange={() => handleDayToggle(day)}
                            className="bg-white/10 border-white/20 text-blue-500"
                          />
                          <Label htmlFor={day} className="text-white text-sm">{day}</Label>
                        </div>
                      ))}
                    </div>

                    {/* Time Slots for Selected Days */}
                    {Object.keys(availability).filter(day => availability[day]?.available).map((day) => (
                      <div key={day} className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="text-white font-medium mb-3">{day} Time Slots</h4>
                        
                        {/* Existing Time Slots */}
                        {availability[day]?.timeSlots.map((slot) => (
                          <div key={slot.id} className="flex items-center space-x-2 mb-2">
                            <Select 
                              value={slot.start} 
                              onValueChange={(value) => updateTimeSlot(day, slot.id, 'start', value)}
                            >
                              <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {generateTimeOptions().map(time => (
                                  <SelectItem key={time} value={time}>
                                    {formatTimeForDisplay(time)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-white">to</span>
                            <Select 
                              value={slot.end} 
                              onValueChange={(value) => updateTimeSlot(day, slot.id, 'end', value)}
                            >
                              <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {generateTimeOptions().map(time => (
                                  <SelectItem key={time} value={time}>
                                    {formatTimeForDisplay(time)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-green-400 text-sm font-medium">Duration: 1 hour</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTimeSlot(day, slot.id)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        
                        {/* Add New Time Slot Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(day)}
                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        >
                          + Add Time Slot
                        </Button>
                      </div>
                    ))}
                  </div>
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
                        Submit Profile & Schedule
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  {/* Schedule Update Note */}
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-300 mb-2">📅 Schedule Management</h4>
                    <p className="text-blue-100 text-sm">
                      You can always update your availability schedule later by going to <strong>Dashboard → Manage Schedule</strong>.
                    </p>
                  </div>
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
