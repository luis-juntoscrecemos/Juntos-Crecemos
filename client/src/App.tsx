import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingPage } from "@/components/common/LoadingSpinner";
import { donorApi } from "@/lib/donorApi";

import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/Dashboard";
import StyleGuide from "@/pages/StyleGuide";
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading, isLoading, isOrgUser, isDonor, checkDone } = useUserType();
  const [, setLocation] = useLocation();

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

      <Route path="/style-guide">
        <ProtectedRoute>
          <StyleGuide />
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

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
