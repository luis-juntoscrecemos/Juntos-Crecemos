import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLogo } from '@/components/common/AuthLogo';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Eye, EyeOff, Heart, UserPlus } from 'lucide-react';
import { donorApi } from '@/lib/donorApi';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function DonorLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { toast } = useToast();
  const { signIn, user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Check if logged-in user needs to create donor account
  const { data: checkResponse, isLoading: checkLoading } = useQuery<{ data?: { isDonor: boolean } }>({
    queryKey: ['/api/donor/check'],
    queryFn: () => donorApi.checkAccount(),
    enabled: !!user,
  });

  // Show registration form if logged in but no donor account
  useEffect(() => {
    if (user && checkResponse?.data && !checkResponse.data.isDonor) {
      setShowRegister(true);
    } else if (user && checkResponse?.data?.isDonor) {
      setLocation('/donor');
    }
  }, [user, checkResponse, setLocation]);

  const registerMutation = useMutation({
    mutationFn: (fullName?: string) => donorApi.register(fullName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/donor/check'] });
      toast({
        title: 'Cuenta de donante creada!',
        duration: 5000,
      });
      setLocation('/donor');
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear la cuenta de donante.',
      });
    },
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      // The useEffect above will handle redirect or show register form
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: error.message || 'Credenciales inválidas',
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting || authLoading;

  // Show donor account registration form after login
  if (showRegister && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <AuthLogo />
            </div>
            <div>
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Crear cuenta de donante
              </CardTitle>
              <CardDescription className="mt-2">
                Vincula tus donaciones anteriores a tu cuenta
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Al crear tu cuenta de donante, vincularemos automáticamente todas las donaciones
                que realizaste con el correo: <strong>{user.email}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo (opcional)</Label>
              <Input
                id="fullName"
                placeholder="Tu nombre"
                data-testid="input-full-name"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              className="w-full" 
              disabled={registerMutation.isPending}
              onClick={() => {
                const fullName = (document.getElementById('fullName') as HTMLInputElement)?.value;
                registerMutation.mutate(fullName || undefined);
              }}
              data-testid="button-create-donor"
            >
              {registerMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Crear mi cuenta de donante
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show loading while checking donor status
  if (user && checkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <AuthLogo />
          </div>
          <div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Portal de Donantes
            </CardTitle>
            <CardDescription className="mt-2">
              Ingresa a tu cuenta para ver tu historial de donaciones
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                {...form.register('email')}
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                  {...form.register('password')}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 h-full w-10 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              data-testid="button-login"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              ¿No tienes cuenta?{' '}
              <Link href="/donor/register" className="text-primary font-medium hover:underline" data-testid="link-donor-register">
                Regístrate aquí
              </Link>
            </p>

            <div className="text-center text-sm border-t pt-4 w-full">
              <span className="text-muted-foreground">¿Eres una ONG? </span>
              <Link href="/login" className="text-primary hover:underline">
                Ingresa aquí
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
