import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, UserPlus, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<'interviewer' | 'interviewee'>('interviewee');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  
  const [searchParams] = useSearchParams();

  const { signUp, signIn, resetPassword, user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  React.useEffect(() => {
    if (!authLoading && user && userRole) {
      if (userRole === 'interviewee') {
        navigate('/book', { replace: true });
      } else if (userRole === 'interviewer') {
        navigate('/become-interviewer', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, userRole, authLoading, navigate]);

  // Check URL parameters for role and mode
  React.useEffect(() => {
    const mode = searchParams.get('mode');
    const roleParam = searchParams.get('role');
    const confirmed = searchParams.get('confirmed');
    
    if (mode === 'reset') {
      setShowResetPassword(true);
      setActiveTab('signin');
    }
    
    if (confirmed === 'true') {
      toast({
        title: "Email Confirmed!",
        description: "Your email has been confirmed. You can now sign in to your account.",
      });
      setActiveTab('signin');
    }
    
    // Pre-select role based on URL parameter and switch to signup tab
    if (roleParam && (roleParam === 'interviewer' || roleParam === 'interviewee')) {
      setRole(roleParam as 'interviewer' | 'interviewee');
      setActiveTab('signup');
    }
  }, [searchParams, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Let AuthContext handle the redirect based on user role
      // No manual navigation here to avoid conflicts
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error, data } = await signUp(email, password, role, fullName, mobileNumber);
    
    if (error) {
      console.error('Signup error:', error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "An error occurred during signup",
        variant: "destructive",
      });
    } else {
      console.log('Signup successful:', data);
      
      // Check if email confirmation is required
      if (data?.user && !data.user.email_confirmed_at) {
        // Email confirmation required - show confirmation message
        setSignupEmail(email);
        setShowEmailConfirmation(true);
        setActiveTab('signin'); // Switch to signin tab for when they confirm
        
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account before signing in.",
        });
      } else {
        // Email confirmation not required or already confirmed
        toast({
          title: "Account Created!",
          description: "Your account has been created successfully.",
        });
        
        // Redirect based on role
        if (role === 'interviewer') {
          navigate('/interviewers');
        } else {
          navigate('/book');
        }
      }
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Email Sent!",
        description: "Please check your email for password reset instructions.",
      });
      setShowForgotPassword(false);
      setResetEmail('');
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Updated!",
          description: "Your password has been successfully updated.",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Show email confirmation message
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Navigation />
        
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="text-center">
                <Mail className="w-16 h-16 mx-auto text-blue-400 mb-4" />
                <CardTitle className="text-2xl font-bold text-white">
                  Check Your Email
                </CardTitle>
                <CardDescription className="text-slate-300">
                  We've sent a confirmation link to your email address
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <strong>{signupEmail}</strong>
                  </p>
                  <p className="text-blue-200 text-xs mt-2">
                    Please click the link in the email to verify your account, then return here to sign in.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-slate-300 text-sm">
                    Didn't receive the email? Check your spam folder.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailConfirmation(false);
                      setActiveTab('signup');
                    }}
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Back to Sign Up
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailConfirmation(false);
                      setActiveTab('signin');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Already Confirmed? Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                Welcome to Interviewise
              </CardTitle>
              <CardDescription className="text-slate-300">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger value="signin" className="text-white data-[state=active]:bg-blue-600">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-white data-[state=active]:bg-blue-600">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4">
                  {showResetPassword ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-white text-lg font-semibold mb-2">Set New Password</h3>
                        <p className="text-slate-300 text-sm">
                          Enter your new password below.
                        </p>
                      </div>
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                          <Label htmlFor="new-password" className="text-white">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            placeholder="Enter new password"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            placeholder="Confirm new password"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={loading}
                        >
                          {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                      </form>
                    </div>
                  ) : !showForgotPassword ? (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div>
                        <Label htmlFor="signin-email" className="text-white">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="signin-password" className="text-white">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={loading}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-blue-300 hover:text-blue-200 text-sm underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-white text-lg font-semibold mb-2">Reset Password</h3>
                        <p className="text-slate-300 text-sm">
                          Enter your email address and we'll send you a link to reset your password.
                        </p>
                      </div>
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                          <Label htmlFor="reset-email" className="text-white">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={loading}
                        >
                          {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(false)}
                            className="text-blue-300 hover:text-blue-200 text-sm underline"
                          >
                            Back to Sign In
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-mobile" className="text-white">Mobile Number</Label>
                      <Input
                        id="signup-mobile"
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        placeholder="Enter your mobile number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-email" className="text-white">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password" className="text-white">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                     {/* Role Selection - Show based on URL parameter or allow selection */}
                     {!searchParams.get('role') ? (
                       <div>
                         <Label className="text-white">I want to join as</Label>
                         <div className="space-y-3 mt-2">
                           <div className="flex items-center space-x-2">
                             <input
                               type="radio"
                               id="interviewee"
                               name="role"
                               value="interviewee"
                               checked={role === 'interviewee'}
                               onChange={(e) => setRole(e.target.value as 'interviewer' | 'interviewee')}
                               className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 focus:ring-blue-500 focus:ring-2"
                             />
                             <Label htmlFor="interviewee" className="text-white cursor-pointer">
                               Want to practice for Interview
                             </Label>
                           </div>
                           <div className="flex items-center space-x-2">
                             <input
                               type="radio"
                               id="interviewer"
                               name="role"
                               value="interviewer"
                               checked={role === 'interviewer'}
                               onChange={(e) => setRole(e.target.value as 'interviewer' | 'interviewee')}
                               className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 focus:ring-blue-500 focus:ring-2"
                             />
                             <Label htmlFor="interviewer" className="text-white cursor-pointer">
                               Want to take interviews
                             </Label>
                           </div>
                         </div>
                       </div>
                     ) : (
                       <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                         <div className="flex items-center justify-center">
                           <div className="text-center">
                             <p className="text-blue-300 text-sm font-medium">
                               {role === 'interviewer' ? 'Joining as an Interviewer' : 'Joining as an Interviewee'}
                             </p>
                             <p className="text-blue-200 text-xs mt-1">
                               {role === 'interviewer' 
                                 ? 'You\'ll be able to conduct mock interviews and earn income' 
                                 : 'You\'ll be able to book mock interviews for practice'
                               }
                             </p>
                           </div>
                         </div>
                       </div>
                     )}
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Auth;
