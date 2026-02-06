import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CreditCard, Mail, User, Receipt, Hash, RefreshCw, Copy, Check, Heart } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { publicApi } from '@/lib/api';
import type { DonationIntentDetail as DonationIntentDetailType } from '@shared/schema';

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
  }).format(new Date(dateString));
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-success/10 text-success no-default-hover-elevate no-default-active-elevate" data-testid="badge-status">Completada</Badge>;
    case 'pending':
      return <Badge className="bg-warning/10 text-warning no-default-hover-elevate no-default-active-elevate" data-testid="badge-status">Pendiente</Badge>;
    case 'failed':
      return <Badge variant="destructive" data-testid="badge-status">Fallida</Badge>;
    case 'cancelled':
      return <Badge variant="secondary" data-testid="badge-status">Cancelada</Badge>;
    default:
      return <Badge variant="secondary" data-testid="badge-status">{status}</Badge>;
  }
}

function getDonationTypeLabel(type: string, interval: string | null) {
  if (type === 'recurring' && interval) {
    const labels: Record<string, string> = {
      weekly: 'Semanal',
      monthly: 'Mensual',
      semiannual: 'Semestral',
      yearly: 'Anual',
    };
    return `Recurrente (${labels[interval] || interval})`;
  }
  return 'Única vez';
}

function DetailRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${mono ? 'font-mono text-xs break-all' : ''}`} data-testid={`text-detail-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DonationIntentDetailPage() {
  const { intentId } = useParams<{ intentId: string }>();
  const [copied, setCopied] = useState(false);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['/api/public/donation-intents', intentId],
    queryFn: () => publicApi.getDonationIntent(intentId!),
    enabled: !!intentId,
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingPage />
      </div>
    );
  }

  if (error || !response?.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2" data-testid="text-intent-not-found">Donación no encontrada</h2>
            <p className="text-muted-foreground">
              La donación que buscas no existe o ya no está disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const intent = response.data;
  const donorName = intent.is_anonymous
    ? 'Anónimo'
    : `${intent.donor_first_name} ${intent.donor_last_name}`;

  const campaignUrl = intent.organization_slug && intent.campaign_slug
    ? `/donar/${intent.organization_slug}/${intent.campaign_slug}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">Juntos Crecemos</p>
              <p className="text-xs text-muted-foreground">Resumen de donación</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
              <Receipt className="w-8 h-8 text-warning" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-summary-title">Resumen de donación</h1>
            <p className="text-muted-foreground">
              Tu intención de donación ha sido registrada
            </p>
            <div className="flex justify-center">
              {getStatusBadge(intent.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2" data-testid="card-intent-info">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <CardTitle className="text-base">Detalles de la transacción</CardTitle>
                {getStatusBadge(intent.status)}
              </CardHeader>
              <CardContent className="space-y-0">
                <DetailRow
                  icon={Hash}
                  label="ID de Transacción"
                  value={intent.id}
                  mono
                />
                <DetailRow
                  icon={Receipt}
                  label="Campaña"
                  value={intent.campaign_title}
                />
                <DetailRow
                  icon={User}
                  label="Donante"
                  value={donorName}
                />
                {!intent.is_anonymous && (
                  <DetailRow
                    icon={Mail}
                    label="Email"
                    value={intent.donor_email}
                  />
                )}
                <DetailRow
                  icon={RefreshCw}
                  label="Tipo"
                  value={getDonationTypeLabel(intent.donation_type, intent.recurring_interval)}
                />
                <DetailRow
                  icon={Calendar}
                  label="Fecha"
                  value={formatDateTime(intent.created_at)}
                />
                {intent.donor_note && (
                  <DetailRow
                    icon={Receipt}
                    label="Nota"
                    value={intent.donor_note}
                  />
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card data-testid="card-intent-summary">
                <CardHeader>
                  <CardTitle className="text-base">Monto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold" data-testid="text-intent-total">
                      {formatCurrency(intent.total_amount, intent.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-intent-type">
                      {getDonationTypeLabel(intent.donation_type, intent.recurring_interval)}
                    </p>
                  </div>

                  {intent.cover_fees && intent.fee_amount > 0 && (
                    <div className="border-t pt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Donación</span>
                        <span data-testid="text-intent-base-amount">{formatCurrency(intent.amount, intent.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarifa ({intent.fee_percent}%)</span>
                        <span data-testid="text-intent-fee">{formatCurrency(intent.fee_amount, intent.currency)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(intent.total_amount, intent.currency)}</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estado</span>
                      {getStatusBadge(intent.status)}
                    </div>
                    {intent.organization_name && (
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-muted-foreground flex-shrink-0">Organización</span>
                        <span className="font-medium text-right truncate" data-testid="text-intent-org">{intent.organization_name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {campaignUrl && (
              <Link href={campaignUrl}>
                <Button variant="outline" data-testid="button-back-campaign">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a la campaña
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleCopyLink} data-testid="button-share">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Enlace copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Compartir
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Desarrollado por <span className="font-semibold text-primary">Juntos Crecemos</span>
          </p>
          <p className="mt-1">
            Plataforma segura para donaciones a ONGs en América del Sur
          </p>
        </div>
      </footer>
    </div>
  );
}
