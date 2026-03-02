import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, Heart, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { internalApi } from '@/lib/internalApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

export default function InternalDonorDetail() {
  const [, params] = useRoute('/internal/donors/:id');
  const donorId = params?.id || '';

  const { data: resp, isLoading } = useQuery({
    queryKey: ['/api/internal/donors', donorId],
    queryFn: () => internalApi.getDonor(donorId),
    enabled: !!donorId,
  });

  const detail = (resp as any)?.data?.data;
  const donor = detail?.donor;
  const donations = detail?.donations || [];
  const stats = detail?.stats;

  if (isLoading) return <LoadingSpinner />;
  if (!donor) return <p className="text-muted-foreground">Donante no encontrado</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/internal/donors">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-donor-name">{donor.full_name || 'Sin nombre'}</h1>
          <p className="text-sm text-muted-foreground">{donor.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <User className="w-5 h-5 mx-auto mb-2 text-purple-500" />
            <p className="text-xs text-muted-foreground">Registro</p>
            <p className="text-sm font-medium">{formatDate(donor.created_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-xs text-muted-foreground">Donaciones</p>
            <p className="text-2xl font-bold">{stats?.donationsCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 mx-auto mb-2 text-amber-500" />
            <p className="text-xs text-muted-foreground">Total Donado</p>
            <p className="text-2xl font-bold">{formatCurrency(stats?.totalDonated || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Donaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organización</TableHead>
                  <TableHead>Campaña</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.organization_name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.campaign_title || '—'}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency((d.amount_minor || 0) / 100)}</TableCell>
                    <TableCell className="text-sm">{d.paid_at ? formatDate(d.paid_at) : formatDate(d.created_at)}</TableCell>
                  </TableRow>
                ))}
                {donations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin donaciones registradas</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
