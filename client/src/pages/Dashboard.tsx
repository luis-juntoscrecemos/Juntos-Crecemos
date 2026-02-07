import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  TrendingUp, Heart, BarChart3, Megaphone, 
  Plus, Edit, Copy, Check, ExternalLink, 
  ArrowRight, Calendar, Receipt
} from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast';
import { dashboardApi } from '@/lib/api';
import type { CampaignWithTotals, DashboardOverview, DashboardSeriesPoint, DonationDetail } from '@shared/schema';

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

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatChartDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateString + 'T12:00:00'));
}

type DatePreset = '7d' | '30d' | '90d' | 'ytd';

function getDateRange(preset: DatePreset): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;
  switch (preset) {
    case '7d':
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      break;
    case '30d':
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      break;
    case '90d':
      start = new Date(now);
      start.setDate(start.getDate() - 89);
      break;
    case 'ytd':
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }
  start.setHours(0, 0, 0, 0);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

const presetLabels: Record<DatePreset, string> = {
  '7d': '7 días',
  '30d': '30 días',
  '90d': '90 días',
  'ytd': 'Este año',
};

const chartConfig: ChartConfig = {
  amount: {
    label: 'Monto',
    color: 'hsl(142 76% 36%)',
  },
};

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

export default function Dashboard() {
  const { toast } = useToast();
  const [datePreset, setDatePreset] = useState<DatePreset>('7d');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { start, end } = useMemo(() => getDateRange(datePreset), [datePreset]);

  const POLL_INTERVAL = 15000;

  const { data: overviewRes, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/dashboard/overview', start, end],
    queryFn: () => dashboardApi.getOverview(start, end),
    refetchInterval: POLL_INTERVAL,
  });

  const { data: seriesRes, isLoading: seriesLoading } = useQuery({
    queryKey: ['/api/dashboard/series', start, end],
    queryFn: () => dashboardApi.getSeries(start, end),
    refetchInterval: POLL_INTERVAL,
  });

  const { data: campaignsRes, isLoading: campaignsLoading } = useQuery<{ data?: CampaignWithTotals[] }>({
    queryKey: ['/api/campaigns'],
    refetchInterval: POLL_INTERVAL,
  });

  const { data: recentRes, isLoading: recentLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-donations', start, end],
    queryFn: () => dashboardApi.getRecentDonations(start, end, 15),
    refetchInterval: POLL_INTERVAL,
  });

  const isLoading = overviewLoading || campaignsLoading || seriesLoading || recentLoading;

  if (isLoading) {
    return <LoadingPage />;
  }

  const defaultOverview = { totalRaised: 0, donationsCount: 0, averageTicket: 0, activeCampaigns: 0 };
  const overview: DashboardOverview = overviewRes?.data && typeof overviewRes.data === 'object' && 'totalRaised' in overviewRes.data
    ? overviewRes.data as DashboardOverview
    : defaultOverview;
  const series: DashboardSeriesPoint[] = Array.isArray(seriesRes?.data) ? seriesRes.data : [];
  const campaigns = (Array.isArray(campaignsRes?.data) ? campaignsRes.data : []) as CampaignWithTotals[];
  const activeCampaigns = campaigns.filter(c => c.is_active);
  const recentDonations: DonationDetail[] = Array.isArray(recentRes?.data) ? recentRes.data : [];

  const copyUrl = (campaign: CampaignWithTotals) => {
    const url = `${window.location.origin}/donar/${campaign.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(campaign.id);
    toast({ title: 'URL copiada', description: 'El enlace de donación ha sido copiado' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Panel de Control" 
        description={`Resumen de actividad — últimos ${presetLabels[datePreset]}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-md border" data-testid="date-range-selector">
              {(Object.keys(presetLabels) as DatePreset[]).map((preset) => (
                <Button
                  key={preset}
                  variant={datePreset === preset ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDatePreset(preset)}
                  className={`rounded-none first:rounded-l-md last:rounded-r-md ${datePreset !== preset ? 'border-0' : ''}`}
                  data-testid={`button-preset-${preset}`}
                >
                  {presetLabels[preset]}
                </Button>
              ))}
            </div>
            <Link href="/campaigns">
              <Button data-testid="button-new-campaign-dashboard">
                <Plus className="w-4 h-4 mr-2" />
                Nueva campaña
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Monto recaudado"
          value={formatCurrency(overview.totalRaised)}
          icon={TrendingUp}
          description={`Últimos ${presetLabels[datePreset]}`}
        />
        <StatsCard
          title="Donaciones"
          value={overview.donationsCount}
          icon={Heart}
          description={`Últimos ${presetLabels[datePreset]}`}
        />
        <StatsCard
          title="Ticket promedio"
          value={formatCurrency(overview.averageTicket)}
          icon={Receipt}
          description={`Últimos ${presetLabels[datePreset]}`}
        />
        <StatsCard
          title="Campañas activas"
          value={overview.activeCampaigns}
          icon={Megaphone}
          description="Actualmente en progreso"
        />
      </div>

      {/* Hero Chart */}
      <Card data-testid="card-donations-chart">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              Donaciones en el tiempo
            </CardTitle>
            <CardDescription>
              Monto recaudado por día — últimos {presetLabels[datePreset]}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {seriesLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Cargando gráfico...</p>
            </div>
          ) : series.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Sin datos para este período</p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={series} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatChartDate}
                  interval={series.length > 14 ? Math.floor(series.length / 7) : 0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => {
                    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
                    return `$${v}`;
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => formatChartDate(label as string)}
                      formatter={(value) => [`Monto: ${formatCurrency(value as number)}`, '']}
                    />
                  }
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Active Campaigns */}
      <Card data-testid="card-active-campaigns">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Campañas activas</CardTitle>
            <CardDescription>Estado y progreso de tus campañas</CardDescription>
          </div>
          <Link href="/campaigns">
            <Button variant="outline" size="sm" data-testid="button-view-all-campaigns">
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {activeCampaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No tienes campañas activas"
              description="Crea una campaña para comenzar a recibir donaciones"
              actionLabel="Crear campaña"
              onAction={() => {
                window.location.href = '/campaigns';
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead className="text-right">Recaudado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeCampaigns.map((campaign) => {
                    const progress = campaign.goal_amount 
                      ? Math.min(100, (campaign.raised_minor / (campaign.goal_amount * 100)) * 100)
                      : 0;
                    return (
                      <TableRow key={campaign.id} data-testid={`campaign-row-${campaign.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>{campaign.title}</p>
                            <p className="text-xs text-muted-foreground">{campaign.donations_count} donaciones</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                            {campaign.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="space-y-1">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {progress.toFixed(0)}%
                              {campaign.goal_amount && ` de ${formatCurrency(campaign.goal_amount)}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(campaign.raised_minor / 100)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" asChild>
                              <a href={`/donar/${campaign.slug}`} target="_blank" rel="noopener noreferrer" data-testid={`button-view-campaign-${campaign.id}`}>
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                            <Link href="/campaigns">
                              <Button size="icon" variant="ghost" data-testid={`button-edit-campaign-${campaign.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyUrl(campaign)}
                              data-testid={`button-copy-url-${campaign.id}`}
                            >
                              {copiedId === campaign.id ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Donations */}
      <Card data-testid="card-recent-donations">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Donaciones recientes</CardTitle>
            <CardDescription>Últimas transacciones — {presetLabels[datePreset]}</CardDescription>
          </div>
          <Link href="/donations">
            <Button variant="outline" size="sm" data-testid="button-view-all-donations">
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Cargando donaciones...</p>
            </div>
          ) : recentDonations.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Sin donaciones en este período"
              description="No se encontraron donaciones en el rango seleccionado"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Donante</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDonations.map((donation) => (
                    <TableRow key={donation.id} data-testid={`donation-row-${donation.id}`}>
                      <TableCell>
                        <Link href={`/donations/${donation.id}`}>
                          <span 
                            className="text-sm font-mono text-primary cursor-pointer hover:underline"
                            data-testid={`link-donation-${donation.id}`}
                          >
                            {donation.id.substring(0, 8)}...
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm" data-testid={`text-donor-name-${donation.id}`}>
                          {donation.is_anonymous ? 'Anónimo' : donation.donor_name || 'Sin nombre'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm" data-testid={`text-donation-amount-${donation.id}`}>
                          {formatCurrency(donation.amount_minor / 100, donation.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground" data-testid={`text-campaign-name-recent-${donation.id}`}>
                          {donation.campaign_title || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {donation.is_recurring ? (
                          <Badge variant="outline" className="no-default-hover-elevate no-default-active-elevate" data-testid={`badge-recurring-${donation.id}`}>Recurrente</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground" data-testid={`text-type-${donation.id}`}>Única</span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`cell-status-${donation.id}`}>{getStatusBadge(donation.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground whitespace-nowrap" data-testid={`text-date-${donation.id}`}>
                          {formatDateTime(donation.created_at)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
