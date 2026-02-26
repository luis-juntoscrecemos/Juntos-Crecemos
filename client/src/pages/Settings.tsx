import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Shield, Globe, Sun, Moon, Monitor, Paintbrush, Check, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Organization } from '@shared/schema';

type AccentPalette = "classic" | "ocean" | "andes" | "warm";

const palettes: { id: AccentPalette; name: string; description: string; primaryHsl: string; accentHsl: string }[] = [
  {
    id: "classic",
    name: "Juntos Cl\u00e1sico",
    description: "Verde institucional con acentos dorados",
    primaryHsl: "142 76% 36%",
    accentHsl: "45 100% 48%",
  },
  {
    id: "ocean",
    name: "Oc\u00e9ano Confianza",
    description: "Teal profesional que transmite confianza",
    primaryHsl: "174 84% 32%",
    accentHsl: "45 100% 48%",
  },
  {
    id: "andes",
    name: "Andes Profesional",
    description: "Azul corporativo con verde complementario",
    primaryHsl: "224 76% 48%",
    accentHsl: "142 76% 36%",
  },
  {
    id: "warm",
    name: "Calidez Humana",
    description: "Verde c\u00e1lido con acentos naranjas",
    primaryHsl: "142 76% 36%",
    accentHsl: "24 94% 53%",
  },
];

const modeOptions = [
  { value: "light" as const, label: "Claro", icon: Sun },
  { value: "dark" as const, label: "Oscuro", icon: Moon },
  { value: "system" as const, label: "Sistema", icon: Monitor },
];

export default function SettingsPage() {
  const { mode, setMode, accent, setAccent } = useTheme();
  const { toast } = useToast();

  const { data: orgResponse } = useQuery<{ data?: Organization }>({
    queryKey: ['/api/organizations/me'],
  });

  const organization = orgResponse?.data;

  const accentMutation = useMutation({
    mutationFn: async (newAccent: AccentPalette) => {
      if (!organization?.id) throw new Error("Organizaci\u00f3n no encontrada");
      await apiRequest("PATCH", `/api/organizations/${organization.id}`, { accent_theme: newAccent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/me'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la paleta de colores",
        variant: "destructive",
      });
    },
  });

  const handleAccentChange = (newAccent: AccentPalette) => {
    setAccent(newAccent);
    accentMutation.mutate(newAccent);
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Configuraci\u00f3n" 
        description="Administra las preferencias de tu cuenta"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Paintbrush className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Apariencia</CardTitle>
                <CardDescription>Personaliza el tema y los colores de tu panel</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-3 block">Modo de tema</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {modeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={mode === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode(option.value)}
                    data-testid={`button-mode-${option.value}`}
                    className="toggle-elevate"
                  >
                    <option.icon className="w-4 h-4 mr-2" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Label>Paleta de colores</Label>
                {accentMutation.isPending && (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" data-testid="status-saving-palette" />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {palettes.map((palette) => {
                  const isSelected = accent === palette.id;
                  return (
                    <button
                      key={palette.id}
                      onClick={() => handleAccentChange(palette.id)}
                      data-testid={`button-palette-${palette.id}`}
                      className={`relative flex items-start gap-3 p-3 rounded-md border text-left transition-colors ${
                        isSelected
                          ? "border-primary ring-1 ring-primary"
                          : "border-border hover-elevate"
                      }`}
                    >
                      <div className="flex gap-1.5 mt-0.5 shrink-0">
                        <span
                          className="block w-5 h-5 rounded-full border border-border/50"
                          style={{ backgroundColor: `hsl(${palette.primaryHsl})` }}
                          data-testid={`swatch-primary-${palette.id}`}
                        />
                        <span
                          className="block w-5 h-5 rounded-full border border-border/50"
                          style={{ backgroundColor: `hsl(${palette.accentHsl})` }}
                          data-testid={`swatch-accent-${palette.id}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium block" data-testid={`text-palette-name-${palette.id}`}>
                          {palette.name}
                        </span>
                        <span className="text-xs text-muted-foreground block" data-testid={`text-palette-desc-${palette.id}`}>
                          {palette.description}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" data-testid={`icon-selected-${palette.id}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

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
