import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserOrganization } from '../supabase';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  organizationRole?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
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

  // Get user's organization
  const orgData = await getUserOrganization(user.userId);
  if (orgData) {
    req.organizationId = orgData.organizationId;
    req.organizationRole = orgData.role;
  }

  next();
}

// Optional auth - doesn't require token but extracts user info if present
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    
    if (user) {
      req.userId = user.userId;
      req.userEmail = user.email;

      const orgData = await getUserOrganization(user.userId);
      if (orgData) {
        req.organizationId = orgData.organizationId;
        req.organizationRole = orgData.role;
      }
    }
  }

  next();
}
