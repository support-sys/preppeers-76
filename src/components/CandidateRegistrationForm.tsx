
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ExperienceInput from './ExperienceInput';

interface CandidateData {
  name: string;
  email: string;
  mobile: string;
  experienceYears: string;
  experienceMonths: string;
  targetRole: string;
  currentPosition: string;
  noticePeriod: string;
  githubUrl: string;
  linkedinUrl: string;
  bio: string;
}

interface CandidateRegistrationFormProps {
  onSubmit: (data: CandidateData) => void;
  loading?: boolean;
}

const CandidateRegistrationForm = ({ onSubmit, loading = false }: CandidateRegistrationFormProps) => {
  const [formData, setFormData] = useState<CandidateData>({
    name: '',
    email: '',
    mobile: '',
    experienceYears: '',
    experienceMonths: '',
    targetRole: '',
    currentPosition: '',
    noticePeriod: '',
    githubUrl: '',
    linkedinUrl: '',
    bio: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExperienceChange = (years: string, months: string) => {
    setFormData(prev => ({
      ...prev,
      experienceYears: years,
      experienceMonths: months
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getTotalExperience = () => {
    const years = parseInt(formData.experienceYears) || 0;
    const months = parseInt(formData.experienceMonths) || 0;
    return years * 12 + months;
  };

  // Format experience for display (e.g., "2.5 years" for 2 years 6 months)
  const getExperienceDisplay = () => {
    const totalMonths = getTotalExperience();
    if (totalMonths === 0) return "0 years";
    
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Label htmlFor="email" className="text-white">Email *</Label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="mobile" className="text-white">Mobile Number *</Label>
          <Input
            id="mobile"
            name="mobile"
            type="tel"
            value={formData.mobile}
            onChange={handleInputChange}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
            placeholder="Enter your mobile number"
            required
          />
        </div>
        
        <ExperienceInput
          years={formData.experienceYears}
          months={formData.experienceMonths}
          onYearsChange={(years) => handleExperienceChange(years, formData.experienceMonths)}
          onMonthsChange={(months) => handleExperienceChange(formData.experienceYears, months)}
          label="Professional Experience"
          required
          showTotal
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="targetRole" className="text-white">Target Role *</Label>
          <Input
            id="targetRole"
            name="targetRole"
            value={formData.targetRole}
            onChange={handleInputChange}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
            placeholder="e.g., Software Engineer, Product Manager"
            required
          />
        </div>
        <div>
          <Label htmlFor="currentPosition" className="text-white">Current Position</Label>
          <Input
            id="currentPosition"
            name="currentPosition"
            value={formData.currentPosition}
            onChange={handleInputChange}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
            placeholder="Enter your current position"
          />
        </div>
      </div>

      <div>
        <Label className="text-white">Notice Period</Label>
        <Select 
          value={formData.noticePeriod} 
          onValueChange={(value) => handleSelectChange('noticePeriod', value)}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select your notice period" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="immediate" className="text-white hover:bg-slate-700">
              Immediate (0-15 days)
            </SelectItem>
            <SelectItem value="1-month" className="text-white hover:bg-slate-700">
              1 Month
            </SelectItem>
            <SelectItem value="2-months" className="text-white hover:bg-slate-700">
              2 Months
            </SelectItem>
            <SelectItem value="3-months" className="text-white hover:bg-slate-700">
              3 Months
            </SelectItem>
            <SelectItem value="more-than-3" className="text-white hover:bg-slate-700">
              More than 3 Months
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio" className="text-white">Professional Summary</Label>
        <Textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 resize-none"
          placeholder="Brief summary of your professional background, key skills, and career goals"
          rows={4}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 4V2m0 16v2m8-8h2M4 12H2M17.66 6.34l1.42-1.42M6.34 17.66l-1.42 1.42M6.34 6.34L4.93 4.93M17.66 17.66l-1.42 1.42" />
            </svg>
            Processing...
          </>
        ) : (
          'Continue to Payment'
        )}
      </Button>
    </form>
  );
};

export default CandidateRegistrationForm;
