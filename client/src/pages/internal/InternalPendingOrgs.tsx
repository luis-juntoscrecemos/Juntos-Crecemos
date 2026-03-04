import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, CheckCircle, XCircle, Building2, Mail, MapPin, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { internalApi } from '@/lib/internalApi';

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

interface PendingOrg {
  id: string;
  name: string;
  slug: string;
  email: string;
  country: string;
  city: string;
  logo_url: string | null;
  created_at: string;
  review_status: string;
  review_notes: string | null;
}

export default function InternalPendingOrgs({ adminRole }: { adminRole: string }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reviewingOrg, setReviewingOrg] = useState<PendingOrg | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pageSize = 20;

  const canReview = adminRole === 'SUPER_ADMIN' || adminRole === 'ADMIN';

  const { data: resp, isLoading } = useQuery({
    queryKey: ['/api/internal/pending-orgs', search, page],
    queryFn: () => internalApi.getPendingOrgs({ search, page: page.toString(), pageSize: pageSize.toString() }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'APPROVED' | 'REJECTED'; notes: string }) =>
      internalApi.reviewOrg(id, action, notes),
    onSuccess: (result) => {
      const r = result as any;
      if (r.error) {
        toast({ variant: 'destructive', title: 'Error', description: r.error });
        return;
      }
      toast({
        title: reviewAction === 'APPROVED' ? 'Organización aprobada' : 'Organización rechazada',
        description: reviewAction === 'APPROVED'
          ? 'La organización ahora puede recibir donaciones.'
          : 'La organización ha sido rechazada.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/internal/pending-orgs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/internal/orgs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/internal/metrics'] });
      setReviewingOrg(null);
      setReviewAction(null);
      setReviewNotes('');
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Error al procesar la revisión' });
    },
  });

  const data = (resp as any)?.data;
  const orgs: PendingOrg[] = data?.data || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleReview = (org: PendingOrg, action: 'APPROVED' | 'REJECTED') => {
    setReviewingOrg(org);
    setReviewAction(action);
    setReviewNotes('');
  };

  const confirmReview = () => {
    if (!reviewingOrg || !reviewAction) return;
    if (reviewAction === 'REJECTED' && !reviewNotes.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes proporcionar una razón para rechazar la organización.' });
      return;
    }
    reviewMutation.mutate({ id: reviewingOrg.id, action: reviewAction, notes: reviewNotes });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizaciones Pendientes"
        description="Organizaciones que requieren revisión y aprobación antes de poder recibir donaciones."
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
            data-testid="input-search-pending"
          />
        </div>
        <Badge variant="outline" className="text-sm" data-testid="badge-pending-count">
          {total} pendiente{total !== 1 ? 's' : ''}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : orgs.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-12 h-12 text-green-500" />}
          title="No hay organizaciones pendientes"
          description="Todas las organizaciones han sido revisadas."
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organización</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Fecha de registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((org) => (
                    <TableRow key={org.id} data-testid={`row-pending-org-${org.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-org-name-${org.id}`}>{org.name}</p>
                            <p className="text-xs text-muted-foreground">{org.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {org.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {org.city}, {org.country}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(org.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canReview ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleReview(org, 'APPROVED')}
                                data-testid={`button-approve-${org.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReview(org, 'REJECTED')}
                                data-testid={`button-reject-${org.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline">Solo lectura</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} data-testid="button-prev-page">
                  Anterior
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)} data-testid="button-next-page">
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={!!reviewingOrg && !!reviewAction} onOpenChange={(open) => { if (!open) { setReviewingOrg(null); setReviewAction(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'APPROVED' ? 'Aprobar organización' : 'Rechazar organización'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'APPROVED'
                ? `¿Confirmas que deseas aprobar "${reviewingOrg?.name}"? La organización podrá recibir donaciones inmediatamente.`
                : `¿Confirmas que deseas rechazar "${reviewingOrg?.name}"? Debes proporcionar una razón.`}
            </DialogDescription>
          </DialogHeader>

          {reviewingOrg && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{reviewingOrg.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  {reviewingOrg.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {reviewingOrg.city}, {reviewingOrg.country}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Registrada el {formatDate(reviewingOrg.created_at)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Notas internas {reviewAction === 'REJECTED' && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  placeholder={reviewAction === 'REJECTED' ? 'Razón del rechazo (requerido)...' : 'Notas opcionales...'}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-review-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setReviewingOrg(null); setReviewAction(null); }} data-testid="button-cancel-review">
              Cancelar
            </Button>
            <Button
              onClick={confirmReview}
              disabled={reviewMutation.isPending}
              className={reviewAction === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={reviewAction === 'REJECTED' ? 'destructive' : 'default'}
              data-testid="button-confirm-review"
            >
              {reviewMutation.isPending ? 'Procesando...' : reviewAction === 'APPROVED' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
