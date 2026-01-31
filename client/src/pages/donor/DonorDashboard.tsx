import { useQuery } from '@tanstack/react-query';
import { DonorShell } from '@/components/layout/DonorShell';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Heart, TrendingUp, Building2, Calendar } from 'lucide-react';
import type { DonorDashboardStats, DonationWithOrg } from '@shared/schema';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

function LoadingPage() {
  return (
    <DonorShell>
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    </DonorShell>
  );
}

export default function DonorDashboard() {
  const { data: statsResponse, isLoading: statsLoading } = useQuery<{ data?: DonorDashboardStats }>({
    queryKey: ['/api/donor/stats'],
  });

  const { data: donationsResponse, isLoading: donationsLoading } = useQuery<{ data?: DonationWithOrg[] }>({
    queryKey: ['/api/donor/donations'],
  });

  const { data: monthlyResponse, isLoading: monthlyLoading } = useQuery<{ data?: { month: string; amount: number }[] }>({
    queryKey: ['/api/donor/donations/by-month'],
  });

  const isLoading = statsLoading || donationsLoading;

  if (isLoading) {
    return <LoadingPage />;
  }

  const stats = statsResponse?.data || {
    totalDonated: 0,
    donationsCount: 0,
    organizationsSupported: 0,
    lastDonationDate: null,
  };

  const donations = donationsResponse?.data || [];
  const recentDonations = donations.slice(0, 5);
  const monthlyData = monthlyResponse?.data || [];

  return (
    <DonorShell>
      <div className="space-y-8">
        <PageHeader 
          title="Mi Panel de Donaciones" 
          description="Resumen de tu impacto y actividad de donaciones"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Donado"
            value={formatCurrency(stats.totalDonated)}
            icon={Heart}
            description="Monto total de tus donaciones"
            data-testid="stat-total-donated"
          />
          <StatsCard
            title="Donaciones"
            value={stats.donationsCount.toString()}
            icon={TrendingUp}
            description="Número de donaciones realizadas"
            data-testid="stat-donations-count"
          />
          <StatsCard
            title="Organizaciones Apoyadas"
            value={stats.organizationsSupported.toString()}
            icon={Building2}
            description="ONGs que has apoyado"
            data-testid="stat-orgs-supported"
          />
          <StatsCard
            title="Última Donación"
            value={stats.lastDonationDate ? formatDate(stats.lastDonationDate) : 'N/A'}
            icon={Calendar}
            description="Fecha de tu última donación"
            data-testid="stat-last-donation"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Donaciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentDonations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aún no tienes donaciones registradas
                </p>
              ) : (
                <div className="space-y-4">
                  {recentDonations.map((donation) => (
                    <div 
                      key={donation.id} 
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                      data-testid={`donation-item-${donation.id}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {donation.organization_name || 'Organización'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {donation.campaign_title || 'Donación general'} • {formatDate(donation.created_at)}
                        </span>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatCurrency(donation.amount_minor / 100)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Donaciones por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay datos suficientes para mostrar
                </p>
              ) : (
                <div className="space-y-3">
                  {monthlyData.slice(-6).map((item) => {
                    const maxAmount = Math.max(...monthlyData.map(m => m.amount));
                    const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                    
                    return (
                      <div key={item.month} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.month}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DonorShell>
  );
}
