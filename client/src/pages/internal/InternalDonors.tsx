import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Search, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { internalApi } from '@/lib/internalApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

export default function InternalDonors() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: resp, isLoading } = useQuery({
    queryKey: ['/api/internal/donors', search, page],
    queryFn: () => internalApi.getDonors({ search, page: String(page), pageSize: String(pageSize) }),
  });

  const donors = (resp as any)?.data?.data || [];
  const total = (resp as any)?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Donantes</h1>
        <p className="text-muted-foreground text-sm">{total} donantes registrados</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
              data-testid="input-search-donors"
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
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="text-right">Donaciones</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donors.map((donor: any) => (
                      <TableRow key={donor.id} data-testid={`row-donor-${donor.id}`}>
                        <TableCell className="font-medium">{donor.full_name || '—'}</TableCell>
                        <TableCell className="text-sm">{donor.email}</TableCell>
                        <TableCell className="text-sm">{formatDate(donor.created_at)}</TableCell>
                        <TableCell className="text-right">{donor.donations_count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(donor.donations_total)}</TableCell>
                        <TableCell>
                          <Link href={`/internal/donors/${donor.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                    {donors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron donantes
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
