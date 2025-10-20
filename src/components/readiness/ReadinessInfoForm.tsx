import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Briefcase, Clock, ArrowRight } from 'lucide-react';
import { getAvailableRoles } from '@/config/readinessQuestions';

export interface ReadinessInfoData {
  email: string;
  name: string;
  targetRole: string;
  experienceYears: number;
}

interface ReadinessInfoFormProps {
  onSubmit: (data: ReadinessInfoData) => void;
}

export const ReadinessInfoForm = ({ onSubmit }: ReadinessInfoFormProps) => {
  const [formData, setFormData] = useState<ReadinessInfoData>({
    email: '',
    name: '',
    targetRole: '',
    experienceYears: 0
  });

  const [errors, setErrors] = useState<Partial<ReadinessInfoData>>({});

  const availableRoles = getAvailableRoles();

  const validateForm = (): boolean => {
    const newErrors: Partial<ReadinessInfoData> = {};

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your name';
    }

    if (!formData.targetRole) {
      newErrors.targetRole = 'Please select your target role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-4 px-4 md:px-6">
          <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
            Check Your Interview Readiness
          </CardTitle>
          <CardDescription className="text-base md:text-lg text-slate-300">
            Answer 15 quick questions and get instant feedback on your interview skills
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 md:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-12 text-base"
                required
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Your Name *
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-12 text-base"
                required
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Target Role Select */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Briefcase className="inline w-4 h-4 mr-2" />
                Target Role *
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full bg-slate-700/50 border-slate-600 text-white rounded-md px-3 py-3 h-12 text-base border focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select your target role</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {errors.targetRole && (
                <p className="text-red-400 text-sm mt-1">{errors.targetRole}</p>
              )}
            </div>

            {/* Experience Years Select */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Clock className="inline w-4 h-4 mr-2" />
                Years of Experience *
              </label>
              <select
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) })}
                className="w-full bg-slate-700/50 border-slate-600 text-white rounded-md px-3 py-3 h-12 text-base border focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Fresher (0 years)</option>
                <option value={1}>1-2 years</option>
                <option value={3}>3-5 years</option>
                <option value={6}>6-10 years</option>
                <option value={11}>10+ years</option>
              </select>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-base md:text-lg py-4 md:py-6 h-auto"
            >
              Start Assessment (5 minutes)
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          {/* Trust Signals */}
          <div className="mt-6 pt-6 border-t border-slate-600/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-400">✓</p>
                <p className="text-xs text-slate-400">100% Free</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">✓</p>
                <p className="text-xs text-slate-400">No Credit Card</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">✓</p>
                <p className="text-xs text-slate-400">Instant Results</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};




