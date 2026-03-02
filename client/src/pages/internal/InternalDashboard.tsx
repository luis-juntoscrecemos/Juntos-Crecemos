import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Heart, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { internalApi } from '@/lib/internalApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const RANGES = [
  { value: '7', label: '7 días' },
  { value: '30', label: '30 días' },
  { value: '90', label: '90 días' },
  { value: 'all', label: 'Todo' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function InternalDashboard() {
  const [range, setRange] = useState('30');

  const { data: metricsResp, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/internal/metrics', range],
    queryFn: () => internalApi.getMetrics(range),
  });

  const { data: seriesResp } = useQuery({
    queryKey: ['/api/internal/metrics/series', range],
    queryFn: () => internalApi.getMetricsSeries(range),
  });

  const { data: topOrgsResp } = useQuery({
    queryKey: ['/api/internal/metrics/top-orgs', range],
    queryFn: () => internalApi.getTopOrgs(range, 8),
  });

  const metrics = (metricsResp as any)?.data?.data;
  const series = (seriesResp as any)?.data?.data || [];
  const topOrgs = (topOrgsResp as any)?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Panel Interno</h1>
          <p className="text-muted-foreground text-sm">Métricas generales de la plataforma</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange(r.value)}
              data-testid={`button-range-${r.value}`}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {metricsLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-metric-orgs">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Organizaciones</p>
                  <p className="text-2xl font-bold">{metrics?.organizationsCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-metric-donors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Donantes</p>
                  <p className="text-2xl font-bold">{metrics?.donorsCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-metric-donations">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Donaciones</p>
                  <p className="text-2xl font-bold">{metrics?.donationsCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-metric-raised">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Recaudado</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics?.totalRaised || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Donaciones en el tiempo</CardTitle>
          </CardHeader>
          <CardContent>
            {series.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                    formatter={(value: number) => [formatCurrency(value), 'Monto']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">Sin datos para el período seleccionado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Organizaciones por Donaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {topOrgs.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topOrgs} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                  />
                  <Bar dataKey="total" fill="hsl(45, 100%, 48%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">Sin datos para el período seleccionado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
