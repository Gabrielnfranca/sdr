import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Send, 
  Settings, 
  LogOut,
  Zap,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kanban', label: 'Pipeline', icon: Kanban },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'campaigns', label: 'Campanhas', icon: Send },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'automations', label: 'Automações', icon: Zap },
];

const Sidebar = ({ currentPage, onNavigate, collapsed, onToggleCollapse }: SidebarProps) => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso');
  };

  const userInitials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : 'US';

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("p-6 border-b border-sidebar-border flex items-center", collapsed ? "justify-center p-4" : "justify-between")}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 min-w-[2.5rem] rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap transition-opacity duration-300">
              <h1 className="text-lg font-bold text-sidebar-foreground">ProspectFlow</h1>
              <p className="text-xs text-sidebar-foreground/60">Automação SDR</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <div className="absolute -right-3 top-9 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full border shadow-md bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={onToggleCollapse}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="w-5 h-5 min-w-[1.25rem]" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-sidebar-border space-y-1 overflow-x-hidden">
        <button
          onClick={() => onNavigate('settings')}
          title={collapsed ? "Configurações" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="w-5 h-5 min-w-[1.25rem]" />
          {!collapsed && <span className="whitespace-nowrap">Configurações</span>}
        </button>
        <button 
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 min-w-[1.25rem]" />
          {!collapsed && <span className="whitespace-nowrap">Sair</span>}
        </button>
      </div>

      {/* User info */}
      <div className={cn("p-4 border-t border-sidebar-border overflow-hidden", collapsed && "flex justify-center")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-foreground">{userInitials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email?.split('@')[0] || 'Usuário'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email || 'user@email.com'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
