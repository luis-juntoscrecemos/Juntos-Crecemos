import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Heart, Download, Search } from 'lucide-react';
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
import type { Donation, CampaignWithTotals } from '@shared/schema';

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
      return <Badge className="bg-success text-success-foreground">Completada</Badge>;
    case 'pending':
      return <Badge className="bg-warning text-warning-foreground">Pendiente</Badge>;
    case 'failed':
      return <Badge variant="destructive">Fallida</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function DonationsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data: donationsResponse, isLoading: donationsLoading } = useQuery<{ data: Donation[] }>({
    queryKey: ['/api/donations'],
  });

  const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery<{ data: CampaignWithTotals[] }>({
    queryKey: ['/api/campaigns'],
  });

  const isLoading = donationsLoading || campaignsLoading;

  if (isLoading) {
    return <LoadingPage />;
  }

  const donations = (donationsResponse?.data || []) as Donation[];
  const campaigns = (campaignsResponse?.data || []) as CampaignWithTotals[];

  const filteredDonations = donations.filter((donation) => {
    const matchesSearch = !searchQuery || 
      donation.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.donor_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCampaign = campaignFilter === 'all' || donation.campaign_id === campaignFilter;
    
    return matchesSearch && matchesCampaign;
  });

  const handleExport = async () => {
    setIsExporting(true);
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
      setIsExporting(false);
    }
  };

  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.title || 'Campaña eliminada';
  };

  const totalRaised = donations
    .filter(d => d.status === 'paid')
    .reduce((sum, d) => sum + d.amount_minor, 0);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Donaciones" 
        description="Historial de todas las donaciones recibidas"
        actions={
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={isExporting || donations.length === 0}
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total recaudado</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalRaised / 100)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total donaciones</div>
            <div className="text-2xl font-bold">{donations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Promedio por donación</div>
            <div className="text-2xl font-bold">
              {donations.length > 0 
                ? formatCurrency((totalRaised / 100) / donations.filter(d => d.status === 'paid').length)
                : '$0'}
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
              description={searchQuery || campaignFilter !== 'all' 
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
                          <p className="font-medium">
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
                        <span className="text-sm">{getCampaignName(donation.campaign_id)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {formatCurrency(donation.amount_minor / 100, donation.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(donation.status)}
                      </TableCell>
                      <TableCell>
                        {donation.is_recurring ? (
                          <Badge variant="outline">Mensual</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Única</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
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
