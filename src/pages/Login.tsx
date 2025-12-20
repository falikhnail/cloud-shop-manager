import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, Lock, Eye, EyeOff, Info, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { loginWithUsername, isAuthenticated, user } = useAuth();
  const { settings } = useStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/pos');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Bootstrap initial accounts on a fresh remix (when there are no profiles yet)
  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (error) return;
        if (!data || data.length === 0) {
          if (isMounted) setIsBootstrapping(true);

          const { error: seedError } = await supabase.functions.invoke('seed-users');
          if (seedError) throw seedError;

          toast({
            title: 'Akun awal siap',
            description: 'Gunakan admin/admin123 atau kasir/kasir123 untuk login.',
          });
        }
      } catch {
        // Silent: login can still work if accounts already exist
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await loginWithUsername(username, password);
    
    if (result.success) {
      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali!",
      });
    } else {
      toast({
        title: "Login Gagal",
        description: result.error || "Username atau password salah",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetUsername.trim()) {
      toast({
        title: "Error",
        description: "Masukkan username Anda",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { username: resetUsername.trim() }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Reset Password",
        description: data.message || "Jika username ditemukan, email reset password akan dikirim",
      });
      setShowResetDialog(false);
      setResetUsername('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim reset password",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          {settings.logo ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden mx-auto mb-4">
              <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
          <h1 className="text-xl font-semibold text-foreground">{settings.name}</h1>
          <p className="text-sm text-muted-foreground">Point of Sale System</p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-medium text-foreground mb-5 text-center">Masuk ke akun Anda</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Username atau Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Masukkan username atau email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 h-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 h-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10" disabled={isLoading || isBootstrapping}>
              {isBootstrapping ? 'Menyiapkan akun...' : (isLoading ? 'Memproses...' : 'Masuk')}
            </Button>

            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Lupa Password?
            </button>
          </form>
        </div>

        {/* Login Info */}
        <div className="mt-4 p-4 rounded-lg bg-secondary border border-border">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm w-full">
              <p className="font-medium text-foreground mb-2">Demo Accounts</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Admin:</span>
                  <code className="text-foreground bg-background px-2 py-0.5 rounded">admin / admin123</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Kasir:</span>
                  <code className="text-foreground bg-background px-2 py-0.5 rounded">kasir / kasir123</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Masukkan username Anda. Password baru akan dikirim ke email yang terdaftar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Masukkan username"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setResetUsername('');
              }}
            >
              Batal
            </Button>
            <Button onClick={handleResetPassword} disabled={isResetting}>
              {isResetting ? 'Mengirim...' : 'Kirim Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
