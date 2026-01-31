import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingPage } from "@/components/common/LoadingSpinner";

import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/Dashboard";
import StyleGuide from "@/pages/StyleGuide";
import OrganizationPage from "@/pages/Organization";
import CampaignsPage from "@/pages/Campaigns";
import DonationsPage from "@/pages/Donations";
import SettingsPage from "@/pages/Settings";
import DonatePage from "@/pages/public/DonatePage";

import DonorLogin from "@/pages/donor/DonorLogin";
import DonorDashboard from "@/pages/donor/DonorDashboard";
import DonorDonations from "@/pages/donor/DonorDonations";
import DonorFavorites from "@/pages/donor/DonorFavorites";
import DonorSettings from "@/pages/donor/DonorSettings";
import NoDonorProfile from "@/pages/donor/NoDonorProfile";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <LoadingPage />;
  }

  return <AppShell>{children}</AppShell>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation('/dashboard');
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

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
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

      <Route path="/donor/login">
        <DonorAuthRoute>
          <DonorLogin />
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
