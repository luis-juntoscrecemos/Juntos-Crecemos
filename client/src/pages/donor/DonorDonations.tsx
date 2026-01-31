import { useQuery } from '@tanstack/react-query';
import { DonorShell } from '@/components/layout/DonorShell';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { Heart, Calendar, Building2 } from 'lucide-react';
import type { DonationWithOrg } from '@shared/schema';

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
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString));
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    succeeded: { label: 'Exitosa', variant: 'default' },
    paid: { label: 'Pagada', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'secondary' },
    failed: { label: 'Fallida', variant: 'destructive' },
    refunded: { label: 'Reembolsada', variant: 'outline' },
  };
  
  const config = statusMap[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
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

export default function DonorDonations() {
  const { data: donationsResponse, isLoading } = useQuery<{ data?: DonationWithOrg[] }>({
    queryKey: ['/api/donor/donations'],
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  const donations = donationsResponse?.data || [];

  return (
    <DonorShell>
      <div className="space-y-6">
        <PageHeader 
          title="Mis Donaciones" 
          description="Historial completo de todas tus donaciones"
        />

        {donations.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No tienes donaciones aún"
            description="Cuando realices donaciones a organizaciones, aparecerán aquí."
          />
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => (
              <Card 
                key={donation.id} 
                className="hover-elevate"
                data-testid={`donation-card-${donation.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 rounded-md">
                      {donation.organization_logo_url ? (
                        <AvatarImage 
                          src={donation.organization_logo_url} 
                          alt={donation.organization_name || 'Organización'} 
                        />
                      ) : null}
                      <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                        <Building2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm">
                            {donation.organization_name || 'Organización'}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {donation.campaign_title || 'Donación general'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {formatCurrency(donation.amount_minor / 100)}
                          </p>
                          <p className="text-xs text-muted-foreground">{donation.currency}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(donation.created_at)}
                        </div>
                        {getStatusBadge(donation.status)}
                        {donation.is_recurring && (
                          <Badge variant="outline" className="text-xs">Recurrente</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DonorShell>
  );
}
