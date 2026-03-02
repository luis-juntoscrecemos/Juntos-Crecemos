import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, Building2, Heart, Users, Megaphone, Ban, CheckCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { internalApi } from '@/lib/internalApi';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { queryClient } from '@/lib/queryClient';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

interface InternalOrgDetailProps {
  adminRole?: string;
  onStartImpersonation?: (orgId: string, orgName: string) => void;
}

export default function InternalOrgDetail({ adminRole, onStartImpersonation }: InternalOrgDetailProps) {
  const [, params] = useRoute('/internal/organizations/:id');
  const orgId = params?.id || '';
  const { toast } = useToast();
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const { data: resp, isLoading } = useQuery({
    queryKey: ['/api/internal/orgs', orgId],
    queryFn: () => internalApi.getOrg(orgId),
    enabled: !!orgId,
  });

  const detail = (resp as any)?.data?.data;
  const org = detail?.organization;
  const campaigns = detail?.campaigns || [];
  const donations = detail?.recentDonations || [];
  const stats = detail?.stats;
  const isSuperAdmin = adminRole === 'SUPER_ADMIN';

  const handleStatusChange = async () => {
    if (!org) return;
    setStatusLoading(true);
    const newStatus = org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const result = await internalApi.updateOrgStatus(orgId, newStatus, statusReason);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error as string });
    } else {
      toast({ title: 'Éxito', description: (result.data as any)?.message || 'Estado actualizado' });
      queryClient.invalidateQueries({ queryKey: ['/api/internal/orgs'] });
    }
    setStatusLoading(false);
    setStatusDialog(false);
    setStatusReason('');
  };

  const handleImpersonate = async () => {
    if (!org || !onStartImpersonation) return;
    const result = await internalApi.startImpersonation(orgId);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error as string });
    } else {
      onStartImpersonation(orgId, org.name);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!org) return <p className="text-muted-foreground">Organización no encontrada</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/internal/organizations">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" data-testid="text-org-name">{org.name}</h1>
            <Badge variant={org.status === 'SUSPENDED' ? 'destructive' : 'secondary'}>
              {org.status === 'SUSPENDED' ? 'Suspendida' : 'Activa'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{org.slug} · {org.email}</p>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImpersonate}
              data-testid="button-impersonate"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver como org
            </Button>
            <Button
              variant={org.status === 'SUSPENDED' ? 'default' : 'destructive'}
              size="sm"
              onClick={() => setStatusDialog(true)}
              data-testid="button-toggle-status"
            >
              {org.status === 'SUSPENDED' ? (
                <><CheckCircle className="w-4 h-4 mr-2" /> Restaurar</>
              ) : (
                <><Ban className="w-4 h-4 mr-2" /> Suspender</>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats?.donationsCount || 0}</p>
            <p className="text-xs text-muted-foreground">Donaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="w-5 h-5 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{formatCurrency(stats?.totalRaised || 0)}</p>
            <p className="text-xs text-muted-foreground">Total Recaudado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats?.uniqueDonors || 0}</p>
            <p className="text-xs text-muted-foreground">Donantes Únicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Megaphone className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats?.campaignsCount || 0}</p>
            <p className="text-xs text-muted-foreground">Campañas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">País</dt><dd className="font-medium">{org.country}</dd></div>
            <div><dt className="text-muted-foreground">Ciudad</dt><dd className="font-medium">{org.city}</dd></div>
            <div><dt className="text-muted-foreground">Sitio web</dt><dd className="font-medium">{org.website || '—'}</dd></div>
            <div><dt className="text-muted-foreground">Registro</dt><dd className="font-medium">{formatDate(org.created_at)}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campañas ({campaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Recaudado</TableHead>
                  <TableHead className="text-right">Donaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? 'secondary' : 'outline'}>
                        {c.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency((c.raised_minor || 0) / 100)}</TableCell>
                    <TableCell className="text-right">{c.donations_count || 0}</TableCell>
                  </TableRow>
                ))}
                {campaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sin campañas</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Donaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donante</TableHead>
                  <TableHead>Campaña</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.is_anonymous ? 'Anónimo' : d.donor_name || d.donor_email || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.campaign_title || '—'}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency((d.amount_minor || 0) / 100)}</TableCell>
                    <TableCell className="text-sm">{d.paid_at ? formatDate(d.paid_at) : formatDate(d.created_at)}</TableCell>
                  </TableRow>
                ))}
                {donations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sin donaciones</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {org.status === 'SUSPENDED' ? 'Restaurar Organización' : 'Suspender Organización'}
            </DialogTitle>
            <DialogDescription>
              {org.status === 'SUSPENDED'
                ? `¿Restaurar el acceso de ${org.name}?`
                : `¿Suspender ${org.name}? No podrán acceder a su panel.`}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reason">Razón</Label>
            <Textarea
              id="reason"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Explica el motivo..."
              data-testid="input-status-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(false)}>Cancelar</Button>
            <Button
              variant={org.status === 'SUSPENDED' ? 'default' : 'destructive'}
              onClick={handleStatusChange}
              disabled={statusLoading}
              data-testid="button-confirm-status"
            >
              {statusLoading ? 'Procesando...' : org.status === 'SUSPENDED' ? 'Restaurar' : 'Suspender'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
