import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { DonorShell } from '@/components/layout/DonorShell';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { donorApi } from '@/lib/donorApi';
import {
  Heart,
  Calendar,
  Building2,
  Search,
  ArrowLeft,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import type { DonationWithOrg } from '@shared/schema';

type PublicOrg = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  verified: boolean;
};

type PublicCampaign = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  goal_amount: number | null;
  is_active: boolean;
  image_url: string | null;
  raised_minor: number;
  donations_count: number;
};

type OrgWithCampaigns = {
  organization: PublicOrg;
  campaigns: PublicCampaign[];
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString));
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    succeeded: { label: 'Exitosa', variant: 'default' },
    paid: { label: 'Pagada', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'secondary' },
    failed: { label: 'Fallida', variant: 'destructive' },
    refunded: { label: 'Reembolsada', variant: 'outline' },
  };

  const config = statusMap[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function OrgSearchView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<PublicOrg | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orgsResponse, isLoading: orgsLoading } = useQuery<{ data?: PublicOrg[] }>({
    queryKey: ['/api/public/organizations', searchTerm],
    queryFn: async () => {
      const params = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/public/organizations${params}`);
      return res.json();
    },
  });

  const { data: orgDetailResponse, isLoading: detailLoading } = useQuery<{ data?: OrgWithCampaigns }>({
    queryKey: ['/api/public/organizations', selectedOrg?.slug],
    queryFn: async () => {
      if (!selectedOrg?.slug) return { data: undefined };
      const res = await fetch(`/api/public/organizations/${selectedOrg.slug}`);
      return res.json();
    },
    enabled: !!selectedOrg?.slug,
  });

  const { data: favoriteCheckResponse } = useQuery<{ data?: { isFavorited: boolean } }>({
    queryKey: ['/api/donor/favorites/check', selectedOrg?.id],
    queryFn: async () => {
      if (!selectedOrg?.id) return { data: { isFavorited: false } };
      return donorApi.checkFavorite(selectedOrg.id);
    },
    enabled: !!selectedOrg?.id,
  });

  const isFavorited = favoriteCheckResponse?.data?.isFavorited ?? false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (orgId: string) => {
      if (isFavorited) {
        return donorApi.removeFavorite(orgId);
      } else {
        return donorApi.addFavorite(orgId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/donor/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/donor/favorites/check', selectedOrg?.id] });
      toast({
        title: isFavorited ? 'Favorito eliminado' : 'Favorito agregado',
        description: isFavorited
          ? 'La organización ha sido removida de tus favoritos.'
          : 'La organización ha sido agregada a tus favoritos.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el favorito. Intenta de nuevo.',
      });
    },
  });

  const orgs = orgsResponse?.data || [];
  const orgDetail = orgDetailResponse?.data;

  if (selectedOrg && orgDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedOrg(null)}
            data-testid="button-back-to-search"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 rounded-md">
              {orgDetail.organization.logo_url ? (
                <AvatarImage src={orgDetail.organization.logo_url} alt={orgDetail.organization.name} />
              ) : null}
              <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{orgDetail.organization.name}</h2>
              {orgDetail.organization.city && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {orgDetail.organization.city}, {orgDetail.organization.country}
                </div>
              )}
            </div>
            <Button
              variant={isFavorited ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFavoriteMutation.mutate(selectedOrg.id)}
              disabled={toggleFavoriteMutation.isPending}
              data-testid="button-toggle-favorite"
            >
              <Heart className={`h-4 w-4 mr-1 ${isFavorited ? 'fill-current' : ''}`} />
              {isFavorited ? 'Favorita' : 'Guardar'}
            </Button>
          </div>
        </div>

        {orgDetail.organization.description && (
          <p className="text-sm text-muted-foreground">{orgDetail.organization.description}</p>
        )}

        <div>
          <h3 className="text-sm font-semibold mb-3">Campañas Activas</h3>
          {orgDetail.campaigns.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Esta organización no tiene campañas activas en este momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orgDetail.campaigns.map((campaign) => {
                const progress = campaign.goal_amount
                  ? Math.min(100, ((campaign.raised_minor / 100) / campaign.goal_amount) * 100)
                  : 0;
                return (
                  <Card key={campaign.id} className="hover-elevate" data-testid={`campaign-card-${campaign.id}`}>
                    <CardContent className="p-4 space-y-3">
                      {campaign.image_url && (
                        <img
                          src={campaign.image_url}
                          alt={campaign.title}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      )}
                      <h4 className="font-semibold text-sm">{campaign.title}</h4>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{campaign.description}</p>
                      )}
                      {campaign.goal_amount && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              {formatCurrency(campaign.raised_minor / 100)} recaudado
                            </span>
                            <span className="font-medium">
                              {formatCurrency(campaign.goal_amount)}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {campaign.donations_count} donaciones
                        </Badge>
                        <div className="flex-1" />
                        <Button size="sm" asChild data-testid={`button-donate-${campaign.id}`}>
                          <Link href={`/donar/${orgDetail.organization.slug}/${campaign.slug}`}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Donar
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedOrg && detailLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-no-donations-title">
            No tienes donaciones aún
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            Busca una organización para comenzar a donar y hacer la diferencia.
          </p>
        </div>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar organizaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="input-search-orgs"
        />
      </div>

      {orgsLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? 'No se encontraron organizaciones con ese nombre.'
              : 'No hay organizaciones disponibles en este momento.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 max-w-2xl mx-auto">
          {orgs.map((org) => (
            <Card
              key={org.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedOrg(org)}
              data-testid={`org-card-${org.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-md">
                    {org.logo_url ? (
                      <AvatarImage src={org.logo_url} alt={org.name} />
                    ) : null}
                    <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{org.name}</h3>
                    {org.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{org.description}</p>
                    )}
                    {org.city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {org.city}, {org.country}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DonationsList({ donations }: { donations: DonationWithOrg[] }) {
  return (
    <div className="space-y-4">
      {donations.map((donation) => (
        <Card
          key={donation.id}
          className="hover-elevate"
          data-testid={`donation-card-${donation.id}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 rounded-md">
                {donation.organization_logo_url ? (
                  <AvatarImage
                    src={donation.organization_logo_url}
                    alt={donation.organization_name || 'Organización'}
                  />
                ) : null}
                <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                  <Building2 className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                      {donation.organization_name || 'Organización'}
                      {donation.short_id && (
                        <span className="font-mono text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                          #{donation.short_id}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {donation.campaign_title || 'Donación general'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {formatCurrency(donation.amount_minor / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground">{donation.currency}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(donation.created_at)}
                  </div>
                  {getStatusBadge(donation.status)}
                  {donation.is_recurring && (
                    <Badge variant="outline" className="text-xs">Recurrente</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingPage() {
  return (
    <DonorShell>
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    </DonorShell>
  );
}

export default function DonorDonations() {
  const { data: donationsResponse, isLoading } = useQuery<{ data?: DonationWithOrg[] }>({
    queryKey: ['/api/donor/donations'],
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  const donations = donationsResponse?.data || [];

  return (
    <DonorShell>
      <div className="space-y-6">
        <PageHeader
          title="Mis Donaciones"
          description="Historial completo de todas tus donaciones"
        />

        {donations.length === 0 ? (
          <OrgSearchView />
        ) : (
          <DonationsList donations={donations} />
        )}
      </div>
    </DonorShell>
  );
}
