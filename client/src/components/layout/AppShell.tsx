import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Building2, 
  Megaphone, 
  Heart, 
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Shield,
  ArrowRightLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Separator } from '@/components/ui/separator';
import { ThemeModeToggle } from '@/components/common/ThemeModeToggle';
import { internalApi } from '@/lib/internalApi';
import juntosLogo from '@/assets/juntos-crecemos-logo.png';
import darkLogo from '@assets/Juntos_Crecemos_Transparent_1772133029306.png';
import type { Organization } from '@shared/schema';

const mainNavItems = [
  { title: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Organización', href: '/organization', icon: Building2 },
  { title: 'Campañas', href: '/campaigns', icon: Megaphone },
  { title: 'Donaciones', href: '/donations', icon: Heart },
];

const secondaryNavItems = [
  { title: 'Configuración', href: '/settings', icon: Settings },
];

function AppSidebar({ organization, isInternalAdmin }: { organization?: Organization | null; isInternalAdmin?: boolean }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'JC';
  const orgName = organization?.name || 'Juntos Crecemos';
  const orgLogo = organization?.logo_url;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 cursor-pointer">
            {orgLogo ? (
              <Avatar className="h-10 w-10 rounded-md">
                <AvatarImage src={orgLogo} alt={orgName} className="object-cover" />
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground font-bold">
                  {orgName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <img src={juntosLogo} alt="Juntos Crecemos" className="h-10 w-10 object-contain" />
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{orgName}</span>
              {!orgLogo && (
                <span className="text-xs text-muted-foreground">Plataforma de Donaciones</span>
              )}
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.href}
                    data-testid={`nav-${item.href.replace('/', '')}`}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Otros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.href}
                    data-testid={`nav-${item.href.replace('/', '')}`}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        {isInternalAdmin && (
          <Link href="/internal/dashboard">
            <Button
              variant="outline"
              className="w-full gap-2 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              data-testid="button-switch-internal"
            >
              <Shield className="w-4 h-4" />
              <span>Panel Interno</span>
              <ArrowRightLeft className="w-3 h-3 ml-auto" />
            </Button>
          </Link>
        )}
        <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopBar({ organization }: { organization?: Organization | null }) {
  const orgName = organization?.name || 'Juntos Crecemos';
  
  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-welcome-message">
          Bienvenidos, {orgName}!
        </span>
        <ThemeModeToggle />
        <img src={darkLogo} alt="Juntos Crecemos" className="h-8 object-contain" data-testid="img-topbar-logo" />
      </div>
    </header>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { setAccent } = useTheme();
  const { data: orgResponse } = useQuery<{ data?: Organization }>({
    queryKey: ['/api/organizations/me'],
  });

  const { data: internalCheckResponse } = useQuery({
    queryKey: ['internal-admin-check'],
    queryFn: () => internalApi.check(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isInternalAdmin = !!(internalCheckResponse as any)?.data?.data?.isInternalAdmin;
  
  const organization = orgResponse?.data;

  useEffect(() => {
    if (organization?.accent_theme) {
      const validThemes = ['classic', 'ocean', 'andes', 'warm'] as const;
      const theme = organization.accent_theme as typeof validThemes[number];
      if (validThemes.includes(theme)) {
        setAccent(theme);
      }
    }
  }, [organization?.accent_theme, setAccent]);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  const isPending = organization?.review_status === 'PENDING';

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar organization={organization} isInternalAdmin={isInternalAdmin} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar organization={organization} />
          {isPending && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3" data-testid="banner-pending-review">
              <div className="max-w-6xl mx-auto flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm" data-testid="text-pending-title">Tu organización está bajo revisión</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                    Nuestro equipo está revisando tu información. Podrás recibir donaciones tan pronto como finalice la revisión. Si tienes preguntas, escríbenos a:{' '}
                    <a href="mailto:info@juntoscrecemos.co" className="underline font-medium">info@juntoscrecemos.co</a>
                  </p>
                </div>
              </div>
            </div>
          )}
          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
