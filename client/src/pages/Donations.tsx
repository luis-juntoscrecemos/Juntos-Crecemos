import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Heart, Download, Search, FileText, Calendar, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { donationsApi, campaignsApi } from '@/lib/api';
import type { DonationsFilterParams } from '@/lib/api';
import type { Donation, CampaignWithTotals } from '@shared/schema';

type DatePreset = '7d' | '30d' | '90d' | 'ytd';

const presetLabels: Record<DatePreset, string> = {
  '7d': '7 días',
  '30d': '30 días',
  '90d': '90 días',
  'ytd': 'Este año',
};

const validPresets: DatePreset[] = ['7d', '30d', '90d', 'ytd'];

function isValidPreset(value: string): value is DatePreset {
  return validPresets.includes(value as DatePreset);
}

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
    hour: '2-digit',
    minute: '2-digit',
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
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function readUrlParams(): { range?: DatePreset; start?: string; end?: string } {
  const params = new URLSearchParams(window.location.search);
  const range = params.get('range');
  const start = params.get('start');
  const end = params.get('end');

  if (range && isValidPreset(range)) {
    return { range };
  }
  if (start && end) {
    return { start, end };
  }
  return {};
}

function writeUrlParams(params: { range?: string; start?: string; end?: string }) {
  const url = new URL(window.location.href);
  url.searchParams.delete('range');
  url.searchParams.delete('start');
  url.searchParams.delete('end');

  if (params.range) {
    url.searchParams.set('range', params.range);
  } else if (params.start && params.end) {
    url.searchParams.set('start', params.start);
    url.searchParams.set('end', params.end);
  }

  window.history.replaceState({}, '', url.toString());
}

export default function DonationsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const initialParams = useMemo(() => readUrlParams(), []);
  const [datePreset, setDatePreset] = useState<DatePreset | null>(initialParams.range || null);
  const [customStart, setCustomStart] = useState(initialParams.start || '');
  const [customEnd, setCustomEnd] = useState(initialParams.end || '');
  const [appliedCustomStart, setAppliedCustomStart] = useState(initialParams.start || '');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState(initialParams.end || '');

  const dateFilterParams = useMemo((): DonationsFilterParams => {
    const params: DonationsFilterParams = {};
    if (datePreset) {
      params.range = datePreset;
    } else if (appliedCustomStart && appliedCustomEnd) {
      params.start = appliedCustomStart;
      params.end = appliedCustomEnd;
    }
    if (campaignFilter && campaignFilter !== 'all') {
      params.campaign_id = campaignFilter;
    }
    return params;
  }, [datePreset, appliedCustomStart, appliedCustomEnd, campaignFilter]);

  useEffect(() => {
    if (datePreset) {
      writeUrlParams({ range: datePreset });
    } else if (appliedCustomStart && appliedCustomEnd) {
      writeUrlParams({ start: appliedCustomStart, end: appliedCustomEnd });
    } else {
      writeUrlParams({});
    }
  }, [datePreset, appliedCustomStart, appliedCustomEnd]);

  const handlePresetClick = useCallback((preset: DatePreset) => {
    if (datePreset === preset) {
      setDatePreset(null);
    } else {
      setDatePreset(preset);
      setCustomStart('');
      setCustomEnd('');
      setAppliedCustomStart('');
      setAppliedCustomEnd('');
    }
  }, [datePreset]);

  const handleApplyCustomRange = useCallback(() => {
    if (customStart && customEnd) {
      if (customStart > customEnd) {
        toast({ variant: 'destructive', title: 'Error', description: 'La fecha inicial debe ser anterior a la fecha final' });
        return;
      }
      setDatePreset(null);
      setAppliedCustomStart(customStart);
      setAppliedCustomEnd(customEnd);
    }
  }, [customStart, customEnd, toast]);

  const handleClearFilters = useCallback(() => {
    setDatePreset(null);
    setCustomStart('');
    setCustomEnd('');
    setAppliedCustomStart('');
    setAppliedCustomEnd('');
  }, []);

  const hasDateFilter = datePreset !== null || (appliedCustomStart !== '' && appliedCustomEnd !== '');

  const queryParams = useMemo(() => {
    const p: DonationsFilterParams = {};
    if (datePreset) p.range = datePreset;
    else if (appliedCustomStart && appliedCustomEnd) {
      p.start = appliedCustomStart;
      p.end = appliedCustomEnd;
    }
    if (campaignFilter && campaignFilter !== 'all') p.campaign_id = campaignFilter;
    return p;
  }, [datePreset, appliedCustomStart, appliedCustomEnd, campaignFilter]);

  const { data: donationsResponse, isLoading: donationsLoading } = useQuery({
    queryKey: ['/api/donations', queryParams],
    queryFn: () => donationsApi.list(queryParams),
  });

  const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery<{ data?: CampaignWithTotals[] }>({
    queryKey: ['/api/campaigns'],
  });

  const isLoading = donationsLoading || campaignsLoading;

  if (isLoading) {
    return <LoadingPage />;
  }

  const donations = (donationsResponse?.data || []) as Donation[];
  const campaigns = (campaignsResponse?.data || []) as CampaignWithTotals[];
  const totalCount = donationsResponse?.totalCount ?? 0;
  const totalAmount = donationsResponse?.totalAmount ?? 0;

  const filteredDonations = donations.filter((donation) => {
    if (!searchQuery) return true;
    return (
      donation.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.donor_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const blob = await donationsApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donaciones_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Exportación exitosa',
        description: 'El archivo CSV se descargó correctamente',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo exportar las donaciones',
      });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const blob = await donationsApi.exportPdf(dateFilterParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_donaciones_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Exportación exitosa',
        description: 'El reporte PDF se descargó correctamente',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo exportar el reporte PDF',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.title || 'Campaña eliminada';
  };

  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

  const dateLabel = datePreset
    ? presetLabels[datePreset]
    : appliedCustomStart && appliedCustomEnd
      ? `${appliedCustomStart} — ${appliedCustomEnd}`
      : 'Todo el tiempo';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donaciones"
        description={`Historial de donaciones — ${dateLabel}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleExportPdf}
              disabled={isExportingPdf || donations.length === 0}
              data-testid="button-export-pdf"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isExportingPdf ? 'Exportando...' : 'Descargar PDF'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={isExportingCsv || donations.length === 0}
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExportingCsv ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        }
      />

      <Card data-testid="card-date-filters">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground mr-1">Período:</span>
              <div className="flex rounded-md border" data-testid="date-range-selector">
                {validPresets.map((preset) => (
                  <Button
                    key={preset}
                    variant={datePreset === preset ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className={`rounded-none first:rounded-l-md last:rounded-r-md ${datePreset !== preset ? 'border-0' : ''}`}
                    data-testid={`button-preset-${preset}`}
                  >
                    {presetLabels[preset]}
                  </Button>
                ))}
              </div>
              {hasDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  data-testid="button-clear-date-filter"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Rango personalizado:</span>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-[160px]"
                data-testid="input-date-start"
              />
              <span className="text-sm text-muted-foreground">a</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-[160px]"
                data-testid="input-date-end"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyCustomRange}
                disabled={!customStart || !customEnd}
                data-testid="button-apply-custom-range"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-raised">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total recaudado</div>
            <div className="text-2xl font-bold" data-testid="text-total-raised">
              {formatCurrency(totalAmount)}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-total-count">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Donaciones completadas</div>
            <div className="text-2xl font-bold" data-testid="text-total-count">{totalCount}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-average">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Promedio por donación</div>
            <div className="text-2xl font-bold" data-testid="text-average">
              {totalCount > 0 ? formatCurrency(averageAmount) : '$0'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Historial de donaciones</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar donante..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                  data-testid="input-search-donations"
                />
              </div>
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-campaign-filter">
                  <SelectValue placeholder="Filtrar por campaña" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las campañas</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDonations.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No hay donaciones"
              description={searchQuery || campaignFilter !== 'all' || hasDateFilter
                ? 'No se encontraron donaciones con los filtros aplicados'
                : 'Aún no has recibido donaciones'}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Donante</TableHead>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Recurrente</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.map((donation) => (
                    <TableRow key={donation.id} data-testid={`donation-row-${donation.id}`}>
                      <TableCell>
                        <Link href={`/donations/${donation.id}`}>
                          <span className="font-mono text-sm text-primary cursor-pointer hover:underline" data-testid={`link-donation-${donation.id}`}>
                            {donation.short_id || donation.id.substring(0, 8)}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium" data-testid={`text-donor-name-${donation.id}`}>
                            {donation.is_anonymous
                              ? 'Donante Anónimo'
                              : donation.donor_name || 'Sin nombre'}
                          </p>
                          {!donation.is_anonymous && donation.donor_email && (
                            <p className="text-xs text-muted-foreground">{donation.donor_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" data-testid={`text-campaign-${donation.id}`}>{getCampaignName(donation.campaign_id)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold" data-testid={`text-amount-${donation.id}`}>
                          {formatCurrency(donation.amount_minor / 100, donation.currency)}
                        </span>
                      </TableCell>
                      <TableCell data-testid={`cell-status-${donation.id}`}>
                        {getStatusBadge(donation.status)}
                      </TableCell>
                      <TableCell>
                        {donation.is_recurring ? (
                          <Badge variant="outline" className="no-default-hover-elevate no-default-active-elevate" data-testid={`badge-recurring-${donation.id}`}>Mensual</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm" data-testid={`text-type-${donation.id}`}>Única</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground whitespace-nowrap" data-testid={`text-date-${donation.id}`}>
                          {formatDate(donation.created_at)}
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
