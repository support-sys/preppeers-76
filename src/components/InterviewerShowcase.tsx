import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import InterviewerCard from './InterviewerCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Interviewer {
  id: string;
  position: string | null;
  experience_years: number | null;
  skills: string[] | null;
  technologies: string[] | null;
  bio: string | null;
  user_id: string;
}

interface Profile {
  id: string;
  full_name: string | null;
}

const InterviewerShowcase: React.FC = () => {
  const { user } = useAuth();
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Fetch eligible interviewers
  const fetchInterviewers = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching interviewers...');
      console.log('👤 Current user:', user?.id, user?.email);
      
      // Fetch eligible interviewers
      const { data: interviewerData, error: interviewerError } = await supabase
        .from('interviewers')
        .select('id, position, experience_years, skills, technologies, bio, user_id, is_eligible')
        .eq('is_eligible', true)
        .order('experience_years', { ascending: false })
        .limit(20);

      console.log('✅ Eligible interviewers:', interviewerData);
      console.log('❌ Eligible interviewers error:', interviewerError);
      console.log('📊 Eligible interviewers count:', interviewerData?.length || 0);

      if (interviewerError) {
        console.error('Error fetching interviewers:', interviewerError);
        return;
      }

      if (interviewerData && interviewerData.length > 0) {
        console.log('🎉 Found eligible interviewers, setting state...');
        
        // Remove duplicates based on id
        const uniqueInterviewers = interviewerData.filter((interviewer, index, self) => 
          index === self.findIndex(i => i.id === interviewer.id)
        );
        
        console.log('📊 Unique interviewers count:', uniqueInterviewers.length);
        setInterviewers(uniqueInterviewers);
        
        // Fetch profiles for these interviewers
        const userIds = uniqueInterviewers.map(i => i.user_id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        console.log('👤 Profiles data:', profileData);
        console.log('❌ Profiles error:', profileError);

        if (profileError) {
          console.error('Error fetching profiles:', profileError);
        }
        
        // Create profile map with fallback data
        const profileMap: Record<string, Profile> = {};
        
        // Add fetched profiles
        if (profileData) {
          profileData.forEach(profile => {
            profileMap[profile.id] = profile;
          });
        }
        
        // Create fallback profiles for missing ones
        uniqueInterviewers.forEach(interviewer => {
          if (!profileMap[interviewer.user_id]) {
            const fallbackName = interviewer.position 
              ? `${interviewer.position} ${interviewer.experience_years || 0}+ years`
              : 'Interviewer';
            
            profileMap[interviewer.user_id] = {
              id: interviewer.user_id,
              full_name: fallbackName
            };
          }
        });
        
        console.log('👤 Final profile map:', profileMap);
        setProfiles(profileMap);
      } else {
        console.log('⚠️ No eligible interviewers found');
      }
    } catch (error) {
      console.error('Error in fetchInterviewers:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInterviewers();
  }, [fetchInterviewers]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling || interviewers.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % interviewers.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoScrolling, interviewers.length]);

  // Manual scroll handlers
  const scrollLeft = () => {
    setIsAutoScrolling(false);
    setCurrentIndex(prev => prev === 0 ? interviewers.length - 1 : prev - 1);
  };

  const scrollRight = () => {
    setIsAutoScrolling(false);
    setCurrentIndex(prev => (prev + 1) % interviewers.length);
  };

  // Reset auto-scroll after manual interaction
  useEffect(() => {
    if (!isAutoScrolling) {
      const timer = setTimeout(() => {
        setIsAutoScrolling(true);
      }, 10000); // Resume auto-scroll after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isAutoScrolling]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-slate-300">Loading our amazing interviewers...</p>
      </div>
    );
  }

  if (interviewers.length === 0) {
    // Show mock data for demonstration
    const mockInterviewers: Interviewer[] = [
      {
        id: 'mock-1',
        position: 'Senior Software Engineer',
        experience_years: 8,
        skills: ['React', 'Node.js', 'TypeScript'],
        technologies: ['JavaScript', 'Python', 'AWS', 'Docker'],
        bio: 'Experienced full-stack developer with 8+ years in building scalable web applications. Passionate about mentoring and helping developers grow.',
        user_id: 'mock-user-1'
      },
      {
        id: 'mock-2',
        position: 'Tech Lead',
        experience_years: 10,
        skills: ['System Design', 'Microservices', 'Leadership'],
        technologies: ['Java', 'Spring Boot', 'Kubernetes', 'MongoDB'],
        bio: 'Tech lead with 10+ years experience in building enterprise-grade systems. Expert in system design and team leadership.',
        user_id: 'mock-user-2'
      },
      {
        id: 'mock-3',
        position: 'Principal Engineer',
        experience_years: 12,
        skills: ['Architecture', 'DevOps', 'Cloud'],
        technologies: ['Python', 'Go', 'Terraform', 'AWS'],
        bio: 'Principal engineer with 12+ years in cloud architecture and DevOps. Specializes in building resilient, scalable systems.',
        user_id: 'mock-user-3'
      }
    ];

    const mockProfiles: Record<string, Profile> = {
      'mock-user-1': { id: 'mock-user-1', full_name: 'Sarah Johnson' },
      'mock-user-2': { id: 'mock-user-2', full_name: 'Michael Chen' },
      'mock-user-3': { id: 'mock-user-3', full_name: 'David Rodriguez' }
    };

    return (
      <div className="relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Meet Our <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Expert Interviewers</span>
          </h2>
          <p className="text-slate-300 text-lg max-w-3xl mx-auto">
            Real engineers from top tech companies, ready to help you ace your interviews
          </p>
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg max-w-md mx-auto">
            <p className="text-yellow-200 text-sm">
              📝 Demo Mode: Showing sample interviewers. Real data will appear when interviewers are added to the platform.
            </p>
          </div>
        </div>

        {/* Scroll Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={scrollLeft}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-300"
            aria-label="Previous interviewer"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={scrollRight}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-300"
            aria-label="Next interviewer"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Cards Container */}
          <div
            ref={scrollContainerRef}
            className="overflow-hidden"
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 320}px)`,
              }}
            >
              {mockInterviewers.map((interviewer, index) => (
                <InterviewerCard
                  key={interviewer.id}
                  interviewer={interviewer}
                  profile={mockProfiles[interviewer.user_id] || null}
                />
              ))}
              {/* Duplicate cards for seamless loop */}
              {mockInterviewers.slice(0, 2).map((interviewer, index) => (
                <InterviewerCard
                  key={`duplicate-${interviewer.id}`}
                  interviewer={interviewer}
                  profile={mockProfiles[interviewer.user_id] || null}
                />
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {mockInterviewers.slice(0, Math.min(mockInterviewers.length, 10)).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoScrolling(false);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-blue-400 w-8'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to interviewer ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-8 bg-white/5 rounded-xl px-8 py-4 border border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">3+</div>
              <div className="text-slate-300 text-sm">Sample Interviewers</div>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">4.8★</div>
              <div className="text-slate-300 text-sm">Average Rating</div>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">1000+</div>
              <div className="text-slate-300 text-sm">Interviews Conducted</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Meet Our <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Expert Interviewers</span>
        </h2>
        <p className="text-slate-300 text-lg max-w-3xl mx-auto">
          Real engineers from top tech companies, ready to help you ace your interviews
        </p>
      </div>

      {/* Scroll Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={scrollLeft}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-300"
          aria-label="Previous interviewer"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={scrollRight}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-300"
          aria-label="Next interviewer"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Cards Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-hidden"
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 320}px)`, // 320px = card width + margin
            }}
          >
            {interviewers.map((interviewer, index) => (
              <InterviewerCard
                key={interviewer.id}
                interviewer={interviewer}
                profile={profiles[interviewer.user_id] || null}
              />
            ))}
            {/* Duplicate cards for seamless loop */}
            {interviewers.slice(0, 3).map((interviewer, index) => (
              <InterviewerCard
                key={`duplicate-${interviewer.id}`}
                interviewer={interviewer}
                profile={profiles[interviewer.user_id] || null}
              />
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center space-x-2 mt-8">
          {interviewers.slice(0, Math.min(interviewers.length, 10)).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoScrolling(false);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-blue-400 w-8'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to interviewer ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center space-x-8 bg-white/5 rounded-xl px-8 py-4 border border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{interviewers.length}+</div>
            <div className="text-slate-300 text-sm">Expert Interviewers</div>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">4.8★</div>
            <div className="text-slate-300 text-sm">Average Rating</div>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">1000+</div>
            <div className="text-slate-300 text-sm">Interviews Conducted</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerShowcase;
