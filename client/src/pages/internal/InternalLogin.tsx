import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { internalApi } from '@/lib/internalApi';
import juntosLogo from '@/assets/juntos-crecemos-logo.png';

export default function InternalLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && user) {
      internalApi.check().then((result) => {
        const resp = result as any;
        if (resp?.data?.data?.isInternalAdmin) {
          setLocation('/internal/dashboard');
        }
      });
    }
  }, [authLoading, user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } else {
        setLocation('/internal/dashboard');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Error al iniciar sesión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src={juntosLogo}
            alt="Juntos Crecemos"
            className="mx-auto h-16 w-16 object-contain mb-4"
            data-testid="img-internal-login-logo"
          />
          <CardTitle>Panel Interno</CardTitle>
          <CardDescription>Acceso restringido a administradores internos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
