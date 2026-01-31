import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DonorShell } from '@/components/layout/DonorShell';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Save, User, Mail, Shield } from 'lucide-react';
import { donorApi } from '@/lib/donorApi';
import type { DonorAccount } from '@shared/schema';

const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function LoadingPage() {
  return (
    <DonorShell>
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    </DonorShell>
  );
}

export default function DonorSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileResponse, isLoading } = useQuery<{ data?: DonorAccount }>({
    queryKey: ['/api/donor/profile'],
  });

  const profile = profileResponse?.data;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
    },
    values: {
      full_name: profile?.full_name || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => donorApi.updateProfile(data.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/donor/profile'] });
      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos han sido guardados correctamente.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el perfil. Intenta de nuevo.',
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <DonorShell>
      <div className="space-y-6">
        <PageHeader 
          title="Configuración" 
          description="Administra tu perfil y preferencias"
        />

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Actualiza tu nombre y datos de contacto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    {...form.register('full_name')}
                    placeholder="Tu nombre completo"
                    data-testid="input-full-name"
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Cambios
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Correo Electrónico
              </CardTitle>
              <CardDescription>
                Tu correo electrónico de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email || profile?.email || ''}
                  disabled
                  className="bg-muted"
                  data-testid="input-email-readonly"
                />
                <p className="text-xs text-muted-foreground">
                  El correo electrónico no se puede cambiar ya que está vinculado a tu cuenta.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Información de seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Estado de la cuenta</span>
                  <span className="text-sm font-medium text-success">Activa</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Email verificado</span>
                  <span className="text-sm font-medium text-success">
                    {profile?.email_verified ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Fecha de registro</span>
                  <span className="text-sm text-muted-foreground">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('es-CO')
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DonorShell>
  );
}
