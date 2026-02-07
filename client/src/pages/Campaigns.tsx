import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Megaphone, Edit, Trash2, Eye, ExternalLink, Copy, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingPage, LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { campaignsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/supabase';
import { insertCampaignSchema, type InsertCampaign, type CampaignWithTotals, type Organization } from '@shared/schema';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(campaign?.image_url || null);
  const [customAmountInput, setCustomAmountInput] = useState('');

  const PRESET_AMOUNT_OPTIONS = [10000, 25000, 50000, 100000, 200000, 500000];

  const form = useForm<InsertCampaign>({
    resolver: zodResolver(insertCampaignSchema),
    defaultValues: {
      title: campaign?.title || '',
      slug: campaign?.slug || '',
      description: campaign?.description || '',
      goal_amount: campaign?.goal_amount || undefined,
      currency: campaign?.currency || 'COP',
      is_active: campaign?.is_active ?? true,
      image_url: campaign?.image_url || null,
      suggested_amounts: campaign?.suggested_amounts || [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = await getAccessToken();
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
        body: formData,
      });
      return res.json();
    },
    onSuccess: (res) => {
      if (res.error) {
        toast({ variant: 'destructive', title: 'Error', description: res.error });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: 'Campaña creada', description: 'La campaña se creó correctamente' });
      onSuccess();
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la campaña' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = await getAccessToken();
      const res = await fetch(`/api/campaigns/${campaign!.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
        body: formData,
      });
      return res.json();
    },
    onSuccess: (res) => {
      if (res.error) {
        toast({ variant: 'destructive', title: 'Error', description: res.error });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: 'Campaña actualizada', description: 'Los cambios se guardaron correctamente' });
      onSuccess();
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los cambios' });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue('image_url', null);
  };

  const onSubmit = (data: InsertCampaign) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle array fields (like suggested_amounts)
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    if (imageFile) {
      formData.append('image', imageFile);
    } else if (imagePreview === null) {
      // Explicitly remove image
      formData.append('image_url', '');
    } else if (campaign?.image_url) {
      // Preserve existing image_url if no new file is selected and not explicitly removed
      formData.append('image_url', campaign.image_url);
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
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

        <div className="space-y-2">
          <FormLabel>Imagen de la campaña</FormLabel>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="campaign-image"
              />
              <div className="flex gap-2">
                <Label
                  htmlFor="campaign-image"
                  className="flex items-center gap-2 cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                </Label>
                {imagePreview && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={removeImage}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Quitar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Formatos recomendados: PNG, JPG o WebP. Máx 2MB.
              </p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="suggested_amounts"
          render={({ field }) => {
            const amounts = (field.value || []).sort((a, b) => a - b);

            const toggleAmount = (amount: number) => {
              if (amounts.includes(amount)) {
                field.onChange(amounts.filter(a => a !== amount));
              } else {
                field.onChange([...amounts, amount].sort((a, b) => a - b));
              }
            };

            const addCustomAmount = () => {
              const value = parseInt(customAmountInput.replace(/\D/g, ''));
              if (value && value > 0 && !amounts.includes(value)) {
                field.onChange([...amounts, value].sort((a, b) => a - b));
                setCustomAmountInput('');
              }
            };

            return (
              <FormItem>
                <FormLabel>Cantidades sugeridas</FormLabel>
                <FormDescription>
                  Montos predefinidos que los donantes podrán seleccionar
                </FormDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_AMOUNT_OPTIONS.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      size="sm"
                      variant={amounts.includes(amount) ? 'default' : 'outline'}
                      onClick={() => toggleAmount(amount)}
                      data-testid={`button-preset-amount-${amount}`}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
                {amounts.filter(a => !PRESET_AMOUNT_OPTIONS.includes(a)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {amounts.filter(a => !PRESET_AMOUNT_OPTIONS.includes(a)).map((amount) => (
                      <Badge key={amount} variant="secondary" className="gap-1" data-testid={`badge-custom-amount-${amount}`}>
                        {formatCurrency(amount)}
                        <button
                          type="button"
                          onClick={() => toggleAmount(amount)}
                          className="ml-0.5 text-muted-foreground"
                          aria-label={`Quitar ${formatCurrency(amount)}`}
                          data-testid={`button-remove-amount-${amount}`}
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Otro monto"
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomAmount();
                      }
                    }}
                    className="flex-1"
                    data-testid="input-custom-suggested-amount"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addCustomAmount}
                    disabled={!customAmountInput}
                    data-testid="button-add-custom-amount"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />

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
  orgSlug: string;
  onEdit: () => void;
  onDelete: () => void;
}

function CampaignCard({ campaign, orgSlug, onEdit, onDelete }: CampaignCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const progress = campaign.goal_amount 
    ? Math.min(100, (campaign.raised_minor / (campaign.goal_amount * 100)) * 100)
    : 0;

  const donateUrl = `/donar/${orgSlug}/${campaign.slug}`;

  const copyUrl = () => {
    const url = `${window.location.origin}${donateUrl}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: 'URL copiada',
      description: 'El enlace de donación ha sido copiado al portapapeles',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden">
      {campaign.image_url && (
        <div className="w-full h-48 overflow-hidden">
          <img 
            src={campaign.image_url} 
            alt={campaign.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
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
        <Button size="sm" variant="outline" asChild data-testid={`button-view-campaign-${campaign.id}`}>
          <a href={donateUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver página
          </a>
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} data-testid={`button-edit-campaign-${campaign.id}`}>
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
        <Button size="sm" variant="outline" onClick={copyUrl} data-testid={`button-copy-campaign-url-${campaign.id}`}>
          {copied ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
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

  const { data: orgResponse } = useQuery<{ data?: Organization }>({
    queryKey: ['/api/organizations/me'],
  });

  const orgSlug = orgResponse?.data?.slug || '';

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
              orgSlug={orgSlug}
              onEdit={() => openEditDialog(campaign)}
              onDelete={() => deleteMutation.mutate(campaign.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
