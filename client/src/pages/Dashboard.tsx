import { useQuery } from '@tanstack/react-query';
import { Heart, Megaphone, Users, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { dashboardApi, campaignsApi, donationsApi } from '@/lib/api';
import type { CampaignWithTotals, Donation } from '@shared/schema';

function formatCurrency(amount: number, currency: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

export default function Dashboard() {
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  const { data: donationsResponse, isLoading: donationsLoading } = useQuery({
    queryKey: ['/api/donations'],
  });

  const isLoading = statsLoading || campaignsLoading || donationsLoading;

  if (isLoading) {
    return <LoadingPage />;
  }

  const stats = statsResponse?.data || {
    totalDonations: 0,
    totalRaised: 0,
    activeCampaigns: 0,
    totalDonors: 0,
  };

  const campaigns = (campaignsResponse?.data || []) as CampaignWithTotals[];
  const donations = (donationsResponse?.data || []) as Donation[];

  const recentDonations = donations.slice(0, 5);
  const activeCampaigns = campaigns.filter(c => c.is_active).slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Panel de Control" 
        description="Resumen de tu actividad y métricas clave"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Recaudado"
          value={formatCurrency(stats.totalRaised)}
          icon={TrendingUp}
          description="Todas las campañas"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Donaciones"
          value={stats.totalDonations}
          icon={Heart}
          description="Este mes"
        />
        <StatsCard
          title="Campañas Activas"
          value={stats.activeCampaigns}
          icon={Megaphone}
          description="En progreso"
        />
        <StatsCard
          title="Donantes"
          value={stats.totalDonors}
          icon={Users}
          description="Únicos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campañas Activas</CardTitle>
            <CardDescription>Progreso de tus campañas actuales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay campañas activas
              </p>
            ) : (
              activeCampaigns.map((campaign) => {
                const progress = campaign.goal_amount 
                  ? Math.min(100, (campaign.raised_minor / (campaign.goal_amount * 100)) * 100)
                  : 0;
                return (
                  <div key={campaign.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{campaign.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(campaign.raised_minor / 100)} de {formatCurrency(campaign.goal_amount || 0)}
                        </p>
                      </div>
                      <Badge variant="secondary">{campaign.donations_count} donaciones</Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donaciones Recientes</CardTitle>
            <CardDescription>Últimas contribuciones recibidas</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay donaciones recientes
              </p>
            ) : (
              <div className="space-y-4">
                {recentDonations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">
                        {donation.is_anonymous ? 'Donante Anónimo' : donation.donor_name || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(donation.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-primary">
                        {formatCurrency(donation.amount_minor / 100, donation.currency)}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={donation.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {donation.status === 'paid' ? 'Completada' : donation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
