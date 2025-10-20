import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { ReadinessQuestion } from '@/config/readinessQuestions';

interface ReadinessQuestionsProps {
  questions: ReadinessQuestion[];
  onComplete: (answers: number[]) => void;
  targetRole: string;
}

export const ReadinessQuestions = ({ questions, onComplete, targetRole }: ReadinessQuestionsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentIndex + 1 >= questions.length) {
      // Assessment complete
      onComplete(newAnswers);
    } else {
      setCurrentIndex(currentIndex + 1);
      // Scroll to top for next question
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(answers[currentIndex - 1]);
      setAnswers(answers.slice(0, -1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'behavioral': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'scenario': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Progress Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between items-center text-xs md:text-sm text-slate-300 mb-3">
          <span className="font-medium">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-blue-400 font-semibold">
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Role Display */}
        <p className="text-center text-slate-400 text-xs md:text-sm mt-3">
          Assessment for: <span className="text-blue-400 font-semibold">{targetRole}</span>
        </p>
      </div>

      {/* Question Card */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl mb-6">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Category Badge */}
          <div className="mb-4 md:mb-6">
            <span className={`inline-block px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs font-semibold border ${getCategoryColor(currentQuestion.category)}`}>
              {currentQuestion.category.toUpperCase()}
            </span>
          </div>

          {/* Question Text */}
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-6 md:mb-8 leading-relaxed">
            {currentQuestion.question}
          </h3>

          {/* Answer Options */}
          <div className="space-y-2 md:space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedAnswer(index)}
                className={`w-full text-left p-3 md:p-4 lg:p-5 rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswer === index
                    ? 'border-blue-400 bg-blue-500/20 text-white shadow-lg scale-[1.01] md:scale-[1.02]'
                    : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-start md:items-center">
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 mr-3 md:mr-4 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 md:mt-0 ${
                    selectedAnswer === index 
                      ? 'border-blue-400 bg-blue-400' 
                      : 'border-slate-500'
                  }`}>
                    {selectedAnswer === index && <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                  </div>
                  <span className="flex-1 text-sm md:text-base leading-relaxed">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 w-full md:w-auto order-2 md:order-1"
        >
          <ChevronLeft className="mr-2 w-4 h-4" />
          Previous
        </Button>

        <div className="text-center flex-1 order-1 md:order-2">
          <p className="text-xs md:text-sm text-slate-400">
            {selectedAnswer !== null ? 'Click Next to continue' : 'Select an answer to continue'}
          </p>
        </div>

        <Button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto order-3"
        >
          {currentIndex + 1 === questions.length ? 'See Results' : 'Next Question'}
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1 md:gap-2 mt-6 md:mt-8 overflow-x-auto pb-2">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 md:h-2 rounded-full transition-all flex-shrink-0 ${
              index < currentIndex 
                ? 'w-1.5 md:w-2 bg-green-400' 
                : index === currentIndex 
                ? 'w-6 md:w-8 bg-blue-400' 
                : 'w-1.5 md:w-2 bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};




