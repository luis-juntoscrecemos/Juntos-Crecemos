import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserOrganization, getDonorAccount } from '../supabase';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  organizationRole?: string;
  donorAccountId?: string;
  isDonor?: boolean;
  isOrgUser?: boolean;
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

  // Get user's organization (org admin account)
  const orgData = await getUserOrganization(user.userId);
  if (orgData) {
    req.organizationId = orgData.organizationId;
    req.organizationRole = orgData.role;
    req.isOrgUser = true;
  }

  // Get user's donor account
  const donorData = await getDonorAccount(user.userId);
  if (donorData) {
    req.donorAccountId = donorData.id;
    req.isDonor = true;
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
        req.isOrgUser = true;
      }

      const donorData = await getDonorAccount(user.userId);
      if (donorData) {
        req.donorAccountId = donorData.id;
        req.isDonor = true;
      }
    }
  }

  next();
}

// Donor-only middleware - requires authenticated donor account
export async function donorAuthMiddleware(
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

  // Get donor account
  const donorData = await getDonorAccount(user.userId);
  if (!donorData) {
    return res.status(403).json({ error: 'No tienes una cuenta de donante' });
  }

  req.donorAccountId = donorData.id;
  req.isDonor = true;

  next();
}
