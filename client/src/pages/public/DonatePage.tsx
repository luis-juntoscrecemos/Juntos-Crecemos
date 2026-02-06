import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Shield, CheckCircle, Building2, RefreshCw, MessageSquare, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingPage, LoadingSpinner } from '@/components/common/LoadingSpinner';
import { publicApi } from '@/lib/api';
import { insertDonationIntentSchema } from '@shared/schema';
import type { CampaignWithTotals, Organization } from '@shared/schema';

const MIN_AMOUNT = 5000;

const donationIntentFormSchema = insertDonationIntentSchema
  .omit({ campaign_slug: true, org_slug: true })
  .extend({
    donor_first_name: z.string().default(''),
    donor_last_name: z.string().default(''),
    terms_accepted: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.is_anonymous) {
      if (!data.donor_first_name || data.donor_first_name.trim().length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nombre requerido', path: ['donor_first_name'] });
      }
      if (!data.donor_last_name || data.donor_last_name.trim().length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Apellido requerido', path: ['donor_last_name'] });
      }
    }
  });

type DonationIntentFormData = z.infer<typeof donationIntentFormSchema>;

function formatCurrency(amount: number, currency: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const CADENCE_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  semiannual: 'Semestral',
  yearly: 'Anual',
};

interface DonationFormProps {
  campaign: CampaignWithTotals;
  organization: Organization;
  feePercent: number;
  orgSlug: string;
}

function DonationForm({ campaign, organization, feePercent, orgSlug }: DonationFormProps) {
  const [, navigate] = useLocation();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const suggestedAmounts: number[] = campaign.suggested_amounts || [];

  const form = useForm<DonationIntentFormData>({
    resolver: zodResolver(donationIntentFormSchema),
    defaultValues: {
      amount: 0,
      donor_first_name: '',
      donor_last_name: '',
      donor_email: '',
      donor_note: '',
      is_anonymous: false,
      donation_type: 'one_time',
      recurring_interval: null,
      cover_fees: false,
      terms_accepted: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: DonationIntentFormData) => {
      return publicApi.createDonationIntent({
        campaign_slug: campaign.slug,
        org_slug: orgSlug,
        amount: data.amount,
        cover_fees: data.cover_fees,
        donation_type: data.donation_type,
        recurring_interval: data.donation_type === 'recurring' ? data.recurring_interval ?? null : null,
        donor_first_name: data.is_anonymous ? 'Anónimo' : data.donor_first_name,
        donor_last_name: data.is_anonymous ? '' : data.donor_last_name,
        donor_email: data.donor_email,
        donor_note: data.donor_note || null,
        is_anonymous: data.is_anonymous,
        terms_accepted: true,
      });
    },
    onSuccess: (response) => {
      if (response.data?.intentId) {
        navigate(`/donaciones/${response.data.intentId}`);
      }
    },
  });

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    form.setValue('amount', amount, { shouldValidate: true });
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    const numValue = parseInt(value) || 0;
    form.setValue('amount', numValue, { shouldValidate: true });
  };

  const onSubmit = (data: DonationIntentFormData) => {
    if (!data.terms_accepted) {
      form.setError('terms_accepted', { message: 'Debes aceptar los términos' });
      return;
    }
    createMutation.mutate(data);
  };

  const watchAmount = form.watch('amount');
  const watchCoverFees = form.watch('cover_fees');
  const watchDonationType = form.watch('donation_type');
  const watchAnonymous = form.watch('is_anonymous');

  const feeAmount = watchCoverFees ? Math.round(watchAmount * feePercent / 100) : 0;
  const totalAmount = watchAmount + feeAmount;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Selecciona un monto</label>
          {suggestedAmounts.length > 0 && (
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
          )}
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
            <p className="text-sm text-destructive" data-testid="text-error-amount">{form.formState.errors.amount.message}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium">Donación recurrente</label>
                <p className="text-xs text-muted-foreground">Contribuir periódicamente</p>
              </div>
            </div>
            <FormField
              control={form.control}
              name="donation_type"
              render={({ field }) => (
                <Switch
                  checked={field.value === 'recurring'}
                  onCheckedChange={(checked) => {
                    field.onChange(checked ? 'recurring' : 'one_time');
                    if (!checked) {
                      form.setValue('recurring_interval', null);
                    } else {
                      form.setValue('recurring_interval', 'monthly');
                    }
                  }}
                  data-testid="switch-recurring"
                />
              )}
            />
          </div>

          {watchDonationType === 'recurring' && (
            <FormField
              control={form.control}
              name="recurring_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia</FormLabel>
                  <Select
                    value={field.value || 'monthly'}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-cadence">
                        <SelectValue placeholder="Selecciona frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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

        <div className="space-y-4">
          {!watchAnonymous && (
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="donor_first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Juan"
                        data-testid="input-first-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="donor_last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Pérez"
                        data-testid="input-last-name"
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

          <FormField
            control={form.control}
            name="donor_note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Nota o mensaje (opcional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Escribe un mensaje para la organización..."
                    className="resize-none"
                    rows={2}
                    data-testid="input-donor-note"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium">Cubrir tarifas de procesamiento</label>
                <p className="text-xs text-muted-foreground">
                  Agrega {feePercent}% para cubrir los costos
                </p>
              </div>
            </div>
            <FormField
              control={form.control}
              name="cover_fees"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-cover-fees"
                />
              )}
            />
          </div>

          {watchCoverFees && watchAmount > 0 && (
            <div className="bg-muted/50 rounded-md p-3 space-y-1.5 text-sm" data-testid="text-fee-breakdown">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Donación</span>
                <span>{formatCurrency(watchAmount, campaign.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarifa ({feePercent}%)</span>
                <span>{formatCurrency(feeAmount, campaign.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span data-testid="text-fee-total">{formatCurrency(totalAmount, campaign.currency)}</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <FormField
          control={form.control}
          name="terms_accepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-terms"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal cursor-pointer">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    Acepto los Términos y Condiciones y la Política de Privacidad
                  </span>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={createMutation.isPending || !watchAmount}
          data-testid="button-continue"
        >
          {createMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Procesando...
            </>
          ) : (
            <>
              Continuar
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>

        {createMutation.isError && (
          <p className="text-sm text-destructive text-center" data-testid="text-submit-error">
            Error al procesar la donación. Por favor, intenta de nuevo.
          </p>
        )}

        {(createMutation as any).data?.error && (
          <p className="text-sm text-destructive text-center" data-testid="text-submit-error">
            {(createMutation as any).data.error}
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

export default function DonatePage() {
  const [, params] = useRoute('/donar/:orgSlug/:campaignSlug');

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
            <h2 className="text-xl font-semibold mb-2" data-testid="text-campaign-not-found">Campaña no encontrada</h2>
            <p className="text-muted-foreground">
              La campaña que buscas no existe o ya no está disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { campaign, organization, processing_fee_percent } = response.data;
  const progress = campaign.goal_amount
    ? Math.min(100, (campaign.raised_minor / (campaign.goal_amount * 100)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">
                {organization.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm" data-testid="text-org-name">{organization.name}</p>
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
              <h1 className="text-3xl font-bold" data-testid="text-campaign-title">{campaign.title}</h1>
              {campaign.description && (
                <p className="text-muted-foreground mt-3" data-testid="text-campaign-description">{campaign.description}</p>
              )}
            </div>

            {campaign.image_url && (
              <div className="rounded-md overflow-hidden">
                <img
                  src={campaign.image_url}
                  alt={campaign.title}
                  className="w-full h-auto object-cover max-h-64"
                  data-testid="img-campaign"
                />
              </div>
            )}

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-2xl font-bold text-primary" data-testid="text-raised-amount">
                      {formatCurrency(campaign.raised_minor / 100, campaign.currency)}
                    </p>
                    {campaign.goal_amount && (
                      <p className="text-sm text-muted-foreground">
                        recaudados de {formatCurrency(campaign.goal_amount, campaign.currency)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" data-testid="text-donations-count">{campaign.donations_count}</p>
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
                <DonationForm
                  campaign={campaign}
                  organization={organization}
                  feePercent={processing_fee_percent}
                  orgSlug={orgSlug}
                />
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
