import React from 'react';
import { Star, MapPin, TrendingUp, Award } from 'lucide-react';

const EnhancedSuccessStories = () => {
  const featuredStory = {
    name: "Rahul Sharma",
    role: "Java Backend Developer",
    company: "JPMorgan Chase",
    location: "Mumbai",
    avatar: "R",
    rating: 5,
    salaryIncrease: "70%",
    timeToOffer: "3 weeks",
    previousAttempts: 12,
    mockInterviews: 3,
    testimonial: "I was struggling for 4 months with 7 failed interviews. After 2 mock interviews with IntervieWise, I identified my weak areas and improved significantly. The detailed feedback was game-changing. I landed my dream job at JPMorgan Chase in just 3 weeks!",
    journey: [
      "4 months of failed interviews",
      "Booked 2 mock interviews",
      "Received detailed feedback",
      "Improved technical skills",
      "Landed job at JPMorgan Chase"
    ]
  };

  const successStories = [
    {
      name: "Priya Patel",
      role: "Frontend Developer",
      company: "UBS",
      avatar: "P",
      rating: 5,
      salaryIncrease: "₹90%",
      timeToOffer: "2 weeks",
      testimonial: "The mock interviews helped me understand what real interviewers look for. I improved my problem-solving approach and communication skills. Got selected at Microsoft with a significant salary boost!"
    },
    {
      name: "Amit Kumar",
      role: "Full Stack Developer",
      company: "Capgemini",
      avatar: "A",
      rating: 5,
      salaryIncrease: "₹110%",
      timeToOffer: "4 weeks",
      testimonial: "I tried other platforms but they were just AI agents. Practicing with real interviewers made all the difference. The detailed feedback report helped me understand my strengths and weaknesses clearly."
    },
    {
      name: "Sneha Reddy",
      role: "DevOps Engineer",
      company: "Deloitte",
      avatar: "S",
      rating: 5,
      salaryIncrease: "₹60%",
      timeToOffer: "5 weeks",
      testimonial: "The mock interviews were exactly like real interviews. The feedback was incredibly detailed and actionable. I could see my improvement after each session. Finally landed my dream job at Google!"
    }
  ];

  return (
    <div className="relative z-10 bg-white/5 border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Real Success Stories from <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Real Candidates</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              See how mock interviews transformed their careers and landed them dream jobs
            </p>
          </div>

          {/* Featured Success Story */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-white/20 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {featuredStory.avatar}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold text-xl">{featuredStory.name}</h4>
                    <p className="text-blue-400 font-medium">{featuredStory.role} → {featuredStory.company}</p>
                    <div className="flex items-center mt-2">
                      {[...Array(featuredStory.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  {featuredStory.testimonial}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-green-400 font-bold text-lg">+{featuredStory.salaryIncrease}</div>
                    <div className="text-slate-400 text-sm">Salary Increase</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-blue-400 font-bold text-lg">{featuredStory.timeToOffer}</div>
                    <div className="text-slate-400 text-sm">Time to Offer</div>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-white font-semibold mb-4">Journey Timeline:</h5>
                <div className="space-y-3">
                  {featuredStory.journey.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                        {index + 1}
                      </div>
                      <span className="text-slate-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Other Success Stories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <div key={index} className="bg-white/10 rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {story.avatar}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">{story.name}</h4>
                    <p className="text-slate-400 text-sm">{story.role} at {story.company}</p>
                    <div className="flex items-center mt-1">
                      {[...Array(story.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 mb-4">
                  {story.testimonial}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-green-400 font-bold">+{story.salaryIncrease}</div>
                  <div className="text-blue-400 text-sm">{story.timeToOffer} to offer</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSuccessStories;
