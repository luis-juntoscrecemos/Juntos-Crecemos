import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { DonorShell } from '@/components/layout/DonorShell';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { Star, Heart, Building2, ExternalLink, Trash2 } from 'lucide-react';
import { donorApi } from '@/lib/donorApi';
import type { Favorite } from '@shared/schema';

type FavoriteWithOrg = Favorite & { 
  organizations: { 
    id: string; 
    name: string; 
    logo_url: string | null; 
    slug: string; 
    description: string | null;
  } 
};

function LoadingPage() {
  return (
    <DonorShell>
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    </DonorShell>
  );
}

export default function DonorFavorites() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: favoritesResponse, isLoading } = useQuery<{ data?: FavoriteWithOrg[] }>({
    queryKey: ['/api/donor/favorites'],
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (organizationId: string) => donorApi.removeFavorite(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/donor/favorites'] });
      toast({
        title: 'Favorito eliminado',
        description: 'La organización ha sido removida de tus favoritos.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el favorito. Intenta de nuevo.',
      });
    },
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  const favorites = favoritesResponse?.data || [];

  return (
    <DonorShell>
      <div className="space-y-6">
        <PageHeader 
          title="Mis Favoritos" 
          description="Organizaciones que has marcado como favoritas"
        />

        {favorites.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No tienes favoritos aún"
            description="Marca organizaciones como favoritas para encontrarlas fácilmente."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => {
              const org = favorite.organizations;
              return (
                <Card 
                  key={`${favorite.donor_account_id}-${favorite.organization_id}`}
                  className="hover-elevate"
                  data-testid={`favorite-card-${org.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 rounded-md">
                        {org.logo_url ? (
                          <AvatarImage src={org.logo_url} alt={org.name} />
                        ) : null}
                        <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                          <Building2 className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{org.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {org.description || 'Sin descripción'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/donate/${org.slug}`}>
                          <Heart className="h-4 w-4 mr-1" />
                          Donar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFavoriteMutation.mutate(org.id)}
                        disabled={removeFavoriteMutation.isPending}
                        data-testid={`remove-favorite-${org.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DonorShell>
  );
}
