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

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      
      <div style="background:#16A34A;padding:32px 24px;text-align:center;">
        <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:28px;color:#ffffff;">&#10003;</span>
        </div>
        <h1 style="color:#ffffff;font-size:22px;margin:0 0 4px;">Recibo de donación</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Gracias por tu generosidad</p>
      </div>
      
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:13px;">ID Transacción</td>
            <td style="padding:8px 0;text-align:right;font-family:monospace;font-size:13px;font-weight:600;color:#18181b;">#${safeShortId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:13px;">Fecha</td>
            <td style="padding:8px 0;text-align:right;font-size:13px;color:#18181b;">${formatDate(data.paidAt)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:13px;">Donante</td>
            <td style="padding:8px 0;text-align:right;font-size:13px;color:#18181b;">${data.isAnonymous ? 'Anónimo' : safeDonorName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:13px;">Organización</td>
            <td style="padding:8px 0;text-align:right;font-size:13px;color:#18181b;">${safeOrgName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:13px;">Campaña</td>
            <td style="padding:8px 0;text-align:right;font-size:13px;color:#18181b;">${safeCampaignTitle}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:13px;">Tipo</td>
            <td style="padding:8px 0;text-align:right;font-size:13px;color:#18181b;">${data.donationType === 'recurring' ? `Recurrente (${recurringLabel})` : 'Única'}</td>
          </tr>
        </table>
        
        <div style="margin:16px 0;border-top:1px solid #e4e4e7;"></div>
        
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#71717a;font-size:13px;">Donación</td>
            <td style="padding:6px 0;text-align:right;font-size:13px;color:#18181b;">${formatCurrency(data.amount, data.currency)}</td>
          </tr>
          ${data.feeAmount > 0 ? `
          <tr>
            <td style="padding:6px 0;color:#71717a;font-size:13px;">Tarifas de procesamiento</td>
            <td style="padding:6px 0;text-align:right;font-size:13px;color:#18181b;">${formatCurrency(data.feeAmount, data.currency)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:12px 0 6px;font-size:15px;font-weight:700;color:#18181b;">Total</td>
            <td style="padding:12px 0 6px;text-align:right;font-size:15px;font-weight:700;color:#16A34A;">${formatCurrency(data.totalAmount, data.currency)}</td>
          </tr>
        </table>

        ${safeDonorNote ? `
        <div style="margin:16px 0;border-top:1px solid #e4e4e7;"></div>
        <div style="background:#f4f4f5;border-radius:8px;padding:12px;">
          <p style="color:#71717a;font-size:12px;margin:0 0 4px;">Tu mensaje:</p>
          <p style="color:#18181b;font-size:13px;margin:0;">${safeDonorNote}</p>
        </div>
        ` : ''}
      </div>
      
      <div style="background:#f4f4f5;padding:16px 24px;text-align:center;">
        <p style="color:#71717a;font-size:12px;margin:0;">
          Este recibo fue generado por Juntos Crecemos en nombre de ${safeOrgName}.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Juntos Crecemos <onboarding@resend.dev>';

    const { error } = await resend.emails.send({
      from: fromAddress,
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
