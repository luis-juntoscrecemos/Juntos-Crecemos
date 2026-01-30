import { 
  Check, X, AlertCircle, Info, Heart, Megaphone, Building2, 
  Download, Plus, Search, Settings, Trash2, Edit, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { EmptyState } from '@/components/common/EmptyState';

const colorTokens = [
  { name: 'Primary (Verde)', variable: '--primary', class: 'bg-primary', textClass: 'text-primary-foreground' },
  { name: 'Accent (Oro)', variable: '--accent', class: 'bg-accent', textClass: 'text-accent-foreground' },
  { name: 'Secondary', variable: '--secondary', class: 'bg-secondary', textClass: 'text-secondary-foreground' },
  { name: 'Muted', variable: '--muted', class: 'bg-muted', textClass: 'text-muted-foreground' },
  { name: 'Destructive', variable: '--destructive', class: 'bg-destructive', textClass: 'text-destructive-foreground' },
  { name: 'Card', variable: '--card', class: 'bg-card border', textClass: 'text-card-foreground' },
  { name: 'Background', variable: '--background', class: 'bg-background border', textClass: 'text-foreground' },
  { name: 'Sidebar (Navy)', variable: '--sidebar', class: 'bg-sidebar', textClass: 'text-sidebar-foreground' },
];

const spacingExamples = [
  { size: '1', pixels: '4px', class: 'w-1 h-8' },
  { size: '2', pixels: '8px', class: 'w-2 h-8' },
  { size: '4', pixels: '16px', class: 'w-4 h-8' },
  { size: '6', pixels: '24px', class: 'w-6 h-8' },
  { size: '8', pixels: '32px', class: 'w-8 h-8' },
  { size: '12', pixels: '48px', class: 'w-12 h-8' },
  { size: '16', pixels: '64px', class: 'w-16 h-8' },
];

export default function StyleGuide() {
  const { toast } = useToast();

  const showToast = (variant: 'default' | 'destructive') => {
    toast({
      variant,
      title: variant === 'destructive' ? 'Error' : 'Éxito',
      description: variant === 'destructive' 
        ? 'Algo salió mal. Inténtalo de nuevo.' 
        : 'La operación se completó correctamente.',
    });
  };

  return (
    <div className="space-y-12">
      <PageHeader 
        title="Guía de Estilos" 
        description="Tokens de diseño, componentes y patrones para Juntos Crecemos"
      />

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="colors">Colores</TabsTrigger>
          <TabsTrigger value="typography">Tipografía</TabsTrigger>
          <TabsTrigger value="spacing">Espaciado</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Tokens de Color</h2>
            <p className="text-muted-foreground mb-6">
              Paleta de marca: Verde para acción principal, Navy para navegación, Oro para acentos.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {colorTokens.map((token) => (
                <Card key={token.name}>
                  <div className={`h-24 rounded-t-md ${token.class} flex items-center justify-center`}>
                    <span className={`text-sm font-medium ${token.textClass}`}>Aa</span>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{token.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{token.variable}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Colores de Estado</h2>
            <div className="flex flex-wrap gap-4">
              <Badge className="bg-success text-success-foreground">Completado</Badge>
              <Badge className="bg-warning text-warning-foreground">Pendiente</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge className="bg-primary text-primary-foreground">Información</Badge>
              <Badge variant="secondary">Inactivo</Badge>
              <Badge variant="outline">Borrador</Badge>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="typography" className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Escala Tipográfica</h2>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <span className="text-xs text-muted-foreground">text-4xl / 36px</span>
                  <p className="text-4xl font-bold">Título Principal</p>
                </div>
                <Separator />
                <div>
                  <span className="text-xs text-muted-foreground">text-2xl / 24px</span>
                  <p className="text-2xl font-bold">Título de Página</p>
                </div>
                <Separator />
                <div>
                  <span className="text-xs text-muted-foreground">text-xl / 20px</span>
                  <p className="text-xl font-semibold">Subtítulo</p>
                </div>
                <Separator />
                <div>
                  <span className="text-xs text-muted-foreground">text-lg / 18px</span>
                  <p className="text-lg">Texto Grande</p>
                </div>
                <Separator />
                <div>
                  <span className="text-xs text-muted-foreground">text-base / 16px</span>
                  <p className="text-base">Texto Base - Cuerpo principal</p>
                </div>
                <Separator />
                <div>
                  <span className="text-xs text-muted-foreground">text-sm / 14px</span>
                  <p className="text-sm">Texto Pequeño</p>
                </div>
                <Separator />
                <div>
                  <span className="text-xs text-muted-foreground">text-xs / 12px</span>
                  <p className="text-xs">Texto Extra Pequeño - Etiquetas</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Jerarquía de Texto</h2>
            <Card>
              <CardContent className="p-6 space-y-2">
                <p className="text-foreground">Texto primario - Mayor importancia</p>
                <p className="text-muted-foreground">Texto secundario - Información adicional</p>
                <p className="text-muted-foreground/60">Texto terciario - Menos relevante</p>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="spacing" className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Sistema de Espaciado (8px base)</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {spacingExamples.map((spacing) => (
                    <div key={spacing.size} className="flex items-center gap-4">
                      <div className={`${spacing.class} bg-primary rounded`} />
                      <span className="text-sm font-mono w-16">space-{spacing.size}</span>
                      <span className="text-sm text-muted-foreground">{spacing.pixels}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Border Radius</h2>
            <div className="flex flex-wrap gap-4">
              <div className="w-20 h-20 bg-primary rounded-sm flex items-center justify-center text-primary-foreground text-xs">sm</div>
              <div className="w-20 h-20 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs">md</div>
              <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xs">lg</div>
              <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-xs">xl</div>
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs">full</div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="components" className="space-y-12">
          <section>
            <h2 className="text-xl font-semibold mb-4">Botones</h2>
            <div className="flex flex-wrap gap-4">
              <Button>Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="outline">Contorno</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Eliminar</Button>
              <Button disabled>Deshabilitado</Button>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button size="sm">Pequeño</Button>
              <Button>Normal</Button>
              <Button size="lg">Grande</Button>
              <Button size="icon"><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button><Plus className="w-4 h-4 mr-2" /> Con Icono</Button>
              <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Exportar</Button>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Badges</h2>
            <div className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Inputs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="ejemplo@correo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Búsqueda</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="search" type="search" placeholder="Buscar..." className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disabled">Deshabilitado</Label>
                <Input id="disabled" placeholder="No editable" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="select">Seleccionar</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Opción 1</SelectItem>
                    <SelectItem value="2">Opción 2</SelectItem>
                    <SelectItem value="3">Opción 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="textarea">Descripción</Label>
                <Textarea id="textarea" placeholder="Escribe aquí..." />
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Switches y Checkboxes</h2>
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-2">
                <Switch id="switch" />
                <Label htmlFor="switch">Donación recurrente</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check" />
                <Label htmlFor="check">Acepto los términos</Label>
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Simple</CardTitle>
                  <CardDescription>Descripción corta del contenido</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Contenido de la tarjeta con información relevante.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle>Con Acciones</CardTitle>
                    <CardDescription>Tarjeta interactiva</CardDescription>
                  </div>
                  <Button size="icon" variant="ghost">
                    <Settings className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <Progress value={65} className="h-2" />
                  <p className="text-sm mt-2">65% completado</p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button size="sm" variant="outline">Cancelar</Button>
                  <Button size="sm">Guardar</Button>
                </CardFooter>
              </Card>

              <StatsCard 
                title="Total Donaciones"
                value="$12,450,000"
                icon={Heart}
                description="Este mes"
                trend={{ value: 12, isPositive: true }}
              />
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Alerts</h2>
            <div className="space-y-4 max-w-2xl">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>Este es un mensaje informativo para el usuario.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Algo salió mal. Por favor, inténtalo de nuevo.</AlertDescription>
              </Alert>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Toasts</h2>
            <div className="flex gap-4">
              <Button onClick={() => showToast('default')}>Toast de Éxito</Button>
              <Button variant="destructive" onClick={() => showToast('destructive')}>Toast de Error</Button>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Tabla</h2>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donante</TableHead>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">María García</TableCell>
                    <TableCell>Educación Rural</TableCell>
                    <TableCell>$500,000 COP</TableCell>
                    <TableCell><Badge className="bg-success text-success-foreground">Completada</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost"><Eye className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Carlos López</TableCell>
                    <TableCell>Alimentación</TableCell>
                    <TableCell>$1,000,000 COP</TableCell>
                    <TableCell><Badge className="bg-warning text-warning-foreground">Pendiente</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost"><Eye className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Empty State</h2>
            <Card>
              <EmptyState
                icon={Megaphone}
                title="No hay campañas"
                description="Crea tu primera campaña para comenzar a recibir donaciones"
                actionLabel="Crear Campaña"
                onAction={() => {}}
              />
            </Card>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
