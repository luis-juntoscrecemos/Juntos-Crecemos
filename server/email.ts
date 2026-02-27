import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface DonationReceiptData {
  donorEmail: string;
  donorName: string;
  organizationName: string;
  campaignTitle: string;
  amount: number;
  feeAmount: number;
  totalAmount: number;
  currency: string;
  donationType: string;
  recurringInterval: string | null;
  shortId: string;
  isAnonymous: boolean;
  donorNote: string | null;
  paidAt: string;
}

function formatCurrency(amount: number, currency: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

const CADENCE_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  semiannual: 'Semestral',
  yearly: 'Anual',
};

const FONT_STACK = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO_STACK = "'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace";

export async function sendDonationReceipt(data: DonationReceiptData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    console.log(`[Email] Sending donation receipt to ${data.donorEmail} for #${data.shortId}`);

    const recurringLabel = data.recurringInterval ? CADENCE_LABELS[data.recurringInterval] || data.recurringInterval : null;

    const safeDonorName = escapeHtml(data.donorName);
    const safeOrgName = escapeHtml(data.organizationName);
    const safeCampaignTitle = escapeHtml(data.campaignTitle);
    const safeShortId = escapeHtml(data.shortId);
    const safeDonorNote = data.donorNote ? escapeHtml(data.donorNote) : null;

    const appUrl = (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : process.env.REPLIT_DEPLOYMENT_URL ? `https://${process.env.REPLIT_DEPLOYMENT_URL}` : 'https://juntoscrecemos.co');
    const logoUrl = `${appUrl}/branding/juntos-crecemos-logo.png`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:${FONT_STACK};">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      
      <div style="background:#16A34A;padding:32px 24px;text-align:center;">
        <table role="presentation" style="margin:0 auto 16px;border:none;border-collapse:collapse;">
          <tr>
            <td style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;font-size:28px;color:#ffffff;line-height:56px;">&#10003;</td>
          </tr>
        </table>
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 4px;font-family:${FONT_STACK};">Recibo de donaci\u00f3n</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;font-family:${FONT_STACK};">Gracias por tu generosidad</p>
      </div>
      
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;font-family:${FONT_STACK};">
          <tr>
            <td style="padding:10px 0;color:#71717a;font-size:14px;">ID Transacci\u00f3n</td>
            <td style="padding:10px 0;text-align:right;font-family:${MONO_STACK};font-size:14px;font-weight:600;color:#18181b;">#${safeShortId}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#71717a;font-size:14px;">Fecha</td>
            <td style="padding:10px 0;text-align:right;font-size:14px;color:#18181b;">${formatDate(data.paidAt)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#71717a;font-size:14px;">Donante</td>
            <td style="padding:10px 0;text-align:right;font-size:14px;color:#18181b;">${data.isAnonymous ? 'An\u00f3nimo' : safeDonorName}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#71717a;font-size:14px;">Organizaci\u00f3n</td>
            <td style="padding:10px 0;text-align:right;font-size:14px;color:#18181b;">${safeOrgName}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#71717a;font-size:14px;">Campa\u00f1a</td>
            <td style="padding:10px 0;text-align:right;font-size:14px;color:#18181b;">${safeCampaignTitle}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#71717a;font-size:14px;">Tipo</td>
            <td style="padding:10px 0;text-align:right;font-size:14px;color:#18181b;">${data.donationType === 'recurring' ? `Recurrente (${recurringLabel})` : '\u00danica'}</td>
          </tr>
        </table>
        
        <div style="margin:16px 0;border-top:1px solid #e4e4e7;"></div>
        
        <table style="width:100%;border-collapse:collapse;font-family:${FONT_STACK};">
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:14px;">Donaci\u00f3n</td>
            <td style="padding:8px 0;text-align:right;font-size:14px;color:#18181b;">${formatCurrency(data.amount, data.currency)}</td>
          </tr>
          ${data.feeAmount > 0 ? `
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:14px;">Tarifas de procesamiento</td>
            <td style="padding:8px 0;text-align:right;font-size:14px;color:#18181b;">${formatCurrency(data.feeAmount, data.currency)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:12px 0 8px;font-size:16px;font-weight:700;color:#18181b;">Total</td>
            <td style="padding:12px 0 8px;text-align:right;font-size:16px;font-weight:700;color:#16A34A;">${formatCurrency(data.totalAmount, data.currency)}</td>
          </tr>
        </table>

        ${safeDonorNote ? `
        <div style="margin:16px 0;border-top:1px solid #e4e4e7;"></div>
        <div style="background:#f4f4f5;border-radius:8px;padding:12px;">
          <p style="color:#71717a;font-size:13px;margin:0 0 4px;font-family:${FONT_STACK};">Tu mensaje:</p>
          <p style="color:#18181b;font-size:14px;margin:0;font-family:${FONT_STACK};">${safeDonorNote}</p>
        </div>
        ` : ''}
      </div>
      
      <div style="background:#f4f4f5;padding:20px 24px;text-align:center;">
        <img src="${logoUrl}" alt="Juntos Crecemos" width="140" height="auto" style="display:block;margin:0 auto 12px;max-width:140px;height:auto;" />
        <p style="color:#71717a;font-size:12px;margin:0;font-family:${FONT_STACK};">
          Este recibo fue generado por Juntos Crecemos en nombre de ${safeOrgName}.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const fromAddress = process.env.EMAIL_FROM || 'Juntos Crecemos <gracias@mail.juntoscrecemos.co>';
    const replyToAddress = process.env.EMAIL_REPLY_TO || 'hola@juntoscrecemos.co';

    const { error } = await resend.emails.send({
      from: fromAddress,
      replyTo: replyToAddress,
      to: data.donorEmail,
      subject: `Recibo de donación #${safeShortId} - ${safeOrgName}`,
      html: htmlContent,
    });

    if (error) {
      console.error('[Email] Resend API error:', JSON.stringify(error));
      return { success: false, error: error.message };
    }

    console.log(`[Email] Receipt sent successfully to ${data.donorEmail}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Email] Unexpected error:', err?.message || err);
    return { success: false, error: err.message || 'Unknown email error' };
  }
}
