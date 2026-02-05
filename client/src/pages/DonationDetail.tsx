import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Calendar, CreditCard, Mail, User, Receipt, Tag, Clock, Hash } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { donationDetailApi } from '@/lib/api';
import type { DonationDetail as DonationDetailType } from '@shared/schema';

function formatCurrency(amount: number, currency: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(dateString));
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-success/10 text-success no-default-hover-elevate no-default-active-elevate">Completada</Badge>;
    case 'pending':
      return <Badge className="bg-warning/10 text-warning no-default-hover-elevate no-default-active-elevate">Pendiente</Badge>;
    case 'failed':
      return <Badge variant="destructive">Fallida</Badge>;
    case 'refunded':
      return <Badge variant="secondary">Reembolsada</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function DetailRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`} data-testid={`text-detail-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['/api/donations', id],
    queryFn: () => donationDetailApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !response?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Donación no encontrada"
          actions={
            <Link href="/donations">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a donaciones
              </Button>
            </Link>
          }
        />
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No se encontró la donación solicitada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const donation = response.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalle de donación"
        description={`Transacción ${donation.id.substring(0, 8)}...`}
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Panel
              </Button>
            </Link>
            <Link href="/donations">
              <Button variant="outline" data-testid="button-back-donations">
                Ver todas
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <Card className="lg:col-span-2" data-testid="card-transaction-info">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle>Información de la transacción</CardTitle>
            <span data-testid="badge-donation-status">{getStatusBadge(donation.status)}</span>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow 
              icon={Hash} 
              label="ID de Transacción" 
              value={donation.id} 
              mono 
            />
            <DetailRow 
              icon={CreditCard} 
              label="Monto" 
              value={formatCurrency(donation.amount_minor / 100, donation.currency)} 
            />
            <DetailRow 
              icon={Tag} 
              label="Moneda" 
              value={donation.currency} 
            />
            <DetailRow 
              icon={User} 
              label="Donante" 
              value={donation.is_anonymous ? 'Donante Anónimo' : (donation.donor_name || 'Sin nombre')} 
            />
            {!donation.is_anonymous && (
              <DetailRow 
                icon={Mail} 
                label="Email del donante" 
                value={donation.donor_email} 
              />
            )}
            <DetailRow 
              icon={Receipt} 
              label="Campaña" 
              value={donation.campaign_title} 
            />
            <DetailRow 
              icon={Tag} 
              label="Tipo" 
              value={donation.is_recurring ? 'Recurrente (Mensual)' : 'Única vez'} 
            />
            <DetailRow 
              icon={Calendar} 
              label="Fecha de creación" 
              value={formatDateTime(donation.created_at)} 
            />
            {donation.paid_at && (
              <DetailRow 
                icon={Clock} 
                label="Fecha de pago" 
                value={formatDateTime(donation.paid_at)} 
              />
            )}
            {donation.updated_at && donation.updated_at !== donation.created_at && (
              <DetailRow 
                icon={Clock} 
                label="Última actualización" 
                value={formatDateTime(donation.updated_at)} 
              />
            )}
          </CardContent>
        </Card>

        {/* Side info */}
        <div className="space-y-6">
          <Card data-testid="card-donation-summary">
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold" data-testid="text-donation-amount">
                  {formatCurrency(donation.amount_minor / 100, donation.currency)}
                </p>
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-donation-type">
                  {donation.is_recurring ? 'Donación recurrente' : 'Donación única'}
                </p>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estado</span>
                  {getStatusBadge(donation.status)}
                </div>
                {donation.campaign_title && (
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Campaña</span>
                    <span className="font-medium text-right truncate" data-testid="text-summary-campaign">{donation.campaign_title}</span>
                  </div>
                )}
                {donation.organization_name && (
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Organización</span>
                    <span className="font-medium text-right truncate" data-testid="text-summary-organization">{donation.organization_name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {(donation.stripe_payment_intent || donation.external_id || donation.provider) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {donation.provider && (
                  <DetailRow icon={CreditCard} label="Proveedor de pago" value={donation.provider} />
                )}
                {donation.external_id && (
                  <DetailRow icon={Hash} label="ID externo" value={donation.external_id} mono />
                )}
                {donation.stripe_payment_intent && (
                  <DetailRow icon={Hash} label="Stripe Payment Intent" value={donation.stripe_payment_intent} mono />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
