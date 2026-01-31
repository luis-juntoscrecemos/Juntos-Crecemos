import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLogo } from '@/components/common/AuthLogo';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Heart, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { donorApi } from '@/lib/donorApi';

export default function NoDonorProfile() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');

  const registerMutation = useMutation({
    mutationFn: (name?: string) => donorApi.register(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/donor/check'] });
      toast({
        title: 'Cuenta de donante creada',
        description: 'Puedes vincular tus donaciones anteriores desde la configuración.',
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
              Crea tu cuenta para ver tu historial de donaciones
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Estás registrado con el correo: <strong>{user?.email}</strong>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo (opcional)</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              data-testid="input-full-name"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            className="w-full"
            disabled={registerMutation.isPending}
            onClick={() => registerMutation.mutate(fullName || undefined)}
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
          
          <Button 
            variant="ghost" 
            onClick={() => signOut()}
            className="w-full"
          >
            Cerrar Sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
