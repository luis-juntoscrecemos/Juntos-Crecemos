import { useEffect, useState, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingPage } from "@/components/common/LoadingSpinner";
import { donorApi } from "@/lib/donorApi";
import { internalApi } from "@/lib/internalApi";

import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/Dashboard";
import OrganizationPage from "@/pages/Organization";
import CampaignsPage from "@/pages/Campaigns";
import DonationsPage from "@/pages/Donations";
import DonationDetailPage from "@/pages/DonationDetail";
import SettingsPage from "@/pages/Settings";
import DonatePage from "@/pages/public/DonatePage";
import DonationIntentDetailPage from "@/pages/public/DonationIntentDetail";
import TermsPage from "@/pages/public/TermsPage";

import DonorLogin from "@/pages/donor/DonorLogin";
import DonorRegister from "@/pages/donor/DonorRegister";
import DonorDashboard from "@/pages/donor/DonorDashboard";
import DonorDonations from "@/pages/donor/DonorDonations";
import DonorFavorites from "@/pages/donor/DonorFavorites";
import DonorSettings from "@/pages/donor/DonorSettings";
import NoDonorProfile from "@/pages/donor/NoDonorProfile";

import { InternalShell } from "@/components/layout/InternalShell";
import InternalLogin from "@/pages/internal/InternalLogin";
import InternalDashboard from "@/pages/internal/InternalDashboard";
import InternalOrganizations from "@/pages/internal/InternalOrganizations";
import InternalOrgDetail from "@/pages/internal/InternalOrgDetail";
import InternalDonors from "@/pages/internal/InternalDonors";
import InternalDonorDetail from "@/pages/internal/InternalDonorDetail";
import InternalDonations from "@/pages/internal/InternalDonations";
import InternalAuditLog from "@/pages/internal/InternalAuditLog";
import InternalHealth from "@/pages/internal/InternalHealth";
import InternalSettings from "@/pages/internal/InternalSettings";
import InternalPendingOrgs from "@/pages/internal/InternalPendingOrgs";
import AcceptInvite from "@/pages/internal/AcceptInvite";
import type { InternalAdmin } from "@shared/schema";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading, isLoading, isOrgUser, isDonor, checkDone } = useUserType();
  const [, setLocation] = useLocation();

  const { error: orgError } = useQuery({
    queryKey: ['/api/organizations/me'],
    enabled: !!user && isOrgUser,
    retry: false,
  });

  const isSuspended = orgError?.message?.includes('403') && orgError?.message?.includes('ACCOUNT_SUSPENDED');

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [authLoading, user, setLocation]);

  useEffect(() => {
    if (!isLoading && user && checkDone && !isOrgUser && isDonor) {
      setLocation('/donor');
    }
  }, [isLoading, user, checkDone, isOrgUser, isDonor, setLocation]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <LoadingPage />;
  }

  if (isSuspended) {
    return <SuspendedPage />;
  }

  if (checkDone && !isOrgUser && isDonor) {
    return <LoadingPage />;
  }

  return <AppShell>{children}</AppShell>;
}

function useUserType() {
  const { user, loading: authLoading } = useAuth();

  const { data: checkResponse, isLoading: checkLoading, isError } = useQuery<{ data?: { isDonor: boolean; isOrgUser: boolean } }>({
    queryKey: ['/api/donor/check'],
    queryFn: () => donorApi.checkAccount(),
    enabled: !!user,
    retry: 1,
  });

  const isLoading = authLoading || (!!user && checkLoading);
  const isOrgUser = checkResponse?.data?.isOrgUser ?? false;
  const isDonor = checkResponse?.data?.isDonor ?? false;
  const checkDone = !checkLoading && (!!checkResponse?.data || isError);

  return { user, authLoading, isLoading, isOrgUser, isDonor, checkDone, isError };
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading, isOrgUser, isDonor, checkDone, isError } = useUserType();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && user && (checkDone || isError)) {
      if (isOrgUser || isError) {
        setLocation('/dashboard');
      } else if (isDonor) {
        setLocation('/donor');
      } else {
        setLocation('/dashboard');
      }
    }
  }, [authLoading, user, isOrgUser, isDonor, checkDone, isError, setLocation]);

  if (authLoading) {
    return <LoadingPage />;
  }

  if (user) {
    return <LoadingPage />;
  }

  return <>{children}</>;
}

function DonorAuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation('/donor');
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return <LoadingPage />;
  }

  if (user) {
    return <LoadingPage />;
  }

  return <>{children}</>;
}

function DonorProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: checkResponse, isLoading: checkLoading } = useQuery<{ data?: { isDonor: boolean; isOrgUser: boolean } }>({
    queryKey: ['/api/donor/check'],
    queryFn: () => donorApi.checkAccount(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/donor/login');
    }
  }, [authLoading, user, setLocation]);

  if (authLoading || checkLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <LoadingPage />;
  }

  const isDonor = checkResponse?.data?.isDonor;

  if (!isDonor) {
    return <NoDonorProfile />;
  }

  return <>{children}</>;
}

function SuspendedPage() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-suspended-title">Cuenta Suspendida</h1>
        <p className="text-muted-foreground">Tu organización ha sido suspendida. Contacta soporte para más información.</p>
        <button onClick={signOut} className="text-primary underline text-sm" data-testid="button-suspended-logout">Cerrar sesión</button>
      </div>
    </div>
  );
}

function InternalProtectedRoute({ children }: { children: (admin: InternalAdmin, hasOrganization: boolean) => React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: checkResp, isLoading: checkLoading } = useQuery({
    queryKey: ['/api/internal/check'],
    queryFn: () => internalApi.check(),
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/internal/login');
    }
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (!checkLoading && user && checkResp) {
      const resp = checkResp as any;
      if (resp.error || !resp.data?.data?.isInternalAdmin) {
        setLocation('/internal/login');
      }
    }
  }, [checkLoading, user, checkResp, setLocation]);

  if (loading || checkLoading) return <LoadingPage />;
  if (!user) return <LoadingPage />;

  const resp = checkResp as any;
  if (!resp?.data?.data?.isInternalAdmin) return <LoadingPage />;

  const admin: InternalAdmin = resp.data.data.admin;
  const hasOrganization: boolean = !!resp.data.data.hasOrganization;
  return <>{children(admin, hasOrganization)}</>;
}

function InternalRouter() {
  const [impersonating, setImpersonating] = useState<{ orgId: string; orgName: string } | null>(null);

  const handleStartImpersonation = useCallback((orgId: string, orgName: string) => {
    setImpersonating({ orgId, orgName });
  }, []);

  const handleStopImpersonation = useCallback(async () => {
    await internalApi.stopImpersonation(impersonating?.orgId);
    setImpersonating(null);
  }, [impersonating]);

  return (
    <Switch>
      <Route path="/internal/login">
        <InternalLogin />
      </Route>

      <Route path="/internal/accept-invite">
        <AcceptInvite />
      </Route>

      <Route path="/internal/dashboard">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalDashboard />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route path="/internal/organizaciones-pendientes">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalPendingOrgs adminRole={admin.role} />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route path="/internal/organizations/:id">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalOrgDetail adminRole={admin.role} onStartImpersonation={handleStartImpersonation} />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route path="/internal/organizations">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalOrganizations />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route path="/internal/donors/:id">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalDonorDetail />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route path="/internal/donors">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalDonors />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route path="/internal/donations">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalDonations />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route path="/internal/audit-log">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalAuditLog />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route path="/internal/health">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalHealth />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route path="/internal/settings">
        <InternalProtectedRoute>
          {(admin, hasOrganization) => (
            <InternalShell admin={admin} hasOrganization={hasOrganization} impersonating={impersonating} onStopImpersonation={handleStopImpersonation}>
              <InternalSettings adminRole={admin.role} />
            </InternalShell>
          )}
        </InternalProtectedRoute>
      </Route>

      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function SmartRedirect() {
  const { user, authLoading, isLoading, isOrgUser, isDonor, checkDone, isError } = useUserType();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    } else if (!isLoading && user && (checkDone || isError)) {
      if (isOrgUser || isError) {
        setLocation('/dashboard');
      } else if (isDonor) {
        setLocation('/donor');
      } else {
        setLocation('/login');
      }
    }
  }, [authLoading, isLoading, user, isOrgUser, isDonor, checkDone, isError, setLocation]);

  return <LoadingPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <SmartRedirect />
      </Route>

      <Route path="/login">
        <AuthRoute>
          <Login />
        </AuthRoute>
      </Route>

      <Route path="/register">
        <AuthRoute>
          <Register />
        </AuthRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/organization">
        <ProtectedRoute>
          <OrganizationPage />
        </ProtectedRoute>
      </Route>

      <Route path="/campaigns">
        <ProtectedRoute>
          <CampaignsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/donations/:id">
        <ProtectedRoute>
          <DonationDetailPage />
        </ProtectedRoute>
      </Route>

      <Route path="/donations">
        <ProtectedRoute>
          <DonationsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/donar/:orgSlug/:campaignSlug">
        <DonatePage />
      </Route>

      <Route path="/donaciones/:intentId">
        <DonationIntentDetailPage />
      </Route>

      <Route path="/terminos">
        <TermsPage />
      </Route>

      <Route path="/donor/login">
        <DonorAuthRoute>
          <DonorLogin />
        </DonorAuthRoute>
      </Route>

      <Route path="/donor/register">
        <DonorAuthRoute>
          <DonorRegister />
        </DonorAuthRoute>
      </Route>

      <Route path="/donor">
        <DonorProtectedRoute>
          <DonorDashboard />
        </DonorProtectedRoute>
      </Route>

      <Route path="/donor/donations">
        <DonorProtectedRoute>
          <DonorDonations />
        </DonorProtectedRoute>
      </Route>

      <Route path="/donor/favorites">
        <DonorProtectedRoute>
          <DonorFavorites />
        </DonorProtectedRoute>
      </Route>

      <Route path="/donor/settings">
        <DonorProtectedRoute>
          <DonorSettings />
        </DonorProtectedRoute>
      </Route>

      <Route path="/internal/:rest*">
        <InternalRouter />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
