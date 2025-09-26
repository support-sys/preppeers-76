import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Code, Briefcase, Award } from 'lucide-react';

interface InterviewerCardProps {
  interviewer: {
    id: string;
    position: string | null;
    experience_years: number | null;
    skills: string[] | null;
    technologies: string[] | null;
    bio: string | null;
    user_id: string;
  };
  profile: {
    full_name: string | null;
  } | null;
}

const InterviewerCard: React.FC<InterviewerCardProps> = ({ interviewer, profile }) => {
  const displayName = profile?.full_name || 'Interviewer';
  const experience = interviewer.experience_years ? `${interviewer.experience_years}+ years` : 'Experienced';
  const position = interviewer.position || 'Senior Professional';
  const skills = interviewer.skills?.slice(0, 3) || [];
  const technologies = interviewer.technologies?.slice(0, 4) || [];
  const bio = interviewer.bio || 'Experienced professional ready to help you succeed';

  return (
    <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 w-80 flex-shrink-0 mx-2">
      <CardContent className="p-6">
        {/* Header with Basic Info */}
        <div className="mb-4">
          <h3 className="text-white font-semibold text-lg mb-1">{displayName}</h3>
          <p className="text-slate-300 text-sm mb-2">{position}</p>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-yellow-400 text-sm font-medium">4.8</span>
            <span className="text-slate-400 text-sm">({experience})</span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-slate-300 text-sm mb-4 line-clamp-2">
          {bio}
        </p>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-sm font-medium">Skills</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Technologies */}
        {technologies.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Briefcase className="w-4 h-4 text-green-400" />
              <span className="text-slate-300 text-sm font-medium">Technologies</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {technologies.map((tech, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience Badge */}
        <div className="flex items-center justify-center pt-2 border-t border-white/10">
          <div className="flex items-center space-x-1 text-slate-300">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">{experience} Experience</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterviewerCard;
