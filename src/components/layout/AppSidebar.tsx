import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Users, 
  Settings,
  LogOut,
  Zap,
  BarChart3,
  Menu,
  X,
  Moon,
  Sun,
  ShoppingBag,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useSidebarContext } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Produk', path: '/products' },
  { icon: ShoppingBag, label: 'Pembelian', path: '/purchases' },
  { icon: Wallet, label: 'Biaya Operasional', path: '/expenses' },
  { icon: Receipt, label: 'Transaksi', path: '/transactions' },
  { icon: BarChart3, label: 'Laporan Penjualan', path: '/reports' },
  { icon: TrendingUp, label: 'Laba Rugi', path: '/profit-report' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Settings, label: 'Pengaturan', path: '/settings' },
];

const kasirMenuItems = [
  { icon: ShoppingCart, label: 'Kasir', path: '/pos' },
  { icon: Receipt, label: 'Riwayat', path: '/history' },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { settings } = useStore();
  const { isOpen, toggle } = useSidebarContext();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  
  const menuItems = user?.role === 'admin' ? adminMenuItems : kasirMenuItems;

  return (
    <>
      {/* Hamburger Toggle Button */}
      <button
        onClick={toggle}
        className={cn(
          "fixed top-4 z-50 p-2.5 rounded-md bg-background border border-border transition-all duration-200 hover:bg-secondary",
          isOpen ? "left-[17rem]" : "left-4"
        )}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <Menu className="w-5 h-5 text-foreground" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggle}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-200",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-0 lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            {settings.logo ? (
              <div className="w-9 h-9 rounded-lg overflow-hidden">
                <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-base font-semibold text-foreground">{settings.name}</h1>
              <p className="text-xs text-muted-foreground">POS System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150",
                  isActive 
                    ? "bg-secondary text-foreground font-medium" 
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Theme Toggle & User Info */}
        <div className="p-3 border-t border-sidebar-border">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors duration-150 mb-2"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Mode Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Mode Gelap</span>
              </>
            )}
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-xs font-medium text-foreground">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
