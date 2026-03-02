import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { internalApi } from '@/lib/internalApi';
import { useAuth } from '@/contexts/AuthContext';

export default function AcceptInvite() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token de invitación no encontrado');
      return;
    }

    if (!user) {
      setStatus('error');
      setMessage('Debes iniciar sesión primero para aceptar la invitación');
      return;
    }

    internalApi.acceptInvite(token).then((result) => {
      if (result.error) {
        setStatus('error');
        setMessage(result.error as string);
      } else {
        setStatus('success');
        setMessage('Invitación aceptada. Ya tienes acceso al panel interno.');
      }
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <CardTitle>Invitación al Panel Interno</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <p className="text-muted-foreground">Procesando invitación...</p>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-green-600 dark:text-green-400">{message}</p>
              <Button onClick={() => setLocation('/internal/dashboard')} data-testid="button-go-dashboard">
                Ir al Panel
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-600 dark:text-red-400">{message}</p>
              {!user && (
                <Button onClick={() => setLocation('/internal/login')} data-testid="button-go-login">
                  Iniciar Sesión
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
