import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Globe, Mail, Phone, MapPin, Save, CheckCircle, Upload, ImageIcon } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage, LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { organizationsApi } from '@/lib/api';
import { insertOrganizationSchema, type InsertOrganization, type Organization } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';

export default function OrganizationPage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { data: orgResponse, isLoading } = useQuery<{ data: Organization }>({
    queryKey: ['/api/organizations/me'],
  });

  const organization = orgResponse?.data as Organization | undefined;

  const form = useForm<InsertOrganization>({
    resolver: zodResolver(insertOrganizationSchema),
    defaultValues: {
      name: organization?.name || '',
      email: organization?.email || '',
      phone: organization?.phone || '',
      website: organization?.website || '',
      description: organization?.description || '',
      country: organization?.country || '',
      city: organization?.city || '',
      slug: organization?.slug || '',
    },
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Archivo muy grande',
          description: 'El logo debe ser menor a 5MB',
        });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertOrganization>) => 
      organizationsApi.updateWithLogo(organization?.id || '', data, logoFile || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/me'] });
      toast({
        title: 'Organización actualizada',
        description: 'Los cambios se guardaron correctamente',
      });
      setIsEditing(false);
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
      });
    },
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!organization) {
    return (
      <div className="space-y-8">
        <PageHeader 
          title="Organización" 
          description="Configura el perfil de tu ONG"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin organización</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Tu cuenta no está asociada a ninguna organización. Contacta al administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = (data: InsertOrganization) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Organización" 
        description="Información y configuración de tu ONG"
        actions={
          !isEditing ? (
            <Button onClick={() => setIsEditing(true)} data-testid="button-edit-org">
              Editar información
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {isEditing ? (
                      <div 
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer overflow-hidden"
                        onClick={() => logoInputRef.current?.click()}
                        data-testid="button-upload-logo"
                      >
                        {logoPreview || organization.logo_url ? (
                          <img 
                            src={logoPreview || organization.logo_url || ''} 
                            alt="Logo" 
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Logo</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoSelect}
                          className="hidden"
                          data-testid="input-logo-file"
                        />
                      </div>
                    ) : (
                      <Avatar className="w-16 h-16 rounded-xl">
                        {organization.logo_url ? (
                          <AvatarImage src={organization.logo_url} alt={organization.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-bold text-2xl">
                          {organization.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div>
                    <CardTitle>{organization.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3" />
                      {organization.city}, {organization.country}
                    </CardDescription>
                    {isEditing && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Haz clic en el logo para cambiarlo
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {organization.verified ? (
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificada
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
                  <Badge variant="outline">{organization.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de la organización</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-org-name" />
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
                              <Input {...field} data-testid="input-org-slug" />
                            </FormControl>
                            <FormDescription>
                              Se usará en: /donar/{field.value}/campaña
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                              className="min-h-[100px]"
                              data-testid="input-org-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo electrónico</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-org-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} data-testid="input-org-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-org-country" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ciudad</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-org-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sitio web</FormLabel>
                          <FormControl>
                            <Input 
                              type="url" 
                              placeholder="https://www.tuong.org" 
                              {...field} 
                              value={field.value || ''}
                              data-testid="input-org-website"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setLogoFile(null); setLogoPreview(null); }}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-org">
                        {updateMutation.isPending ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar cambios
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  {organization.description && (
                    <p className="text-muted-foreground">{organization.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{organization.email}</span>
                    </div>
                    {organization.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{organization.phone}</span>
                      </div>
                    )}
                    {organization.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={organization.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {organization.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enlace público</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-md">
                <code className="text-sm break-all">
                  /donar/{organization.slug}
                </code>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Comparte este enlace para recibir donaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado de la cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verificación</span>
                <Badge variant={organization.verified ? 'default' : 'secondary'}>
                  {organization.verified ? 'Verificada' : 'Pendiente'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant="outline">{organization.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Creada</span>
                <span className="text-sm">
                  {new Date(organization.created_at).toLocaleDateString('es-CO')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
