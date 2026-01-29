import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Configuración" 
        description="Administra las preferencias de tu cuenta"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Notificaciones</CardTitle>
                <CardDescription>Configura cómo quieres recibir alertas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-donations">Notificaciones por email</Label>
                <p className="text-sm text-muted-foreground">Recibe un email por cada donación</p>
              </div>
              <Switch id="email-donations" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-weekly">Resumen semanal</Label>
                <p className="text-sm text-muted-foreground">Recibe un resumen cada semana</p>
              </div>
              <Switch id="email-weekly" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Preferencias regionales</CardTitle>
                <CardDescription>Idioma y formato de moneda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Idioma</Label>
                <p className="text-sm text-muted-foreground">Español (Colombia)</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Cambiar
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Moneda predeterminada</Label>
                <p className="text-sm text-muted-foreground">Peso Colombiano (COP)</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Cambiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Seguridad</CardTitle>
                <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Cambiar contraseña</Label>
                <p className="text-sm text-muted-foreground">Actualiza tu contraseña de acceso</p>
              </div>
              <Button variant="outline" size="sm">
                Actualizar
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Autenticación de dos factores</Label>
                <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Zona de peligro</CardTitle>
            <CardDescription>Acciones irreversibles para tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Eliminar cuenta</Label>
                <p className="text-sm text-muted-foreground">
                  Elimina permanentemente tu cuenta y todos los datos
                </p>
              </div>
              <Button variant="destructive" size="sm" disabled>
                Eliminar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
