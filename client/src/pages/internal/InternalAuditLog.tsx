import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { internalApi } from '@/lib/internalApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(date));
}

const ACTION_COLORS: Record<string, string> = {
  ORG_SUSPENDED: 'destructive',
  ORG_RESTORED: 'default',
  IMPERSONATION_START: 'secondary',
  IMPERSONATION_STOP: 'secondary',
  ADMIN_INVITED: 'outline',
  INVITE_ACCEPTED: 'default',
  EXPORT_ORGS: 'outline',
  EXPORT_DONATIONS: 'outline',
};

export default function InternalAuditLog() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const pageSize = 25;

  const { data: resp, isLoading } = useQuery({
    queryKey: ['/api/internal/audit-logs', page, action],
    queryFn: () => internalApi.getAuditLogs({ page: String(page), pageSize: String(pageSize), action }),
  });

  const logs = (resp as any)?.data?.data || [];
  const total = (resp as any)?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold">Registro de Auditoría</h1>
            <p className="text-muted-foreground text-sm">{total} eventos registrados</p>
          </div>
        </div>
        <Select value={action || '_all'} onValueChange={(v) => { setAction(v === '_all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[200px]" data-testid="select-audit-action">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas las acciones</SelectItem>
            <SelectItem value="ORG_SUSPENDED">Org Suspendida</SelectItem>
            <SelectItem value="ORG_RESTORED">Org Restaurada</SelectItem>
            <SelectItem value="IMPERSONATION_START">Impersonación Inicio</SelectItem>
            <SelectItem value="IMPERSONATION_STOP">Impersonación Fin</SelectItem>
            <SelectItem value="ADMIN_INVITED">Admin Invitado</SelectItem>
            <SelectItem value="INVITE_ACCEPTED">Invitación Aceptada</SelectItem>
            <SelectItem value="EXPORT_ORGS">Exportar Orgs</SelectItem>
            <SelectItem value="EXPORT_DONATIONS">Exportar Donaciones</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                      <TableHead>Fecha</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                        <TableCell className="text-sm whitespace-nowrap">{formatDateTime(log.created_at)}</TableCell>
                        <TableCell className="text-sm">{log.actor_email || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={(ACTION_COLORS[log.action] as any) || 'outline'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.entity_type && (
                            <span className="text-muted-foreground">{log.entity_type}: {log.entity_id?.substring(0, 8)}...</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay registros de auditoría
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
