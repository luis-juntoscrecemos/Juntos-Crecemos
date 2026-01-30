import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./supabase";
import { authMiddleware, optionalAuthMiddleware, type AuthenticatedRequest } from "./middleware/auth";
import multer, { FileFilterCallback } from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes PNG, JPG o WebP'));
    }
  },
});

// Extend Request to include file from multer
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Helper to generate slug from organization name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

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
  // Organization Registration (Auth + Org Creation)
  // ============================================
  app.post('/api/auth/register-org', upload.single('logo'), async (req: RequestWithFile, res) => {
    try {
      const { orgName, email, password, website } = req.body;
      const logoFile = req.file;

      // Server-side validation
      if (!orgName || typeof orgName !== 'string' || orgName.trim().length < 2) {
        return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Correo electrónico inválido' });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Validate website URL format if provided
      if (website && typeof website === 'string' && website.trim()) {
        try {
          new URL(website);
        } catch {
          return res.status(400).json({ error: 'URL del sitio web inválida' });
        }
      }

      // Step A: Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true, // Skip email verification for development
      });

      if (authError || !authData.user) {
        console.error('Auth signup error:', authError);
        if (authError?.message?.includes('already registered')) {
          return res.status(400).json({ error: 'Este correo ya está registrado' });
        }
        return res.status(400).json({ error: 'Error al crear cuenta. Intenta nuevamente.' });
      }

      const userId = authData.user.id;

      // Step B: Generate unique slug
      let baseSlug = generateSlug(orgName.trim());
      if (!baseSlug) baseSlug = 'org'; // Fallback if name only has special chars
      let slug = baseSlug;
      let slugSuffix = 1;

      // Check for slug uniqueness using count instead of single()
      while (slugSuffix < 100) { // Safety limit
        const { count, error: slugCheckError } = await supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('slug', slug);
        
        if (slugCheckError) {
          console.error('Slug check error:', slugCheckError);
          // Continue with current slug, let DB constraint catch it
          break;
        }
        
        if (!count || count === 0) break;
        slug = `${baseSlug}-${slugSuffix}`;
        slugSuffix++;
      }

      // Step C: Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          email: email.trim().toLowerCase(),
          website: website?.trim() || null,
          slug,
          status: 'active',
          verified: false,
          country: 'Colombia', // Default
          city: 'Bogotá', // Default
        })
        .select()
        .single();

      if (orgError || !org) {
        console.error('Create org error:', orgError);
        // Rollback: delete auth user
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({ error: 'Error al crear la organización. Intenta nuevamente.' });
      }

      // Step D: Link user to organization via organization_users
      const { error: linkError } = await supabase
        .from('organization_users')
        .insert({
          organization_id: org.id,
          user_id: userId,
          role: 'admin',
        });

      if (linkError) {
        console.error('Link user to org error:', linkError);
        // Critical error - rollback both org and auth user
        await supabase.from('organizations').delete().eq('id', org.id);
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({ error: 'Error al configurar la cuenta. Intenta nuevamente.' });
      }

      // Step E: Upload logo if provided (non-critical, don't rollback on failure)
      let logoUrl = null;
      if (logoFile) {
        try {
          const fileExt = logoFile.originalname.split('.').pop() || 'png';
          const filePath = `${org.id}/logo.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('org-logos')
            .upload(filePath, logoFile.buffer, {
              contentType: logoFile.mimetype,
              upsert: true,
            });

          if (!uploadError) {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('org-logos')
              .getPublicUrl(filePath);
            
            logoUrl = urlData.publicUrl;

            // Update org with logo_url
            await supabase
              .from('organizations')
              .update({ logo_url: logoUrl })
              .eq('id', org.id);
          } else {
            console.error('Logo upload error:', uploadError);
            // Continue without logo - not critical
          }
        } catch (logoError) {
          console.error('Logo processing error:', logoError);
          // Continue without logo
        }
      }

      res.status(201).json({
        message: 'Organización registrada exitosamente',
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo_url: logoUrl,
        },
      });
    } catch (error: any) {
      console.error('Register org error:', error);
      res.status(500).json({ error: 'Error al registrar la organización. Intenta nuevamente.' });
    }
  });
  
  // ============================================
  // Dashboard Stats
  // ============================================
  app.get('/api/dashboard/stats', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.organizationId) {
        return res.json({
          data: {
            totalDonations: 0,
            totalRaised: 0,
            activeCampaigns: 0,
            totalDonors: 0,
          },
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
        data: {
          totalDonations,
          totalRaised: totalRaised / 100, // Convert from minor units
          activeCampaigns: activeCampaigns || 0,
          totalDonors: uniqueEmails.size,
        },
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

      res.json({ data });
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

      res.json({ data });
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
        return res.json({ data: [] });
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

      res.json({ data: data || [] });
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

      res.json({ data });
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

      res.status(201).json({ data });
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

      res.json({ data });
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
        return res.json({ data: [] });
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

      res.json({ data: data || [] });
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
        data: {
          campaign,
          organization: org,
        },
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

      res.status(201).json({ data });
    } catch (error) {
      console.error('Create donation error:', error);
      res.status(500).json({ error: 'Error al procesar la donación' });
    }
  });

  return httpServer;
}
