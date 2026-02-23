import { AuthRepository } from '../server/repository/auth.repository';
import { AuthError } from './errors';

export interface SessionUser {
  userId: string;
  roleId: string;
  role: string;
  schoolId: string | null;
  email: string;
  firstName: string;
  lastName: string;
}

export async function getSession(req: Request): Promise<SessionUser | null> {
  try {
    // Extract sessionId from request cookies or headers
    const sessionId = extractSessionId(req);
    
    if (!sessionId) {
      return null;
    }

    // Find session in database
    const session = await AuthRepository.findSessionBySessionId(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await AuthRepository.deleteSession(sessionId);
      return null;
    }

    // Get full user details with role and school
    const user = await AuthRepository.findUserById(session.userId);
    
    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      roleId: user.roleId,
      role: user.role.name,
      schoolId: user.schoolId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Helper to extract session ID from request
function extractSessionId(req: Request): string | null {
  // Try to get from cookies first (for API routes)
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const sessionId = cookieHeader
      .split('; ')
      .find(row => row.startsWith('sessionId='))
      ?.split('=')[1];
    if (sessionId) return sessionId;
  }

  // Try to get from authorization header (fallback)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  return null;
}

export async function requireRole(req: Request, requiredRole: string): Promise<SessionUser> {
  const session = await getSession(req);
  
  if (!session) {
    throw new AuthError('No session found', 401);
  }

  if (session.role !== requiredRole) {
    throw new AuthError(`Access denied. ${requiredRole} role required.`, 403);
  }

  return session;
}

export async function requirePermission(req: Request, permission: string): Promise<SessionUser> {
  const session = await getSession(req);
  
  if (!session) {
    throw new AuthError('No session found', 401);
  }

  // Super admins have all permissions
  if (session.role === 'SUPERADMIN') {
    return session;
  }
  
  // Check if user has the required permission
  const hasPermission = await AuthRepository.userHasPermission(session.userId, permission);
  
  if (!hasPermission) {
    throw new AuthError(`Access denied. Permission '${permission}' required.`, 403);
  }

  return session;
}
