
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExperienceInputProps {
  years: string;
  months: string;
  onYearsChange: (value: string) => void;
  onMonthsChange: (value: string) => void;
  label?: string;
  required?: boolean;
  minYears?: number;
  showTotal?: boolean;
  className?: string;
}

const ExperienceInput = ({
  years,
  months,
  onYearsChange,
  onMonthsChange,
  label = "Experience",
  required = false,
  minYears = 0,
  showTotal = false,
  className = ""
}: ExperienceInputProps) => {
  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    if (value === "" || (!isNaN(numValue) && numValue >= 0)) {
      onYearsChange(value);
    }
  };

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    if (value === "" || (!isNaN(numValue) && numValue >= 0 && numValue <= 11)) {
      onMonthsChange(value);
    }
  };

  const getTotalExperience = () => {
    const totalYears = parseInt(years) || 0;
    const totalMonths = parseInt(months) || 0;
    return totalYears * 12 + totalMonths;
  };

  const totalExperienceMonths = getTotalExperience();
  const displayYears = Math.floor(totalExperienceMonths / 12);
  const displayMonths = totalExperienceMonths % 12;
  const minExperienceMonths = minYears * 12;

  return (
    <div className={className}>
      <Label className="text-white">
        {label} {required && "*"}
      </Label>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <Input
            type="number"
            value={years}
            onChange={handleYearsChange}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
            placeholder="Years"
            min={0}
          />
        </div>
        <div>
          <Input
            type="number"
            value={months}
            onChange={handleMonthsChange}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
            placeholder="Months (0-11)"
            min={0}
            max={11}
          />
        </div>
      </div>
      
      {showTotal && (
        <div className="text-sm mt-2">
          <p className="text-slate-300">
            Total: {displayYears} years {displayMonths} months
          </p>
          {minYears > 0 && totalExperienceMonths < minExperienceMonths && (
            <p className="text-red-400 mt-1">
              ⚠️ Minimum {minYears} years of experience required
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExperienceInput;
