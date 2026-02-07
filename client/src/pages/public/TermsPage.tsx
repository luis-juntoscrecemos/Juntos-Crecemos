import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/" className="text-primary font-bold text-lg" data-testid="link-home">
            Juntos Crecemos
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 md:p-10 space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-terms-title">Términos y Condiciones</h1>
              <p className="text-sm text-muted-foreground">Última actualización: Febrero 2026</p>
            </div>

            <Separator />

            <section className="space-y-3" data-testid="section-acceptance">
              <h2 className="text-xl font-semibold">1. Aceptación de los Términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Al utilizar la plataforma Juntos Crecemos para realizar donaciones, usted acepta cumplir con estos Términos y Condiciones en su totalidad. Si no está de acuerdo con alguno de estos términos, le rogamos que no utilice nuestros servicios.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Estos términos aplican a todos los usuarios de la plataforma, incluyendo donantes, organizaciones no gubernamentales (ONGs) y cualquier otra persona que acceda al sitio.
              </p>
            </section>

            <section className="space-y-3" data-testid="section-donations">
              <h2 className="text-xl font-semibold">2. Naturaleza de las Donaciones</h2>
              <p className="text-muted-foreground leading-relaxed">
                Las donaciones realizadas a través de Juntos Crecemos son contribuciones voluntarias destinadas a las organizaciones sin fines de lucro registradas en la plataforma. Salvo que se indique lo contrario por la organización receptora:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Las donaciones son definitivas y no reembolsables una vez procesadas.</li>
                <li>Las donaciones se destinan directamente a la organización y campaña seleccionada por el donante.</li>
                <li>Juntos Crecemos actúa como intermediario tecnológico y no administra los fondos donados.</li>
                <li>Las donaciones recurrentes pueden ser canceladas en cualquier momento por el donante.</li>
              </ul>
            </section>

            <section className="space-y-3" data-testid="section-privacy">
              <h2 className="text-xl font-semibold">3. Protección de Datos y Privacidad</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nos comprometemos a proteger la información personal de nuestros usuarios. Los datos recopilados durante el proceso de donación se utilizan exclusivamente para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Procesar y registrar las donaciones realizadas.</li>
                <li>Enviar confirmaciones y recibos de donación al donante.</li>
                <li>Proporcionar a las organizaciones receptoras la información necesaria para gestionar las contribuciones.</li>
                <li>Cumplir con obligaciones legales y regulatorias aplicables.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                No compartimos, vendemos ni alquilamos información personal a terceros sin el consentimiento explícito del usuario, salvo cuando sea requerido por ley.
              </p>
            </section>

            <section className="space-y-3" data-testid="section-payments">
              <h2 className="text-xl font-semibold">4. Procesamiento de Pagos</h2>
              <p className="text-muted-foreground leading-relaxed">
                El procesamiento de pagos se realiza a través de proveedores de servicios de pago certificados y seguros. Juntos Crecemos no almacena información de tarjetas de crédito ni datos financieros sensibles en sus servidores.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Las tarifas de procesamiento pueden aplicarse según lo indicado en el momento de la donación. El donante tiene la opción de cubrir dichas tarifas para que el monto total llegue íntegro a la organización.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Los montos se procesan en la moneda indicada al momento de la donación (generalmente pesos colombianos - COP).
              </p>
            </section>

            <section className="space-y-3" data-testid="section-organizations">
              <h2 className="text-xl font-semibold">5. Responsabilidad de las Organizaciones</h2>
              <p className="text-muted-foreground leading-relaxed">
                Las organizaciones registradas en Juntos Crecemos son responsables de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Proporcionar información veraz y actualizada sobre su misión, proyectos y uso de fondos.</li>
                <li>Utilizar los fondos recaudados de acuerdo con el propósito declarado en sus campañas.</li>
                <li>Cumplir con todas las leyes y regulaciones aplicables en su jurisdicción.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Juntos Crecemos no garantiza el uso final de los fondos por parte de las organizaciones, pero se reserva el derecho de suspender o eliminar organizaciones que no cumplan con estos estándares.
              </p>
            </section>

            <section className="space-y-3" data-testid="section-liability">
              <h2 className="text-xl font-semibold">6. Limitación de Responsabilidad</h2>
              <p className="text-muted-foreground leading-relaxed">
                Juntos Crecemos proporciona la plataforma tecnológica "tal cual" y no se hace responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Interrupciones temporales del servicio por mantenimiento o causas de fuerza mayor.</li>
                <li>El uso indebido de los fondos por parte de las organizaciones receptoras.</li>
                <li>Pérdidas indirectas derivadas del uso de la plataforma.</li>
              </ul>
            </section>

            <section className="space-y-3" data-testid="section-changes">
              <h2 className="text-xl font-semibold">7. Modificaciones a los Términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios serán publicados en esta página con la fecha de actualización correspondiente. El uso continuado de la plataforma después de dichos cambios constituye la aceptación de los nuevos términos.
              </p>
            </section>

            <section className="space-y-3" data-testid="section-contact">
              <h2 className="text-xl font-semibold">8. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si tiene preguntas o inquietudes sobre estos Términos y Condiciones, puede contactarnos a través de:
              </p>
              <p className="text-muted-foreground">
                Correo electrónico: <span className="text-foreground font-medium">soporte@juntoscrecemos.org</span>
              </p>
            </section>

            <Separator />

            <p className="text-xs text-muted-foreground text-center">
              Juntos Crecemos - Plataforma de donaciones para ONGs en América del Sur
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-8">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Desarrollado por <span className="font-semibold text-primary">Juntos Crecemos</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
