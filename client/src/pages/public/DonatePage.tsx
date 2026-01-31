import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Shield, CheckCircle, Building2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LoadingPage, LoadingSpinner } from '@/components/common/LoadingSpinner';
import { publicApi } from '@/lib/api';
import type { CampaignWithTotals, Organization } from '@shared/schema';

const donationSchema = z.object({
  donor_name: z.string().min(2, 'Ingresa tu nombre').optional(),
  donor_email: z.string().email('Correo inválido').optional(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  is_recurring: z.boolean().default(false),
  is_anonymous: z.boolean().default(false),
});

type DonationFormData = z.infer<typeof donationSchema>;

function formatCurrency(amount: number, currency: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface DonationFormProps {
  campaign: CampaignWithTotals;
  organization: Organization;
  onSuccess: (email?: string) => void;
}

function DonationForm({ campaign, organization, onSuccess }: DonationFormProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const suggestedAmounts = campaign.suggested_amounts || [100000, 500000, 1000000];

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      donor_name: '',
      donor_email: '',
      amount: 0,
      is_recurring: false,
      is_anonymous: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: DonationFormData) => 
      publicApi.createDonation({
        campaign_id: campaign.id,
        org_id: organization.id,
        donor_name: data.is_anonymous ? null : data.donor_name || null,
        donor_email: data.donor_email || null,
        amount_minor: data.amount * 100,
        currency: campaign.currency,
        is_recurring: data.is_recurring,
        is_anonymous: data.is_anonymous,
      }),
    onSuccess: (_, variables) => {
      onSuccess(variables.donor_email || undefined);
    },
  });

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    form.setValue('amount', amount);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    const numValue = parseInt(value) || 0;
    form.setValue('amount', numValue);
  };

  const onSubmit = (data: DonationFormData) => {
    createMutation.mutate(data);
  };

  const isAnonymous = form.watch('is_anonymous');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Selecciona un monto</label>
          <div className="grid grid-cols-3 gap-2">
            {suggestedAmounts.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant={selectedAmount === amount ? 'default' : 'outline'}
                className="h-auto py-3"
                onClick={() => handleAmountSelect(amount)}
                data-testid={`button-amount-${amount}`}
              >
                {formatCurrency(amount, campaign.currency)}
              </Button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              placeholder="Otro monto"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              className="pl-7"
              data-testid="input-custom-amount"
            />
          </div>
          {form.formState.errors.amount && (
            <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium">Donación mensual</label>
                <p className="text-xs text-muted-foreground">Contribuir cada mes</p>
              </div>
            </div>
            <FormField
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <Switch 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                  data-testid="switch-recurring"
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium">Donación anónima</label>
                <p className="text-xs text-muted-foreground">Ocultar mi nombre</p>
              </div>
            </div>
            <FormField
              control={form.control}
              name="is_anonymous"
              render={({ field }) => (
                <Switch 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                  data-testid="switch-anonymous"
                />
              )}
            />
          </div>
        </div>

        <Separator />

        {!isAnonymous && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="donor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tu nombre</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Juan Pérez" 
                      data-testid="input-donor-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="donor_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email" 
                  placeholder="tu@email.com" 
                  data-testid="input-donor-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={createMutation.isPending || !form.watch('amount')}
          data-testid="button-donate"
        >
          {createMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Procesando...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 mr-2" />
              Donar {form.watch('amount') > 0 && formatCurrency(form.watch('amount'), campaign.currency)}
            </>
          )}
        </Button>

        {createMutation.isError && (
          <p className="text-sm text-destructive text-center">
            Error al procesar la donación. Por favor, intenta de nuevo.
          </p>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>Transacción segura y encriptada</span>
        </div>
      </form>
    </Form>
  );
}

function SuccessScreen({ 
  campaign, 
  organization, 
  donorEmail 
}: { 
  campaign: CampaignWithTotals; 
  organization: Organization;
  donorEmail?: string;
}) {
  return (
    <div className="text-center py-8 space-y-6">
      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-success">¡Gracias por tu donación!</h2>
        <p className="text-muted-foreground mt-2">
          Tu contribución a "{campaign.title}" ayuda a {organization.name} a continuar su misión.
        </p>
      </div>
      <div className="bg-muted rounded-lg p-4 max-w-sm mx-auto">
        <p className="text-sm text-muted-foreground">
          Recibirás un correo de confirmación con los detalles de tu donación.
        </p>
      </div>
      
      <Separator className="my-4" />
      
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 max-w-sm mx-auto">
        <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="font-semibold text-sm">Crea tu cuenta de donante</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Accede a tu historial de donaciones y organizaciones favoritas
        </p>
        <Button 
          asChild 
          className="w-full"
          data-testid="button-create-donor-account"
        >
          <a href={`/donor/login${donorEmail ? `?email=${encodeURIComponent(donorEmail)}` : ''}`}>
            <Heart className="w-4 h-4 mr-2" />
            Ver mi historial de donaciones
          </a>
        </Button>
      </div>
      
      <Button 
        variant="outline" 
        onClick={() => window.location.reload()}
        data-testid="button-donate-again"
      >
        Hacer otra donación
      </Button>
    </div>
  );
}

export default function DonatePage() {
  const [, params] = useRoute('/donar/:orgSlug/:campaignSlug');
  const [showSuccess, setShowSuccess] = useState(false);
  const [donorEmail, setDonorEmail] = useState<string | undefined>();

  const orgSlug = params?.orgSlug || '';
  const campaignSlug = params?.campaignSlug || '';

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['/api/public/campaigns', orgSlug, campaignSlug],
    queryFn: () => publicApi.getCampaign(orgSlug, campaignSlug),
    enabled: !!orgSlug && !!campaignSlug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingPage />
      </div>
    );
  }

  if (error || !response?.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Campaña no encontrada</h2>
            <p className="text-muted-foreground">
              La campaña que buscas no existe o ya no está disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { campaign, organization } = response.data;
  const progress = campaign.goal_amount 
    ? Math.min(100, (campaign.raised_minor / (campaign.goal_amount * 100)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">
                {organization.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">{organization.name}</p>
              {organization.verified && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verificada
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{campaign.title}</h1>
              {campaign.description && (
                <p className="text-muted-foreground mt-3">{campaign.description}</p>
              )}
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(campaign.raised_minor / 100, campaign.currency)}
                    </p>
                    {campaign.goal_amount && (
                      <p className="text-sm text-muted-foreground">
                        recaudados de {formatCurrency(campaign.goal_amount, campaign.currency)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{campaign.donations_count}</p>
                    <p className="text-sm text-muted-foreground">donantes</p>
                  </div>
                </div>
                {campaign.goal_amount && (
                  <Progress value={progress} className="h-3" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">Sobre {organization.name}</CardTitle>
                    <CardDescription>
                      {organization.city}, {organization.country}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {organization.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{organization.description}</p>
                </CardContent>
              )}
            </Card>
          </div>

          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Haz tu donación
                </CardTitle>
                <CardDescription>
                  Tu apoyo hace la diferencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showSuccess ? (
                  <SuccessScreen campaign={campaign} organization={organization} donorEmail={donorEmail} />
                ) : (
                  <DonationForm 
                    campaign={campaign} 
                    organization={organization}
                    onSuccess={(email) => {
                      setDonorEmail(email);
                      setShowSuccess(true);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Desarrollado por <span className="font-semibold text-primary">Juntos Crecemos</span>
          </p>
          <p className="mt-1">
            Plataforma segura para donaciones a ONGs en América del Sur
          </p>
        </div>
      </footer>
    </div>
  );
}
