import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../supabase';
import { supabase } from '../supabase';
import type { InternalAdmin } from '@shared/schema';

export interface InternalAuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  internalAdmin?: InternalAdmin;
}

export async function internalAuthMiddleware(
  req: InternalAuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = authHeader.split(' ')[1];
  const user = await verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  req.userId = user.userId;
  req.userEmail = user.email;

  let { data: admin, error } = await supabase
    .from('internal_admins')
    .select('*')
    .eq('user_id', user.userId)
    .eq('status', 'ACTIVE')
    .single();

  if (error || !admin) {
    const { data: adminByEmail, error: emailError } = await supabase
      .from('internal_admins')
      .select('*')
      .eq('email', user.email)
      .eq('status', 'ACTIVE')
      .single();

    if (emailError || !adminByEmail) {
      return res.status(403).json({ error: 'No tienes acceso al panel interno' });
    }

    if (!adminByEmail.user_id) {
      await supabase
        .from('internal_admins')
        .update({ user_id: user.userId })
        .eq('id', adminByEmail.id);
    }

    admin = adminByEmail;
  }

  req.internalAdmin = admin as InternalAdmin;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: InternalAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.internalAdmin) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    if (!roles.includes(req.internalAdmin.role)) {
      return res.status(403).json({ error: 'No tienes permisos suficientes para esta acción' });
    }
    next();
  };
}
