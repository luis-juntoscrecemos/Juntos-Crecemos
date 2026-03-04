import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Shield, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { internalApi } from '@/lib/internalApi';
import { useAuth } from '@/contexts/AuthContext';
import logoPath from '@/assets/juntos-crecemos-logo.png';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  VIEWER: 'Visualizador',
};

export default function AcceptInvite() {
  const [, setLocation] = useLocation();
  const { user, signUp, signIn } = useAuth();
  const [status, setStatus] = useState<'loading' | 'setup' | 'processing' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');

    if (!t) {
      setStatus('error');
      setMessage('Token de invitación no encontrado');
      return;
    }

    setToken(t);

    internalApi.verifyInvite(t).then((result) => {
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else if (result.data) {
        setInviteEmail(result.data.email);
        setInviteRole(result.data.role);

        if (user && user.email === result.data.email) {
          acceptInviteDirectly(t);
        } else {
          setStatus('setup');
        }
      }
    });
  }, []);

  useEffect(() => {
    if (user && token && inviteEmail && user.email === inviteEmail && status === 'setup') {
      acceptInviteDirectly(token);
    }
  }, [user, token, inviteEmail, status]);

  const acceptInviteDirectly = async (inviteToken: string) => {
    setStatus('processing');
    const result = await internalApi.acceptInvite(inviteToken);
    if (result.error) {
      setStatus('error');
      setMessage(result.error);
    } else {
      setStatus('success');
      setMessage('Tu cuenta ha sido configurada. Ya tienes acceso al panel interno.');
    }
  };

  const handleSetupAccount = async () => {
    setPasswordError('');

    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setStatus('processing');

    const { error: signUpError } = await signUp(inviteEmail, password);
    if (signUpError) {
      if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
        const { error: signInError } = await signIn(inviteEmail, password);
        if (signInError) {
          setStatus('setup');
          setPasswordError('Ya existe una cuenta con este correo. Si ya tienes cuenta, inicia sesión y vuelve a abrir el enlace de invitación.');
          return;
        }
      } else {
        setStatus('setup');
        setPasswordError(signUpError.message || 'Error al crear la cuenta');
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = await internalApi.acceptInvite(token);
    if (result.error) {
      setStatus('error');
      setMessage(result.error);
    } else {
      setStatus('success');
      setMessage('Tu cuenta ha sido configurada. Ya tienes acceso al panel interno.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="Juntos Crecemos" className="h-10" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Invitación al Panel Interno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <p className="text-center text-muted-foreground" data-testid="text-loading">Verificando invitación...</p>
          )}

          {status === 'setup' && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Correo</span>
                  <span className="text-sm font-medium" data-testid="text-invite-email">{inviteEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rol</span>
                  <Badge variant="secondary" data-testid="text-invite-role">
                    {ROLE_LABELS[inviteRole] || inviteRole}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Configura una contraseña para acceder al panel interno.
              </p>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    data-testid="input-confirm-password"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 dark:text-red-400" data-testid="text-password-error">{passwordError}</p>
                )}
              </div>

              <Button
                onClick={handleSetupAccount}
                className="w-full"
                disabled={!password || !confirmPassword}
                data-testid="button-setup-account"
              >
                Configurar Cuenta
              </Button>
            </div>
          )}

          {status === 'processing' && (
            <p className="text-center text-muted-foreground" data-testid="text-processing">Configurando tu cuenta...</p>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-green-600 dark:text-green-400" data-testid="text-success">{message}</p>
              <Button onClick={() => setLocation('/internal/dashboard')} data-testid="button-go-dashboard">
                Ir al Panel
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-600 dark:text-red-400" data-testid="text-error">{message}</p>
              <Button variant="outline" onClick={() => setLocation('/internal/login')} data-testid="button-go-login">
                Ir al Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
