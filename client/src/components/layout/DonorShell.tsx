import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Heart, 
  History,
  Settings,
  LogOut,
  Star
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
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import juntosLogoColor from '@/assets/juntos-crecemos-logo-color.png';
import type { DonorAccount } from '@shared/schema';

const donorNavItems = [
  { title: 'Panel', href: '/donor', icon: LayoutDashboard },
  { title: 'Mis Donaciones', href: '/donor/donations', icon: History },
  { title: 'Favoritos', href: '/donor/favorites', icon: Star },
  { title: 'Configuración', href: '/donor/settings', icon: Settings },
];

function DonorSidebar({ profile }: { profile?: DonorAccount | null }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Donante';
  const userInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/donor">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src={juntosLogoColor} alt="Juntos Crecemos" className="h-10 w-10 object-contain" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Juntos Crecemos</span>
              <span className="text-xs text-muted-foreground">Portal de Donante</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {donorNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.href}
                    data-testid={`nav-${item.href.replace('/donor/', '') || 'dashboard'}`}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={() => signOut()}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopBar({ profile }: { profile?: DonorAccount | null }) {
  const { user } = useAuth();
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Donante';

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground" data-testid="text-donor-welcome">
          Bienvenidos, {displayName}!
        </span>
        <Heart className="h-5 w-5 text-primary fill-primary" />
      </div>
    </header>
  );
}

interface DonorShellProps {
  children: React.ReactNode;
}

export function DonorShell({ children }: DonorShellProps) {
  const { data: profileResponse } = useQuery<{ data?: DonorAccount }>({
    queryKey: ['/api/donor/profile'],
  });
  
  const profile = profileResponse?.data;

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <DonorSidebar profile={profile} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar profile={profile} />
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
