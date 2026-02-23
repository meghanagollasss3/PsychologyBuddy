import { nanoid } from "nanoid";
import { SessionUtil } from "./session-server.util";

// ===========================================
// CLIENT-SIDE SESSION HELPERS
// ===========================================

// Get session ID for API requests (client-side)
export function getClientSessionId() {
  if (typeof window === 'undefined') return null;
  
  const sessionId = document.cookie
    .split('; ')
    .find(row => row.startsWith('sessionId='))
    ?.split('=')[1];
    
  return sessionId || null;
}

// Get auth headers for API requests
export function getAuthHeaders(): Record<string, string> {
  const sessionId = getClientSessionId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (sessionId) {
    headers['Authorization'] = `Bearer ${sessionId}`;
  }
  
  return headers;
}

// Check if user is authenticated (client-side) - simplified version
export function isClientAuthenticated() {
  const sessionId = getClientSessionId();
  return !!sessionId;
}

// ===========================================
// SERVER-SIDE SESSION HELPERS (Server Components only)
// ===========================================

// Create session (server-side)
export async function createSession(userId: string, roleId: string) {
  const sessionId = nanoid();
  const sessionData = {
    userId,
    roleId,
    createdAt: new Date(),
    expiresAt: SessionUtil.getExpirationTime()
  };

  // Store in memory (replace with Redis in production)
  sessionStore.set(sessionId, sessionData);

  // Set cookie
  const cookieString = `sessionId=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL / 1000}`;
  
  return {
    sessionId,
    cookie: cookieString,
    sessionData
  };
}

// Get session from cookies (server-side)
export async function getServerSession() {
  try {
    // Dynamic import to avoid client-side errors
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sessionId')?.value;
    
    if (!sessionId) return null;
    
    const session = sessionStore.get(sessionId);
    if (!session) return null;
    
    if (SessionUtil.isExpired(session.expiresAt)) {
      sessionStore.delete(sessionId);
      await cookieStore.delete('sessionId');
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

// Delete session (server-side)
export async function deleteSession(sessionId: string) {
  sessionStore.delete(sessionId);
  
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    await cookieStore.delete('sessionId');
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}
