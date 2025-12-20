import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, useSidebarContext } from '@/context/SidebarContext';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  requireRole?: 'admin' | 'kasir';
}

function MainContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebarContext();
  
  return (
    <main 
      className={cn(
        "min-h-screen transition-all duration-300",
        isOpen ? "lg:ml-64" : "ml-0"
      )}
    >
      <div className="p-8 pt-16">
        {children}
      </div>
    </main>
  );
}

export function MainLayout({ children, requireRole }: MainLayoutProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    const redirectPath = user?.role === 'admin' ? '/dashboard' : '/pos';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
