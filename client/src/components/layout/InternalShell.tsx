import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Building2,
  Users,
  Heart,
  Shield,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ClipboardCheck,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeModeToggle } from '@/components/common/ThemeModeToggle';
import type { InternalAdmin } from '@shared/schema';

const navItems = [
  { title: 'Panel', href: '/internal/dashboard', icon: LayoutDashboard },
  { title: 'Org. Pendientes', href: '/internal/organizaciones-pendientes', icon: ClipboardCheck },
  { title: 'Organizaciones', href: '/internal/organizations', icon: Building2 },
  { title: 'Donantes', href: '/internal/donors', icon: Users },
  { title: 'Donaciones', href: '/internal/donations', icon: Heart },
  { title: 'Auditoría', href: '/internal/audit-log', icon: Shield },
  { title: 'Sistema', href: '/internal/health', icon: Activity },
  { title: 'Administradores', href: '/internal/settings', icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  VIEWER: 'Viewer',
};

interface InternalShellProps {
  children: React.ReactNode;
  admin?: InternalAdmin | null;
  hasOrganization?: boolean;
  impersonating?: { orgId: string; orgName: string } | null;
  onStopImpersonation?: () => void;
}

export function InternalShell({ children, admin, hasOrganization, impersonating, onStopImpersonation }: InternalShellProps) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOrgUser = !!hasOrganization;

  return (
    <div className="flex h-screen overflow-hidden" data-testid="internal-shell">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">JC Internal</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-slate-800"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  data-testid={`nav-${item.href.split('/').pop()}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-700 space-y-2">
          {isOrgUser && (
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-emerald-400 hover:bg-slate-800 hover:text-emerald-300"
                data-testid="button-switch-org"
              >
                <Building2 className="w-4 h-4" />
                Panel de Organización
                <ArrowRightLeft className="w-3 h-3 ml-auto" />
              </Button>
            </Link>
          )}
          {admin && (
            <div className="px-3 mb-1">
              <p className="text-xs text-slate-400 truncate">{admin.email}</p>
              <Badge variant="outline" className="mt-1 text-xs border-amber-500/50 text-amber-400">
                {ROLE_LABELS[admin.role] || admin.role}
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={signOut}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {impersonating && (
          <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between text-sm font-medium" data-testid="banner-impersonation">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Impersonando: {impersonating.orgName} (SOLO LECTURA)
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-black text-black hover:bg-black/10"
              onClick={onStopImpersonation}
              data-testid="button-stop-impersonation"
            >
              Salir
            </Button>
          </div>
        )}

        <header className="h-16 border-b bg-background flex items-center justify-between px-4 lg:px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <ThemeModeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
