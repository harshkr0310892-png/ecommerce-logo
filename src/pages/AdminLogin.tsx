import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crown, Lock, User, Loader2 } from "lucide-react";

// Fixed admin credentials
const ADMIN_USERNAME = "harsh";
const ADMIN_PASSWORD = "harsh.kr1025";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // Check if already logged in via session
  useEffect(() => {
    const isAdminLoggedIn = sessionStorage.getItem('admin_logged_in');
    if (isAdminLoggedIn === 'true') {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate input
    if (!credentials.username.trim()) {
      setErrors({ username: 'Username is required' });
      return;
    }
    if (!credentials.password) {
      setErrors({ password: 'Password is required' });
      return;
    }

    setIsLoading(true);

    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check fixed credentials
    if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_logged_in', 'true');
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } else {
      toast.error('Invalid username or password');
    }

    setIsLoading(false);
  };

  return (
    <Layout showHeader={false} showFooter={false}>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-30 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6 royal-shadow-lg">
              <Crown className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Admin Portal</h1>
            <p className="text-muted-foreground">
              Sign in to manage your store
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/50 p-8 royal-shadow">
            <div className="space-y-5">
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    placeholder="Enter username"
                    className="pl-11"
                    autoComplete="username"
                  />
                </div>
                {errors.username && <p className="text-sm text-destructive mt-1">{errors.username}</p>}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="Enter password"
                    className="pl-11"
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
              </div>
            </div>

            <Button
              type="submit"
              variant="royal"
              size="lg"
              className="w-full mt-8"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

          </form>

          <p className="text-center mt-6 text-muted-foreground text-sm">
            <a href="/" className="hover:text-primary transition-colors">
              ← Back to Store
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
