import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./supabase";
import { authMiddleware, optionalAuthMiddleware, type AuthenticatedRequest } from "./middleware/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============================================
  // Config endpoint for frontend
  // ============================================
  app.get('/api/config', (req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    });
  });
  
  // ============================================
  // Dashboard Stats
  // ============================================
  app.get('/api/dashboard/stats', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.organizationId) {
        return res.json({
          totalDonations: 0,
          totalRaised: 0,
          activeCampaigns: 0,
          totalDonors: 0,
        });
      }

      // Get total donations and raised amount
      const { data: donations } = await supabase
        .from('donations')
        .select('amount_minor, status')
        .eq('org_id', req.organizationId)
        .eq('status', 'paid');

      const totalDonations = donations?.length || 0;
      const totalRaised = donations?.reduce((sum, d) => sum + (d.amount_minor || 0), 0) || 0;

      // Get active campaigns count
      const { count: activeCampaigns } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', req.organizationId)
        .eq('is_active', true);

      // Get unique donors count
      const { data: uniqueDonors } = await supabase
        .from('donations')
        .select('donor_email')
        .eq('org_id', req.organizationId)
        .not('donor_email', 'is', null);

      const uniqueEmails = new Set(uniqueDonors?.map(d => d.donor_email));

      res.json({
        totalDonations,
        totalRaised: totalRaised / 100, // Convert from minor units
        activeCampaigns: activeCampaigns || 0,
        totalDonors: uniqueEmails.size,
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  });

  // ============================================
  // Organizations
  // ============================================
  app.get('/api/organizations/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.organizationId) {
        return res.status(404).json({ error: 'No tienes una organización asociada' });
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', req.organizationId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Organización no encontrada' });
      }

      res.json(data);
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({ error: 'Error al obtener la organización' });
    }
  });

  app.patch('/api/organizations/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      if (id !== req.organizationId) {
        return res.status(403).json({ error: 'No tienes permiso para editar esta organización' });
      }

      const { name, email, phone, website, description, country, city, slug } = req.body;

      const { data, error } = await supabase
        .from('organizations')
        .update({
          name,
          email,
          phone,
          website,
          description,
          country,
          city,
          slug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update organization error:', error);
        return res.status(400).json({ error: 'Error al actualizar la organización' });
      }

      res.json(data);
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({ error: 'Error al actualizar la organización' });
    }
  });

  // ============================================
  // Campaigns
  // ============================================
  app.get('/api/campaigns', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.organizationId) {
        return res.json([]);
      }

      const { data, error } = await supabase
        .from('campaigns_with_totals')
        .select('*')
        .eq('org_id', req.organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get campaigns error:', error);
        return res.status(400).json({ error: 'Error al obtener campañas' });
      }

      res.json(data || []);
    } catch (error) {
      console.error('Get campaigns error:', error);
      res.status(500).json({ error: 'Error al obtener campañas' });
    }
  });

  app.get('/api/campaigns/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('campaigns_with_totals')
        .select('*')
        .eq('id', id)
        .eq('org_id', req.organizationId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Campaña no encontrada' });
      }

      res.json(data);
    } catch (error) {
      console.error('Get campaign error:', error);
      res.status(500).json({ error: 'Error al obtener la campaña' });
    }
  });

  app.post('/api/campaigns', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.organizationId) {
        return res.status(400).json({ error: 'Debes tener una organización para crear campañas' });
      }

      const { title, slug, description, goal_amount, currency, is_active, suggested_amounts } = req.body;

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          org_id: req.organizationId,
          title,
          slug,
          description,
          goal_amount,
          currency: currency || 'COP',
          is_active: is_active ?? true,
          suggested_amounts,
        })
        .select()
        .single();

      if (error) {
        console.error('Create campaign error:', error);
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Ya existe una campaña con este slug' });
        }
        return res.status(400).json({ error: 'Error al crear la campaña' });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json({ error: 'Error al crear la campaña' });
    }
  });

  app.patch('/api/campaigns/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { title, slug, description, goal_amount, currency, is_active, suggested_amounts } = req.body;

      const { data, error } = await supabase
        .from('campaigns')
        .update({
          title,
          slug,
          description,
          goal_amount,
          currency,
          is_active,
          suggested_amounts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('org_id', req.organizationId)
        .select()
        .single();

      if (error) {
        console.error('Update campaign error:', error);
        return res.status(400).json({ error: 'Error al actualizar la campaña' });
      }

      res.json(data);
    } catch (error) {
      console.error('Update campaign error:', error);
      res.status(500).json({ error: 'Error al actualizar la campaña' });
    }
  });

  app.delete('/api/campaigns/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
        .eq('org_id', req.organizationId);

      if (error) {
        console.error('Delete campaign error:', error);
        return res.status(400).json({ error: 'Error al eliminar la campaña' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete campaign error:', error);
      res.status(500).json({ error: 'Error al eliminar la campaña' });
    }
  });

  // ============================================
  // Donations
  // ============================================
  app.get('/api/donations', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.organizationId) {
        return res.json([]);
      }

      const { campaign_id } = req.query;
      
      let query = supabase
        .from('donations')
        .select('*')
        .eq('org_id', req.organizationId)
        .order('created_at', { ascending: false });

      if (campaign_id) {
        query = query.eq('campaign_id', campaign_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get donations error:', error);
        return res.status(400).json({ error: 'Error al obtener donaciones' });
      }

      res.json(data || []);
    } catch (error) {
      console.error('Get donations error:', error);
      res.status(500).json({ error: 'Error al obtener donaciones' });
    }
  });

  app.get('/api/donations/export', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.organizationId) {
        return res.status(400).json({ error: 'Organización requerida' });
      }

      const { data, error } = await supabase
        .from('donations')
        .select('*, campaigns(title)')
        .eq('org_id', req.organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Export donations error:', error);
        return res.status(400).json({ error: 'Error al exportar donaciones' });
      }

      // Generate CSV
      const headers = ['Fecha', 'Donante', 'Email', 'Campaña', 'Monto', 'Moneda', 'Estado', 'Recurrente'];
      const rows = (data || []).map(d => [
        new Date(d.created_at).toLocaleString('es-CO'),
        d.is_anonymous ? 'Anónimo' : (d.donor_name || 'Sin nombre'),
        d.donor_email || '',
        (d.campaigns as any)?.title || 'N/A',
        (d.amount_minor / 100).toString(),
        d.currency,
        d.status,
        d.is_recurring ? 'Sí' : 'No',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=donaciones_${new Date().toISOString().split('T')[0]}.csv`);
      res.send('\ufeff' + csv); // BOM for Excel compatibility
    } catch (error) {
      console.error('Export donations error:', error);
      res.status(500).json({ error: 'Error al exportar donaciones' });
    }
  });

  // ============================================
  // Public API (no auth required)
  // ============================================
  app.get('/api/public/campaigns/:orgSlug/:campaignSlug', async (req, res) => {
    try {
      const { orgSlug, campaignSlug } = req.params;

      // Get organization by slug
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .eq('status', 'active')
        .single();

      if (orgError || !org) {
        return res.status(404).json({ error: 'Organización no encontrada' });
      }

      // Get campaign by slug
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns_with_totals')
        .select('*')
        .eq('org_id', org.id)
        .eq('slug', campaignSlug)
        .eq('is_active', true)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: 'Campaña no encontrada' });
      }

      res.json({
        campaign,
        organization: org,
      });
    } catch (error) {
      console.error('Get public campaign error:', error);
      res.status(500).json({ error: 'Error al obtener la campaña' });
    }
  });

  app.post('/api/public/donations', async (req, res) => {
    try {
      const { 
        campaign_id, 
        org_id,
        donor_name, 
        donor_email, 
        amount_minor, 
        currency, 
        is_recurring, 
        is_anonymous 
      } = req.body;

      // Verify campaign exists and is active
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, org_id, is_active')
        .eq('id', campaign_id)
        .single();

      if (campaignError || !campaign || !campaign.is_active) {
        return res.status(400).json({ error: 'Campaña no válida' });
      }

      // Create donation with pending status (payment integration would complete it)
      const { data, error } = await supabase
        .from('donations')
        .insert({
          campaign_id,
          org_id: campaign.org_id,
          donor_name: is_anonymous ? null : donor_name,
          donor_email,
          amount_minor,
          currency: currency || 'COP',
          is_recurring: is_recurring || false,
          is_anonymous: is_anonymous || false,
          status: 'paid', // For MVP, mark as paid immediately
        })
        .select()
        .single();

      if (error) {
        console.error('Create donation error:', error);
        return res.status(400).json({ error: 'Error al procesar la donación' });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Create donation error:', error);
      res.status(500).json({ error: 'Error al procesar la donación' });
    }
  });

  return httpServer;
}
