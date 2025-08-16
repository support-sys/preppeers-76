import { Star, AlertTriangle, CheckCircle, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MatchQualityIndicatorProps {
  quality: 'excellent' | 'good' | 'poor' | 'none';
  score: number;
  maxScore: number;
}

const MatchQualityIndicator = ({ quality, score, maxScore }: MatchQualityIndicatorProps) => {
  const getQualityConfig = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return {
          icon: Award,
          label: 'Excellent Match',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-400/30',
          description: 'Perfect skill alignment and experience level'
        };
      case 'good':
        return {
          icon: CheckCircle,
          label: 'Good Match',
          color: 'text-blue-400', 
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-400/30',
          description: 'Strong skill compatibility with good experience fit'
        };
      case 'poor':
        return {
          icon: AlertTriangle,
          label: 'Limited Match',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20', 
          borderColor: 'border-orange-400/30',
          description: 'Some skill overlap but may not be ideal fit'
        };
      default:
        return {
          icon: Star,
          label: 'General Match',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-400/30', 
          description: 'Experience-based match with limited skill overlap'
        };
    }
  };

  const config = getQualityConfig(quality);
  const Icon = config.icon;
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className={`${config.bgColor} backdrop-blur-sm border ${config.borderColor} p-4 rounded-xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <span className={`font-semibold ${config.color}`}>{config.label}</span>
        </div>
        <Badge variant="outline" className={`${config.color} border-current`}>
          {score}/{maxScore} pts ({percentage}%)
        </Badge>
      </div>
      <p className={`text-sm ${config.color.replace('400', '200')}`}>
        {config.description}
      </p>
    </div>
  );
};

export default MatchQualityIndicator;