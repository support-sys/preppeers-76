
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, DollarSign, Clock, Network, Users, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const Interviewers = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    linkedin: "",
    skillCategory: "",
    skills: [] as string[],
    experience: "",
    availableDays: [] as string[],
    timeSlots: [] as string[],
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const skillCategories = {
    "Frontend Development": [
      "React", "Angular", "Vue.js", "JavaScript", "TypeScript", "HTML/CSS", 
      "Next.js", "Svelte", "Redux", "Webpack", "Sass/SCSS"
    ],
    "Backend Development": [
      "Node.js", "Python", "Java", "C#", "PHP", "Ruby", "Go", "Rust", 
      "Express.js", "Django", "Spring Boot", "Laravel", "Ruby on Rails"
    ],
    "Mobile Development": [
      "React Native", "Flutter", "iOS (Swift)", "Android (Kotlin/Java)", 
      "Xamarin", "Ionic", "PhoneGap/Cordova"
    ],
    "Data Science & AI": [
      "Python", "R", "SQL", "Machine Learning", "Deep Learning", "TensorFlow", 
      "PyTorch", "Pandas", "NumPy", "Scikit-learn", "Apache Spark"
    ],
    "DevOps & Cloud": [
      "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", 
      "GitLab CI/CD", "Terraform", "Ansible", "Linux"
    ],
    "Database": [
      "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", 
      "Oracle", "SQL Server", "Elasticsearch"
    ]
  };

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const timeSlots = [
    "9:00 AM - 12:00 PM",
    "12:00 PM - 3:00 PM", 
    "3:00 PM - 6:00 PM",
    "6:00 PM - 9:00 PM",
    "9:00 PM - 12:00 AM"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, skillCategory: value, skills: [] }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const handleTimeSlotToggle = (timeSlot: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(timeSlot)
        ? prev.timeSlots.filter(t => t !== timeSlot)
        : [...prev.timeSlots, timeSlot]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.skillCategory || formData.skills.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select at least one skill.",
        variant: "destructive",
      });
      return;
    }

    if (formData.availableDays.length === 0) {
      toast({
        title: "Missing Availability",
        description: "Please select at least one available day.",
        variant: "destructive",
      });
      return;
    }

    console.log("Interviewer application submitted:", formData);
    
    // Navigate to payment page with form data
    navigate('/interviewer-payment', { state: { interviewerData: formData } });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white mb-4">Application Submitted!</h1>
              <p className="text-xl text-slate-300 mb-8">
                Thank you for your interest in becoming an interviewer. We'll review your profile and contact you within 24 hours at {formData.email}.
              </p>
              <Link to="/">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Back to Home
                </Button>
              </Link>
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Become an Interviewer
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Share your expertise, earn flexible income, and help shape the next generation of IT professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Apply to Become an Interviewer</CardTitle>
                  <CardDescription className="text-slate-300">
                    Tell us about your experience and expertise.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-white">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-white">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="linkedin" className="text-white">LinkedIn Profile</Label>
                      <Input
                        id="linkedin"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Skill Category *</Label>
                      <Select value={formData.skillCategory} onValueChange={handleSkillCategoryChange}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select your primary expertise area" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {Object.keys(skillCategories).map((category) => (
                            <SelectItem key={category} value={category} className="text-white hover:bg-slate-700">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.skillCategory && (
                      <div>
                        <Label className="text-white">Specific Technologies *</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 p-4 bg-white/5 rounded-lg border border-white/10">
                          {skillCategories[formData.skillCategory as keyof typeof skillCategories].map((skill) => (
                            <div key={skill} className="flex items-center space-x-2">
                              <Checkbox
                                id={skill}
                                checked={formData.skills.includes(skill)}
                                onCheckedChange={() => handleSkillToggle(skill)}
                                className="border-white/40 data-[state=checked]:bg-blue-600"
                              />
                              <Label htmlFor={skill} className="text-slate-300 text-sm cursor-pointer">
                                {skill}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="experience" className="text-white">Years of Experience</Label>
                      <Input
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        placeholder="e.g., 5 years"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Available Days *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 p-4 bg-white/5 rounded-lg border border-white/10">
                        {daysOfWeek.map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={day}
                              checked={formData.availableDays.includes(day)}
                              onCheckedChange={() => handleDayToggle(day)}
                              className="border-white/40 data-[state=checked]:bg-blue-600"
                            />
                            <Label htmlFor={day} className="text-slate-300 text-sm cursor-pointer">
                              {day}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Available Time Slots</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 p-4 bg-white/5 rounded-lg border border-white/10">
                        {timeSlots.map((timeSlot) => (
                          <div key={timeSlot} className="flex items-center space-x-2">
                            <Checkbox
                              id={timeSlot}
                              checked={formData.timeSlots.includes(timeSlot)}
                              onCheckedChange={() => handleTimeSlotToggle(timeSlot)}
                              className="border-white/40 data-[state=checked]:bg-blue-600"
                            />
                            <Label htmlFor={timeSlot} className="text-slate-300 text-sm cursor-pointer">
                              {timeSlot}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                    >
                      Continue to Payment Details
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Benefits Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Why Become an Interviewer?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold">Flexible Income</h4>
                      <p className="text-slate-300 text-sm">Earn ₹500-₹1500 per session</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold">Work Flexibly</h4>
                      <p className="text-slate-300 text-sm">Set your own schedule</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Network className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold">Build Network</h4>
                      <p className="text-slate-300 text-sm">Connect with professionals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">What Our Interviewers Say</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-l-2 border-blue-400 pl-4">
                    <p className="text-slate-300 text-sm italic">
                      "Great way to give back to the community while earning extra income."
                    </p>
                    <p className="text-blue-400 text-sm mt-1">- Senior Engineer @ Tech Corp</p>
                  </div>
                  <div className="border-l-2 border-green-400 pl-4">
                    <p className="text-slate-300 text-sm italic">
                      "Flexible schedule that works with my full-time job."
                    </p>
                    <p className="text-green-400 text-sm mt-1">- Lead Developer @ Startup</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Interviewers;
