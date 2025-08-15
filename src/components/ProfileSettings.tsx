import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface ProfileSettingsProps {
  onClose: () => void;
}

const ProfileSettings = ({ onClose }: ProfileSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    experienceYears: "",
    company: "",
    position: "",
    selectedCategories: [] as string[],
    skills: [] as string[],
    bio: "",
    linkedinUrl: "",
    githubUrl: ""
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('interviewers')
      .select('id, bio, linkedin_url, github_url, company, position, skills, technologies, experience_years, availability_days, is_eligible, payout_details_verified, payout_details_submitted_at, payout_details_locked')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfileData({
        experienceYears: data.experience_years?.toString() || "",
        company: data.company || "",
        position: data.position || "",
        selectedCategories: data.skills || [], // Load categories from skills field
        skills: data.technologies || [], // Load individual skills from technologies field
        bio: data.bio || "",
        linkedinUrl: data.linkedin_url || "",
        githubUrl: data.github_url || ""
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (category: string) => {
    setProfileData(prev => {
      let newCategories = [...prev.selectedCategories];
      if (newCategories.includes(category)) {
        newCategories = newCategories.filter(c => c !== category);
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
    setProfileData(prev => {
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

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("User not authenticated");

      // Check if interviewer record exists
      const { data: existingData } = await supabase
        .from('interviewers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const profileUpdateData = {
        experience_years: parseInt(profileData.experienceYears) || null,
        company: profileData.company || null,
        position: profileData.position || null,
        skills: profileData.selectedCategories, // Store skill categories in the skills field
        technologies: profileData.skills, // Store individual skills in technologies field
        bio: profileData.bio || null,
        linkedin_url: profileData.linkedinUrl || null,
        github_url: profileData.githubUrl || null
      };

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('interviewers')
          .update(profileUpdateData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('interviewers')
          .insert({
            user_id: user.id,
            ...profileUpdateData
          });

        if (error) throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile settings have been saved successfully."
      });
      
      onClose();
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const availableSkills = profileData.selectedCategories.flatMap(category => 
    skillOptions[category] || []
  );

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Profile Settings</CardTitle>
            <CardDescription className="text-slate-300">
              Update your professional information and skills
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onClose} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="experienceYears" className="text-white">Years of Experience</Label>
            <Input
              id="experienceYears"
              name="experienceYears"
              type="number"
              value={profileData.experienceYears}
              onChange={handleInputChange}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label htmlFor="company" className="text-white">Company</Label>
            <Input
              id="company"
              name="company"
              value={profileData.company}
              onChange={handleInputChange}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="position" className="text-white">Position</Label>
          <Input
            id="position"
            name="position"
            value={profileData.position}
            onChange={handleInputChange}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>

        <div>
          <Label className="text-white">Skill Categories</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.keys(skillOptions).map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={profileData.selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryChange(category)}
                  className="bg-white/10 border-white/20 text-blue-500"
                />
                <Label htmlFor={category} className="text-white">{category}</Label>
              </div>
            ))}
          </div>
        </div>

        {availableSkills.length > 0 && (
          <div>
            <Label className="text-white">Skills</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableSkills.map(skill => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={skill}
                    checked={profileData.skills.includes(skill)}
                    onCheckedChange={() => handleSkillChange(skill)}
                    className="bg-white/10 border-white/20 text-blue-500"
                  />
                  <Label htmlFor={skill} className="text-white">{skill}</Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="bio" className="text-white">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            value={profileData.bio}
            onChange={handleInputChange}
            className="bg-white/10 border-white/20 text-white resize-none"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="linkedinUrl" className="text-white">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              value={profileData.linkedinUrl}
              onChange={handleInputChange}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label htmlFor="githubUrl" className="text-white">GitHub URL</Label>
            <Input
              id="githubUrl"
              name="githubUrl"
              type="url"
              value={profileData.githubUrl}
              onChange={handleInputChange}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
