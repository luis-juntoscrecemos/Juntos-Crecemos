import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { internalApi } from '@/lib/internalApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  paid: { label: 'Pagado', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  failed: { label: 'Fallido', variant: 'destructive' },
};

export default function InternalDonations() {
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [status, setStatus] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  const filters = { dateStart, dateEnd, status, amountMin, amountMax, page: String(page), pageSize: String(pageSize) };

  const { data: resp, isLoading } = useQuery({
    queryKey: ['/api/internal/donations', filters],
    queryFn: () => internalApi.getDonations(filters),
  });

  const donations = (resp as any)?.data?.data || [];
  const total = (resp as any)?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleExportCsv = async () => {
    const result = await internalApi.exportDonations(filters);
    if (result.data) {
      const blob = result.data as unknown as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'donaciones.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearFilters = () => {
    setDateStart('');
    setDateEnd('');
    setStatus('');
    setAmountMin('');
    setAmountMax('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Donaciones</h1>
          <p className="text-muted-foreground text-sm">{total} donaciones en total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} data-testid="button-export-donations">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs">Desde</Label>
                <Input type="date" value={dateStart} onChange={(e) => { setDateStart(e.target.value); setPage(1); }} data-testid="input-date-start" />
              </div>
              <div>
                <Label className="text-xs">Hasta</Label>
                <Input type="date" value={dateEnd} onChange={(e) => { setDateEnd(e.target.value); setPage(1); }} data-testid="input-date-end" />
              </div>
              <div>
                <Label className="text-xs">Estado</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v === '_all' ? '' : v); setPage(1); }}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todos</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Monto mín (COP)</Label>
                <Input type="number" value={amountMin} onChange={(e) => { setAmountMin(e.target.value); setPage(1); }} placeholder="0" data-testid="input-amount-min" />
              </div>
              <div>
                <Label className="text-xs">Monto máx (COP)</Label>
                <Input type="number" value={amountMax} onChange={(e) => { setAmountMax(e.target.value); setPage(1); }} placeholder="∞" data-testid="input-amount-max" />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donante</TableHead>
                      <TableHead>Organización</TableHead>
                      <TableHead>Campaña</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((d: any) => (
                      <TableRow key={d.id} data-testid={`row-donation-${d.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{d.is_anonymous ? 'Anónimo' : d.donor_name || '—'}</p>
                            {!d.is_anonymous && d.donor_email && (
                              <p className="text-xs text-muted-foreground">{d.donor_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{d.organization_name || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.campaign_title || '—'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency((d.amount_minor || 0) / 100)}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_MAP[d.status]?.variant || 'outline'}>
                            {STATUS_MAP[d.status]?.label || d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{d.paid_at ? formatDate(d.paid_at) : formatDate(d.created_at)}</TableCell>
                      </TableRow>
                    ))}
                    {donations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron donaciones
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
