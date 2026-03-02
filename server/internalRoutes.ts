import type { Express } from 'express';
import { supabase } from './supabase';
import { internalAuthMiddleware, requireRole, type InternalAuthenticatedRequest } from './middleware/internalAuth';
import { logAuditEvent } from './internalAudit';
import { sendDonationReceipt } from './email';
import { customAlphabet } from 'nanoid';
import crypto from 'crypto';

const nanoidToken = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 32);

function computeInternalDateRange(range: string): { start?: string; end?: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: string | undefined;

  switch (range) {
    case '7':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '30':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '90':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'all':
    default:
      return {};
  }

  return { start, end };
}

export function registerInternalRoutes(app: Express): void {
  // ============================================
  // Check if current user is an internal admin
  // ============================================
  app.get('/api/internal/check', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    res.json({
      data: {
        isInternalAdmin: true,
        admin: req.internalAdmin,
      },
    });
  });

  // ============================================
  // Metrics / KPIs
  // ============================================
  app.get('/api/internal/metrics', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const range = (req.query.range as string) || 'all';
      const { start, end } = computeInternalDateRange(range);

      const [orgsResult, donorsResult, donationsResult] = await Promise.all([
        start
          ? supabase.from('organizations').select('id', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end!)
          : supabase.from('organizations').select('id', { count: 'exact', head: true }),
        start
          ? supabase.from('donor_accounts').select('id', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end!)
          : supabase.from('donor_accounts').select('id', { count: 'exact', head: true }),
        start
          ? supabase.from('donations').select('amount_minor').eq('status', 'paid').gte('created_at', start).lte('created_at', end!)
          : supabase.from('donations').select('amount_minor').eq('status', 'paid'),
      ]);

      const donationsCount = donationsResult.data?.length || 0;
      const totalRaised = donationsResult.data?.reduce((sum: number, d: any) => sum + (d.amount_minor || 0), 0) || 0;

      res.json({
        data: {
          organizationsCount: orgsResult.count || 0,
          donorsCount: donorsResult.count || 0,
          donationsCount,
          totalRaised: totalRaised / 100,
        },
      });
    } catch (error) {
      console.error('Internal metrics error:', error);
      res.status(500).json({ error: 'Error al obtener métricas' });
    }
  });

  app.get('/api/internal/metrics/series', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const range = (req.query.range as string) || '30';
      const { start, end } = computeInternalDateRange(range);

      let query = supabase
        .from('donations')
        .select('amount_minor, created_at')
        .eq('status', 'paid')
        .order('created_at', { ascending: true });

      if (start) query = query.gte('created_at', start);
      if (end) query = query.lte('created_at', end);

      const { data: donations } = await query;

      const dailyMap = new Map<string, { amount: number; count: number }>();
      for (const d of donations || []) {
        const date = d.created_at.substring(0, 10);
        const existing = dailyMap.get(date) || { amount: 0, count: 0 };
        existing.amount += (d.amount_minor || 0) / 100;
        existing.count += 1;
        dailyMap.set(date, existing);
      }

      const series = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count,
      }));

      res.json({ data: series });
    } catch (error) {
      console.error('Internal metrics series error:', error);
      res.status(500).json({ error: 'Error al obtener datos' });
    }
  });

  app.get('/api/internal/metrics/top-orgs', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const range = (req.query.range as string) || 'all';
      const limit = parseInt(req.query.limit as string) || 10;
      const { start, end } = computeInternalDateRange(range);

      let query = supabase
        .from('donations')
        .select('org_id, amount_minor, organizations(name)')
        .eq('status', 'paid');

      if (start) query = query.gte('created_at', start);
      if (end) query = query.lte('created_at', end);

      const { data: donations } = await query;

      const orgMap = new Map<string, { name: string; total: number; count: number }>();
      for (const d of donations || []) {
        const existing = orgMap.get(d.org_id) || { name: (d as any).organizations?.name || 'Unknown', total: 0, count: 0 };
        existing.total += (d.amount_minor || 0) / 100;
        existing.count += 1;
        orgMap.set(d.org_id, existing);
      }

      const topOrgs = Array.from(orgMap.entries())
        .map(([id, data]) => ({ id, name: data.name, total: data.total, count: data.count }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);

      res.json({ data: topOrgs });
    } catch (error) {
      console.error('Internal top orgs error:', error);
      res.status(500).json({ error: 'Error al obtener datos' });
    }
  });

  // ============================================
  // Organizations
  // ============================================
  app.get('/api/internal/orgs', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const search = (req.query.search as string) || '';
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
      const sort = (req.query.sort as string) || 'created_at';
      const sortDir = (req.query.sortDir as string) === 'asc' ? true : false;
      const offset = (page - 1) * pageSize;

      let query = supabase
        .from('organizations')
        .select('id, name, slug, email, country, city, status, logo_url, created_at', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,email.ilike.%${search}%,country.ilike.%${search}%`);
      }

      query = query.order(sort, { ascending: sortDir }).range(offset, offset + pageSize - 1);

      const { data: orgs, count, error } = await query;
      if (error) throw error;

      const orgIds = orgs?.map((o: any) => o.id) || [];
      let donationStats: any[] = [];
      if (orgIds.length > 0) {
        const { data: donations } = await supabase
          .from('donations')
          .select('org_id, amount_minor')
          .eq('status', 'paid')
          .in('org_id', orgIds);

        const statsMap = new Map<string, { count: number; total: number }>();
        for (const d of donations || []) {
          const existing = statsMap.get(d.org_id) || { count: 0, total: 0 };
          existing.count += 1;
          existing.total += d.amount_minor || 0;
          statsMap.set(d.org_id, existing);
        }
        donationStats = Array.from(statsMap.entries()).map(([orgId, stats]) => ({ orgId, ...stats }));
      }

      const enrichedOrgs = orgs?.map((org: any) => {
        const stats = donationStats.find((s) => s.orgId === org.id);
        return {
          ...org,
          donations_count: stats?.count || 0,
          donations_total: (stats?.total || 0) / 100,
        };
      });

      res.json({ data: enrichedOrgs, total: count || 0 });
    } catch (error) {
      console.error('Internal orgs list error:', error);
      res.status(500).json({ error: 'Error al obtener organizaciones' });
    }
  });

  app.get('/api/internal/orgs/:id', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const [orgResult, campaignsResult, donationsResult, donorCountResult] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', id).single(),
        supabase.from('campaigns_with_totals').select('*').eq('org_id', id).order('created_at', { ascending: false }),
        supabase.from('donations').select('*, campaigns(title)').eq('org_id', id).eq('status', 'paid').order('created_at', { ascending: false }).limit(50),
        supabase.from('donations').select('donor_email', { count: 'exact' }).eq('org_id', id).eq('status', 'paid').not('donor_email', 'is', null),
      ]);

      if (orgResult.error || !orgResult.data) {
        return res.status(404).json({ error: 'Organización no encontrada' });
      }

      const uniqueDonors = new Set((donorCountResult.data || []).map((d: any) => d.donor_email)).size;

      const totalRaised = (donationsResult.data || []).reduce((sum: number, d: any) => sum + (d.amount_minor || 0), 0) / 100;

      res.json({
        data: {
          organization: orgResult.data,
          campaigns: campaignsResult.data || [],
          recentDonations: (donationsResult.data || []).map((d: any) => ({
            ...d,
            campaign_title: d.campaigns?.title || null,
          })),
          stats: {
            totalRaised,
            donationsCount: donationsResult.data?.length || 0,
            uniqueDonors,
            campaignsCount: campaignsResult.data?.length || 0,
          },
        },
      });
    } catch (error) {
      console.error('Internal org detail error:', error);
      res.status(500).json({ error: 'Error al obtener organización' });
    }
  });

  app.post('/api/internal/orgs/:id/status', internalAuthMiddleware, requireRole('SUPER_ADMIN'), async (req: InternalAuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      const { error } = await supabase
        .from('organizations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      await logAuditEvent(
        req.userId!,
        req.userEmail!,
        status === 'SUSPENDED' ? 'ORG_SUSPENDED' : 'ORG_RESTORED',
        'organization',
        id,
        { status, reason: reason || null }
      );

      res.json({ message: `Organización ${status === 'SUSPENDED' ? 'suspendida' : 'restaurada'} exitosamente` });
    } catch (error) {
      console.error('Internal org status error:', error);
      res.status(500).json({ error: 'Error al cambiar estado' });
    }
  });

  // ============================================
  // Donors
  // ============================================
  app.get('/api/internal/donors', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const search = (req.query.search as string) || '';
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
      const offset = (page - 1) * pageSize;

      let query = supabase
        .from('donor_accounts')
        .select('id, email, full_name, created_at', { count: 'exact' });

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

      const { data: donors, count, error } = await query;
      if (error) throw error;

      const donorIds = donors?.map((d: any) => d.id) || [];
      let donorStats: any[] = [];
      if (donorIds.length > 0) {
        const { data: donations } = await supabase
          .from('donations')
          .select('donor_account_id, amount_minor')
          .eq('status', 'paid')
          .in('donor_account_id', donorIds);

        const statsMap = new Map<string, { count: number; total: number }>();
        for (const d of donations || []) {
          if (!d.donor_account_id) continue;
          const existing = statsMap.get(d.donor_account_id) || { count: 0, total: 0 };
          existing.count += 1;
          existing.total += d.amount_minor || 0;
          statsMap.set(d.donor_account_id, existing);
        }
        donorStats = Array.from(statsMap.entries()).map(([donorId, stats]) => ({ donorId, ...stats }));
      }

      const enrichedDonors = donors?.map((donor: any) => {
        const stats = donorStats.find((s) => s.donorId === donor.id);
        return {
          ...donor,
          donations_count: stats?.count || 0,
          donations_total: (stats?.total || 0) / 100,
        };
      });

      res.json({ data: enrichedDonors, total: count || 0 });
    } catch (error) {
      console.error('Internal donors list error:', error);
      res.status(500).json({ error: 'Error al obtener donantes' });
    }
  });

  app.get('/api/internal/donors/:id', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const [donorResult, donationsResult] = await Promise.all([
        supabase.from('donor_accounts').select('*').eq('id', id).single(),
        supabase
          .from('donations')
          .select('*, campaigns(title), organizations(name)')
          .eq('donor_account_id', id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (donorResult.error || !donorResult.data) {
        return res.status(404).json({ error: 'Donante no encontrado' });
      }

      const totalDonated = (donationsResult.data || []).reduce((sum: number, d: any) => sum + (d.amount_minor || 0), 0) / 100;

      res.json({
        data: {
          donor: donorResult.data,
          donations: (donationsResult.data || []).map((d: any) => ({
            ...d,
            campaign_title: d.campaigns?.title || null,
            organization_name: d.organizations?.name || null,
          })),
          stats: {
            totalDonated,
            donationsCount: donationsResult.data?.length || 0,
          },
        },
      });
    } catch (error) {
      console.error('Internal donor detail error:', error);
      res.status(500).json({ error: 'Error al obtener donante' });
    }
  });

  // ============================================
  // Donations
  // ============================================
  app.get('/api/internal/donations', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
      const offset = (page - 1) * pageSize;
      const { dateStart, dateEnd, orgId, campaignId, amountMin, amountMax, status } = req.query;

      let query = supabase
        .from('donations')
        .select('id, short_id, donor_name, donor_email, amount_minor, currency, status, is_recurring, is_anonymous, paid_at, created_at, org_id, campaign_id, organizations(name), campaigns(title)', { count: 'exact' });

      if (dateStart) query = query.gte('created_at', dateStart as string);
      if (dateEnd) query = query.lte('created_at', dateEnd as string);
      if (orgId) query = query.eq('org_id', orgId as string);
      if (campaignId) query = query.eq('campaign_id', campaignId as string);
      if (status) query = query.eq('status', status as string);
      if (amountMin) query = query.gte('amount_minor', parseInt(amountMin as string) * 100);
      if (amountMax) query = query.lte('amount_minor', parseInt(amountMax as string) * 100);

      query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

      const { data: donations, count, error } = await query;
      if (error) throw error;

      const enriched = (donations || []).map((d: any) => ({
        ...d,
        organization_name: d.organizations?.name || null,
        campaign_title: d.campaigns?.title || null,
        organizations: undefined,
        campaigns: undefined,
      }));

      res.json({ data: enriched, total: count || 0 });
    } catch (error) {
      console.error('Internal donations list error:', error);
      res.status(500).json({ error: 'Error al obtener donaciones' });
    }
  });

  // ============================================
  // Invites
  // ============================================
  app.get('/api/internal/admins', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabase
        .from('internal_admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ data: data || [] });
    } catch (error) {
      console.error('Internal admins list error:', error);
      res.status(500).json({ error: 'Error al obtener administradores' });
    }
  });

  app.post('/api/internal/invites', internalAuthMiddleware, requireRole('SUPER_ADMIN'), async (req: InternalAuthenticatedRequest, res) => {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        return res.status(400).json({ error: 'Email y rol requeridos' });
      }

      if (!['SUPER_ADMIN', 'ADMIN', 'VIEWER'].includes(role)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }

      const { data: existing } = await supabase
        .from('internal_admins')
        .select('id, status')
        .eq('email', email)
        .single();

      if (existing && existing.status === 'ACTIVE') {
        return res.status(400).json({ error: 'Este usuario ya es un administrador activo' });
      }

      if (!existing) {
        await supabase.from('internal_admins').insert({
          email,
          role,
          status: 'INVITED',
        });
      }

      const token = nanoidToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await supabase.from('internal_admin_invites').insert({
        email,
        role,
        token,
        expires_at: expiresAt,
        created_by: req.internalAdmin!.id,
      });

      await logAuditEvent(
        req.userId!,
        req.userEmail!,
        'ADMIN_INVITED',
        'internal_admin',
        email,
        { role }
      );

      const appUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DEPLOYMENT_URL
          ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
          : 'https://juntoscrecemos.co';

      const inviteLink = `${appUrl}/internal/accept-invite?token=${token}`;

      res.json({
        message: 'Invitación creada exitosamente',
        inviteLink,
      });
    } catch (error) {
      console.error('Internal invite error:', error);
      res.status(500).json({ error: 'Error al crear invitación' });
    }
  });

  app.post('/api/internal/invites/accept', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Debes iniciar sesión primero' });
      }

      const tokenStr = authHeader.split(' ')[1];
      const { verifyToken } = await import('./supabase');
      const user = await verifyToken(tokenStr);
      if (!user) {
        return res.status(401).json({ error: 'Token inválido' });
      }

      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Token de invitación requerido' });
      }

      const { data: invite, error: inviteError } = await supabase
        .from('internal_admin_invites')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      if (inviteError || !invite) {
        return res.status(400).json({ error: 'Invitación no encontrada o ya aceptada' });
      }

      if (new Date(invite.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Esta invitación ha expirado' });
      }

      if (user.email !== invite.email) {
        console.warn(`Invite acceptance rejected: user ${user.email} tried to accept invite for ${invite.email}`);
        return res.status(403).json({ error: 'Este correo no coincide con la invitación. Inicia sesión con la cuenta correcta.' });
      }

      const { error: updateAdminError } = await supabase
        .from('internal_admins')
        .update({ user_id: user.userId, status: 'ACTIVE' })
        .eq('email', invite.email);

      if (updateAdminError) throw updateAdminError;

      await supabase
        .from('internal_admin_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id);

      await logAuditEvent(
        user.userId,
        user.email,
        'INVITE_ACCEPTED',
        'internal_admin',
        invite.email,
        { role: invite.role }
      );

      res.json({ message: 'Invitación aceptada exitosamente' });
    } catch (error) {
      console.error('Accept invite error:', error);
      res.status(500).json({ error: 'Error al aceptar invitación' });
    }
  });

  // ============================================
  // Impersonation
  // ============================================
  app.post('/api/internal/impersonation/start', internalAuthMiddleware, requireRole('SUPER_ADMIN'), async (req: InternalAuthenticatedRequest, res) => {
    try {
      const { orgId } = req.body;
      if (!orgId) {
        return res.status(400).json({ error: 'orgId requerido' });
      }

      const { data: org, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', orgId)
        .single();

      if (error || !org) {
        return res.status(404).json({ error: 'Organización no encontrada' });
      }

      await logAuditEvent(
        req.userId!,
        req.userEmail!,
        'IMPERSONATION_START',
        'organization',
        orgId,
        { orgName: org.name }
      );

      res.json({
        data: {
          orgId: org.id,
          orgName: org.name,
          orgSlug: org.slug,
        },
      });
    } catch (error) {
      console.error('Impersonation start error:', error);
      res.status(500).json({ error: 'Error al iniciar impersonación' });
    }
  });

  app.post('/api/internal/impersonation/stop', internalAuthMiddleware, requireRole('SUPER_ADMIN'), async (req: InternalAuthenticatedRequest, res) => {
    try {
      const { orgId } = req.body;

      await logAuditEvent(
        req.userId!,
        req.userEmail!,
        'IMPERSONATION_STOP',
        'organization',
        orgId || null,
        {}
      );

      res.json({ message: 'Impersonación finalizada' });
    } catch (error) {
      console.error('Impersonation stop error:', error);
      res.status(500).json({ error: 'Error al detener impersonación' });
    }
  });

  // ============================================
  // Exports
  // ============================================
  app.get('/api/internal/exports/orgs', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const search = (req.query.search as string) || '';

      let query = supabase
        .from('organizations')
        .select('id, name, slug, email, country, city, status, created_at');

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: orgs, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      const csvHeader = 'ID,Nombre,Slug,Email,País,Ciudad,Estado,Fecha de Registro\n';
      const csvRows = (orgs || []).map((o: any) =>
        `"${o.id}","${o.name}","${o.slug}","${o.email}","${o.country}","${o.city}","${o.status}","${o.created_at}"`
      ).join('\n');

      await logAuditEvent(req.userId!, req.userEmail!, 'EXPORT_ORGS', 'export', null, {
        format: 'csv',
        filters: { search },
        rowCount: orgs?.length || 0,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=organizaciones.csv');
      res.send('\uFEFF' + csvHeader + csvRows);
    } catch (error) {
      console.error('Export orgs error:', error);
      res.status(500).json({ error: 'Error al exportar' });
    }
  });

  app.get('/api/internal/exports/donations', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const { dateStart, dateEnd, orgId, status: donStatus } = req.query;

      let query = supabase
        .from('donations')
        .select('id, short_id, donor_name, donor_email, amount_minor, currency, status, is_recurring, is_anonymous, paid_at, created_at, organizations(name), campaigns(title)')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (dateStart) query = query.gte('created_at', dateStart as string);
      if (dateEnd) query = query.lte('created_at', dateEnd as string);
      if (orgId) query = query.eq('org_id', orgId as string);
      if (donStatus) query = query.eq('status', donStatus as string);

      const { data: donations, error } = await query;
      if (error) throw error;

      const csvHeader = 'ID,ID Corto,Donante,Email,Monto,Moneda,Estado,Recurrente,Anónimo,Organización,Campaña,Fecha de Pago,Fecha de Creación\n';
      const csvRows = (donations || []).map((d: any) =>
        `"${d.id}","${d.short_id || ''}","${d.donor_name || ''}","${d.donor_email || ''}",${(d.amount_minor || 0) / 100},"${d.currency}","${d.status}","${d.is_recurring ? 'Sí' : 'No'}","${d.is_anonymous ? 'Sí' : 'No'}","${(d as any).organizations?.name || ''}","${(d as any).campaigns?.title || ''}","${d.paid_at || ''}","${d.created_at}"`
      ).join('\n');

      await logAuditEvent(req.userId!, req.userEmail!, 'EXPORT_DONATIONS', 'export', null, {
        format: 'csv',
        filters: { dateStart, dateEnd, orgId, status: donStatus },
        rowCount: donations?.length || 0,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=donaciones.csv');
      res.send('\uFEFF' + csvHeader + csvRows);
    } catch (error) {
      console.error('Export donations error:', error);
      res.status(500).json({ error: 'Error al exportar' });
    }
  });

  // ============================================
  // Audit Logs
  // ============================================
  app.get('/api/internal/audit-logs', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 30, 100);
      const offset = (page - 1) * pageSize;

      const action = req.query.action as string;
      let query = supabase
        .from('internal_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (action) {
        query = query.eq('action', action);
      }

      const { data, count, error } = await query.range(offset, offset + pageSize - 1);

      if (error) throw error;

      res.json({ data: data || [], total: count || 0 });
    } catch (error) {
      console.error('Audit logs error:', error);
      res.status(500).json({ error: 'Error al obtener logs' });
    }
  });

  // ============================================
  // Health Check
  // ============================================
  app.get('/api/internal/health', internalAuthMiddleware, async (req: InternalAuthenticatedRequest, res) => {
    try {
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('organizations').select('id').limit(1);
      const dbLatency = Date.now() - dbStart;

      const [orgsCount, campaignsCount, donationsCount, donorsCount] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('donations').select('*', { count: 'exact', head: true }),
        supabase.from('donor_accounts').select('*', { count: 'exact', head: true }),
      ]);

      res.json({
        data: {
          api: dbError ? 'error' : 'ok',
          database: dbError ? 'error' : 'ok',
          dbLatency,
          version: process.env.REPLIT_DEPLOYMENT_ID || process.env.REPL_ID || 'dev',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          counts: {
            organizations: orgsCount.count || 0,
            campaigns: campaignsCount.count || 0,
            donations: donationsCount.count || 0,
            donors: donorsCount.count || 0,
          },
        },
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        data: {
          api: 'error',
          database: 'error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
}
