import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLogo } from '@/components/common/AuthLogo';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Heart, Eye, EyeOff, Mail, User, Lock } from 'lucide-react';
import { donorApi } from '@/lib/donorApi';

const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function DonorRegister() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { signUp, signIn } = useAuth();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { error: signUpError } = await signUp(data.email, data.password);
      if (signUpError) {
        throw signUpError;
      }

      const { error: signInError } = await signIn(data.email, data.password);
      if (signInError) {
        throw signInError;
      }

      // Wait for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      const fullName = `${data.firstName} ${data.lastName}`.trim();
      return donorApi.register(fullName);
    },
    onSuccess: () => {
      toast({
        title: 'Cuenta creada exitosamente',
        description: 'Ahora puedes ver tu historial de donaciones.',
      });
      // Give time for auth state to fully propagate before redirect
      setTimeout(() => {
        setLocation('/donor');
      }, 300);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al registrarse',
        description: error.message || 'No se pudo crear la cuenta. Intenta nuevamente.',
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

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
              Registro de Donante
            </CardTitle>
            <CardDescription className="mt-2">
              Crea tu cuenta para ver tu historial de donaciones
            </CardDescription>
          </div>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Juan"
                            className="pl-10"
                            data-testid="input-first-name"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Pérez"
                          data-testid="input-last-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          className="pl-10"
                          data-testid="input-email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          data-testid="input-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 h-full w-10 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit"
                className="w-full" 
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Crear mi cuenta
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                ¿Ya tienes cuenta?{' '}
                <Link href="/donor/login" className="text-primary font-medium hover:underline" data-testid="link-donor-login">
                  Iniciar sesión
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
