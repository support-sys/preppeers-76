import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting admin login for:', email);
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful, checking admin role...');

      // Verify admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile check error:', profileError);
        throw new Error('Error checking user profile');
      }

      if (profile?.role !== 'admin') {
        console.log('User is not an admin:', profile?.role);
        await supabase.auth.signOut();
        throw new Error('Access denied: Admin privileges required');
      }

      console.log('Admin role verified, checking admin record...');

      // Check if admin record exists
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (adminError || !adminData) {
        console.error('Admin record not found:', adminError);
        await supabase.auth.signOut();
        throw new Error('Admin account not properly configured');
      }

      toast({
        title: "Admin Login Successful",
        description: "Welcome to the admin dashboard",
      });

      console.log('Navigating to admin dashboard...');
      navigate('/admin/dashboard');
      
    } catch (error: any) {
      console.error('Admin login failed:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Security Warning */}
        <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-lg flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-300 font-semibold text-sm">Restricted Area</h3>
            <p className="text-red-200 text-xs mt-1">
              This is a secure admin portal. Unauthorized access is prohibited and monitored.
            </p>
          </div>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
            <p className="text-slate-400">Authorized personnel only</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 mt-1"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 mt-1"
                  required
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Lock className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Access Admin Panel
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                All admin activities are logged and monitored for security purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuth;
