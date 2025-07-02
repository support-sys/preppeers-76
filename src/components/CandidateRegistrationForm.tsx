
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CandidateFormData {
  experience: string;
  noticePeriod: string;
  resume: File | null;
  targetRole: string;
  timeSlot: string;
}

interface CandidateRegistrationFormProps {
  onSubmit: (data: CandidateFormData) => void;
  isLoading?: boolean;
}

const CandidateRegistrationForm = ({ onSubmit, isLoading = false }: CandidateRegistrationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CandidateFormData>({
    experience: "",
    noticePeriod: "",
    resume: null,
    targetRole: "",
    timeSlot: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, resume: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.experience || !formData.noticePeriod || !formData.targetRole) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create or update interviewee profile
      if (user) {
        const { error } = await supabase
          .from('interviewees')
          .upsert({
            user_id: user.id,
            experience: formData.experience,
            notice_period: formData.noticePeriod,
            target_role: formData.targetRole,
            updated_at: new Date().toISOString()
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

      onSubmit(formData);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Interview Details</CardTitle>
        <CardDescription className="text-slate-300">
          Please provide your professional information to get matched with an interviewer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Experience */}
          <div>
            <Label htmlFor="experience" className="text-white">Years of Experience *</Label>
            <Input
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              placeholder="e.g., 2 years, 0-1 year, 5+ years"
              required
              disabled={isLoading}
            />
          </div>

          {/* Notice Period */}
          <div>
            <Label className="text-white">Notice Period *</Label>
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

          {/* Resume Upload */}
          <div>
            <Label htmlFor="resume" className="text-white">Upload Resume (Optional)</Label>
            <div className="mt-2">
              <label htmlFor="resume" className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-slate-400" />
                  <p className="mb-2 text-sm text-slate-300">
                    <span className="font-semibold">Click to upload</span> or drag and drop
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
                  disabled={isLoading}
                />
              </label>
              {formData.resume && (
                <p className="text-sm text-green-400 mt-2">
                  ✓ {formData.resume.name}
                </p>
              )}
            </div>
          </div>

          {/* Target Role */}
          <div>
            <Label htmlFor="targetRole" className="text-white">Target Role *</Label>
            <select
              id="targetRole"
              name="targetRole"
              value={formData.targetRole}
              onChange={handleInputChange}
              className="w-full mt-2 bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            >
              <option value="">Select your target role</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Data Engineer">Data Engineer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Mobile Developer">Mobile Developer</option>
              <option value="Machine Learning Engineer">Machine Learning Engineer</option>
              <option value="Product Manager">Product Manager</option>
              <option value="QA Engineer">QA Engineer</option>
            </select>
          </div>

          {/* Time Slot */}
          <div>
            <Label htmlFor="timeSlot" className="text-white">Preferred Time Slot</Label>
            <Input
              id="timeSlot"
              name="timeSlot"
              type="datetime-local"
              value={formData.timeSlot}
              onChange={handleInputChange}
              className="bg-white/10 border-white/20 text-white"
              disabled={isLoading}
            />
            <p className="text-sm text-slate-400 mt-1">
              We'll try to match your preferred time, or suggest alternatives.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Finding Interviewer..." : "Find My Interviewer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CandidateRegistrationForm;
