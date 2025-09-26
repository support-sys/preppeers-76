
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { INTERVIEW_PLANS } from "@/utils/planConfig";

const Pricing = () => {
  const plans = Object.values(INTERVIEW_PLANS).map(plan => ({
    ...plan,
    popular: plan.isPopular || false,
    buttonText: plan.isPopular ? "Most Popular" : "Get Started"
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Choose the plan that fits your needs. All sessions include live feedback and improvement plans.
            </p>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 max-w-2xl mx-auto">
              <p className="text-white font-semibold text-lg">
                🎯 All sessions are live, GMeet based, and conducted by real engineers from top tech companies
              </p>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 relative ${
                  plan.popular ? 'border-2 border-blue-400 transform transition-transform duration-300 hover:scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-400 text-slate-900 px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  <div className="my-4">
                    <div className="text-lg text-slate-400 line-through">₹{plan.price}</div>
                    <div className="text-4xl font-bold text-blue-400">₹{plan.discountedPrice}</div>
                  </div>
                  <CardDescription className="text-slate-300">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-slate-300">
                        <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/book" className="block">
                    <Button 
                      size="lg" 
                      className={`w-full py-3 text-lg font-semibold ${
                        plan.popular 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Have Questions?
            </h2>
            <p className="text-slate-300 mb-8">
              Check out our frequently asked questions or contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/faq">
                <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10">
                  View FAQ
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="mt-20 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-400 mb-2">1000+</div>
                <p className="text-slate-300">Successful interviews conducted</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400 mb-2">95%</div>
                <p className="text-slate-300">Success rate in landing jobs</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">4.9/5</div>
                <p className="text-slate-300">Average user rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Pricing;
