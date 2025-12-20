import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Smartphone, Check, Share, Plus, MoreVertical, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { settings } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Check className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">App Sudah Terinstall!</h1>
          <p className="text-muted-foreground mb-6">
            VapeStore POS sudah terinstall di perangkat kamu. Kamu bisa membukanya dari home screen.
          </p>
          <Button onClick={() => navigate('/login')}>
            Buka Aplikasi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-glow opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 text-center max-w-md animate-fade-in">
        {/* App Icon */}
        <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow animate-pulse-glow">
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" className="w-full h-full object-cover rounded-3xl" />
          ) : (
            <Zap className="w-12 h-12 text-primary-foreground" />
          )}
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">{settings.name} POS</h1>
        <p className="text-muted-foreground mb-8">
          Install aplikasi untuk akses cepat dari home screen
        </p>

        {/* Install Options */}
        <div className="glass rounded-2xl p-6 space-y-6">
          {deferredPrompt ? (
            <>
              <Button onClick={handleInstall} className="w-full h-12" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Install Sekarang
              </Button>
              <p className="text-sm text-muted-foreground">
                Klik tombol di atas untuk menginstall aplikasi
              </p>
            </>
          ) : isIOS ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Smartphone className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Cara Install di iPhone/iPad</p>
                </div>
              </div>
              
              <ol className="text-left space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Share className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">1. Tap tombol Share</p>
                    <p className="text-sm text-muted-foreground">Di bagian bawah Safari browser</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">2. Pilih "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground">Scroll ke bawah jika perlu</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">3. Tap "Add"</p>
                    <p className="text-sm text-muted-foreground">App akan muncul di home screen</p>
                  </div>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Smartphone className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Cara Install di Android</p>
                </div>
              </div>
              
              <ol className="text-left space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MoreVertical className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">1. Tap menu (⋮)</p>
                    <p className="text-sm text-muted-foreground">Di pojok kanan atas Chrome</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">2. Pilih "Install app" atau "Add to Home screen"</p>
                    <p className="text-sm text-muted-foreground">Mungkin perlu scroll untuk menemukannya</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">3. Tap "Install"</p>
                    <p className="text-sm text-muted-foreground">App akan terinstall</p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
            Lanjut ke Login
          </Button>
        </div>
      </div>
    </div>
  );
}
