import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Server, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { internalApi } from '@/lib/internalApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(date));
}

export default function InternalHealth() {
  const { data: resp, isLoading, refetch } = useQuery({
    queryKey: ['/api/internal/health'],
    queryFn: () => internalApi.getHealth(),
    refetchInterval: 30000,
  });

  const health = (resp as any)?.data?.data;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">Estado del Sistema</h1>
            <p className="text-muted-foreground text-sm">Monitoreo en tiempo real</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="text-sm text-muted-foreground hover:text-foreground" data-testid="button-refresh-health">
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-health-api">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Server className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">API</p>
                <Badge variant={health?.api === 'ok' ? 'default' : 'destructive'} className="mt-1">
                  {health?.api === 'ok' ? 'Operativo' : 'Error'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-health-db">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Database className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Base de Datos</p>
                <Badge variant={health?.database === 'ok' ? 'default' : 'destructive'} className="mt-1">
                  {health?.database === 'ok' ? 'Conectado' : 'Error'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-health-version">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Versión</p>
                <p className="text-lg font-bold mt-1">{health?.version || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-health-uptime">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Última Verificación</p>
                <p className="text-sm font-medium mt-1">{health?.timestamp ? formatDateTime(health.timestamp) : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {health?.counts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{health.counts.organizations || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Organizaciones</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{health.counts.campaigns || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Campañas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{health.counts.donations || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Donaciones</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{health.counts.donors || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Donantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
