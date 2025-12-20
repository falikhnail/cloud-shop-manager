import { useState, useEffect } from 'react';
import { X, User as UserIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; role: UserRole; password?: string }) => void;
  user?: User | null;
  title: string;
  isSubmitting?: boolean;
}

export function UserFormDialog({ isOpen, onClose, onSubmit, user, title, isSubmitting }: UserFormDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('kasir');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    } else {
      resetForm();
    }
  }, [user, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { name?: string; email?: string; password?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Username harus diisi';
    } else if (name.length > 100) {
      newErrors.name = 'Username maksimal 100 karakter';
    } else if (name.includes(' ')) {
      newErrors.name = 'Username tidak boleh mengandung spasi';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    if (!user && !password.trim()) {
      newErrors.password = 'Password harus diisi untuk user baru';
    } else if (!user && password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({ name: name.trim(), email: email.trim(), role, password: password || undefined });
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('kasir');
    setPassword('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative glass rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Username <span className="text-muted-foreground">(untuk login)</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value.replace(/\s/g, ''));
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="Masukkan username"
              className={cn("bg-secondary/50 border-border", errors.name && "border-destructive")}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: undefined }));
              }}
              placeholder="email@example.com"
              className={cn("bg-secondary/50 border-border", errors.email && "border-destructive")}
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['kasir', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  disabled={isSubmitting}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all capitalize",
                    role === r
                      ? "bg-primary/20 border border-primary text-primary"
                      : "bg-secondary/50 border border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Password {user && <span className="text-muted-foreground">(kosongkan jika tidak diubah)</span>}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors(prev => ({ ...prev, password: undefined }));
              }}
              placeholder={user ? "••••••" : "Masukkan password"}
              className={cn("bg-secondary/50 border-border", errors.password && "border-destructive")}
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Info Box */}
          {!user && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  User akan login menggunakan <strong>Username</strong> dan <strong>Password</strong> yang Anda tentukan di sini.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : (user ? 'Simpan' : 'Tambah')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
