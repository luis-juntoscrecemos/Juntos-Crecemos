import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Search, Download, Eye, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { internalApi } from '@/lib/internalApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

export default function InternalOrganizations() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const pageSize = 20;

  const { data: resp, isLoading } = useQuery({
    queryKey: ['/api/internal/orgs', search, page, sort, sortDir],
    queryFn: () => internalApi.getOrgs({ search, page: String(page), pageSize: String(pageSize), sort, sortDir }),
  });

  const orgs = (resp as any)?.data?.data || [];
  const total = (resp as any)?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const toggleSort = (col: string) => {
    if (sort === col) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSort(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleExport = async () => {
    const result = await internalApi.exportOrgs({ search });
    if (result.data) {
      const blob = result.data as unknown as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'organizaciones.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Organizaciones</h1>
          <p className="text-muted-foreground text-sm">{total} organizaciones registradas</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-orgs">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, slug, email o país..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
              data-testid="input-search-orgs"
            />
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                        <div className="flex items-center gap-1">Nombre <ArrowUpDown className="w-3 h-3" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort('created_at')}>
                        <div className="flex items-center gap-1">Registro <ArrowUpDown className="w-3 h-3" /></div>
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Donaciones</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgs.map((org: any) => (
                      <TableRow key={org.id} data-testid={`row-org-${org.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{org.name}</p>
                            <p className="text-xs text-muted-foreground">{org.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(org.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={org.status === 'SUSPENDED' ? 'destructive' : 'secondary'}>
                            {org.status === 'SUSPENDED' ? 'Suspendida' : 'Activa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{org.donations_count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(org.donations_total)}</TableCell>
                        <TableCell>
                          <Link href={`/internal/organizations/${org.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-org-${org.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orgs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron organizaciones
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Siguiente
                    </Button>
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
