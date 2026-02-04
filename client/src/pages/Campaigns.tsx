import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Megaphone, Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingPage, LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { campaignsApi } from '@/lib/api';
import { insertCampaignSchema, type InsertCampaign, type CampaignWithTotals } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';

function formatCurrency(amount: number, currency: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CampaignFormProps {
  campaign?: CampaignWithTotals;
  onSuccess: () => void;
  onCancel: () => void;
}

function CampaignForm({ campaign, onSuccess, onCancel }: CampaignFormProps) {
  const { toast } = useToast();
  const isEditing = !!campaign;

  const form = useForm<InsertCampaign>({
    resolver: zodResolver(insertCampaignSchema),
    defaultValues: {
      title: campaign?.title || '',
      slug: campaign?.slug || '',
      description: campaign?.description || '',
      goal_amount: campaign?.goal_amount || undefined,
      currency: campaign?.currency || 'COP',
      is_active: campaign?.is_active ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: campaignsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: 'Campaña creada', description: 'La campaña se creó correctamente' });
      onSuccess();
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la campaña' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertCampaign>) => campaignsApi.update(campaign!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: 'Campaña actualizada', description: 'Los cambios se guardaron correctamente' });
      onSuccess();
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los cambios' });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: InsertCampaign) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const generateSlug = () => {
    const title = form.getValues('title');
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    form.setValue('slug', slug);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la campaña</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Ej: Alimentación para niños" 
                  onBlur={() => {
                    if (!form.getValues('slug')) generateSlug();
                  }}
                  data-testid="input-campaign-title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="alimentacion-ninos" data-testid="input-campaign-slug" />
              </FormControl>
              <FormDescription>
                Se usará en la URL de donación
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ''} 
                  placeholder="Describe el propósito de esta campaña..."
                  className="min-h-[100px]"
                  data-testid="input-campaign-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="goal_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta de recaudación</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="1000000"
                    data-testid="input-campaign-goal"
                  />
                </FormControl>
                <FormDescription>En pesos colombianos (COP)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Estado</FormLabel>
                <div className="flex items-center gap-2 pt-2">
                  <FormControl>
                    <Switch 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      data-testid="switch-campaign-active"
                    />
                  </FormControl>
                  <span className="text-sm">
                    {field.value ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-campaign">
            {isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {isEditing ? 'Guardando...' : 'Creando...'}
              </>
            ) : (
              isEditing ? 'Guardar cambios' : 'Crear campaña'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

interface CampaignCardProps {
  campaign: CampaignWithTotals;
  onEdit: () => void;
  onDelete: () => void;
}

function CampaignCard({ campaign, onEdit, onDelete }: CampaignCardProps) {
  const progress = campaign.goal_amount 
    ? Math.min(100, (campaign.raised_minor / (campaign.goal_amount * 100)) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg">{campaign.title}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/{campaign.slug}</code>
          </CardDescription>
        </div>
        <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
          {campaign.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">
              {formatCurrency(campaign.raised_minor / 100)} 
              {campaign.goal_amount && ` de ${formatCurrency(campaign.goal_amount)}`}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{campaign.donations_count} donaciones</span>
          <span>{campaign.currency}</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" variant="outline" asChild>
          <a href={`/donar/${campaign.slug}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver página
          </a>
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} data-testid={`button-edit-campaign-${campaign.id}`}>
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" data-testid={`button-delete-campaign-${campaign.id}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará la campaña "{campaign.title}" permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

export default function CampaignsPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithTotals | undefined>();

  const { data: campaignsResponse, isLoading, error } = useQuery<{ data: CampaignWithTotals[] }>({
    queryKey: ['/api/campaigns'],
  });

  const deleteMutation = useMutation({
    mutationFn: campaignsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: 'Campaña eliminada', description: 'La campaña se eliminó correctamente' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la campaña' });
    },
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    toast({ 
      variant: 'destructive', 
      title: 'Error', 
      description: 'No se pudieron cargar las campañas. Por favor intenta de nuevo.' 
    });
  }

  const campaigns = campaignsResponse?.data || [];

  const openCreateDialog = () => {
    setEditingCampaign(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (campaign: CampaignWithTotals) => {
    setEditingCampaign(campaign);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCampaign(undefined);
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Campañas" 
        description="Gestiona tus campañas de recaudación"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-create-campaign">
                <Plus className="w-4 h-4 mr-2" />
                Nueva campaña
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCampaign ? 'Editar campaña' : 'Nueva campaña'}
                </DialogTitle>
                <DialogDescription>
                  {editingCampaign 
                    ? 'Modifica los detalles de tu campaña'
                    : 'Crea una nueva campaña para recibir donaciones'}
                </DialogDescription>
              </DialogHeader>
              <CampaignForm 
                campaign={editingCampaign}
                onSuccess={closeDialog}
                onCancel={closeDialog}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No hay campañas"
          description="Crea tu primera campaña para comenzar a recibir donaciones"
          actionLabel="Crear campaña"
          onAction={openCreateDialog}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={() => openEditDialog(campaign)}
              onDelete={() => deleteMutation.mutate(campaign.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
