// Custom Session Types and Implementation
export interface CustomTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
}

export interface CustomSession {
  tokens: CustomTokens | null;
  userSub?: string;
  isValid: boolean;
  expiresAt?: number;
  credentials?: any; // For AWS-like compatibility
}

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: CustomSession | null = null;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create a custom session (replaces fetchAuthSession)
   */
  async fetchAuthSession(): Promise<CustomSession> {
    try {
      // Try to get existing session from storage
      const storedSession = this.getStoredSession();
      
      if (storedSession && this.isSessionValid(storedSession)) {
        this.currentSession = storedSession;
        return storedSession;
      }

      // If no valid stored session, try to refresh or create new one
      if (storedSession?.tokens?.refreshToken) {
        const refreshedSession = await this.refreshSession(storedSession.tokens.refreshToken);
        if (refreshedSession) {
          this.currentSession = refreshedSession;
          this.storeSession(refreshedSession);
          return refreshedSession;
        }
      }

      // Return empty session if no authentication found
      return {
        tokens: null,
        isValid: false
      };

    } catch (error) {
      console.error('Error fetching auth session:', error);
      return {
        tokens: null,
        isValid: false
      };
    }
  }

  /**
   * Create a session with custom tokens
   */
  createSessionWithTokens(tokens: CustomTokens, userSub?: string, expiresIn?: number): CustomSession {
    const expiresAt = expiresIn ? Date.now() + (expiresIn * 1000) : Date.now() + (24 * 60 * 60 * 1000); // Default 24 hours
    
    const session: CustomSession = {
      tokens,
      userSub,
      isValid: true,
      expiresAt,
      credentials: {
        accessKeyId: 'mock-access-key',
        secretAccessKey: 'mock-secret-key',
        sessionToken: tokens.accessToken
      }
    };

    this.currentSession = session;
    this.storeSession(session);
    return session;
  }

  /**
   * Create a mock session for development/testing
   */
  createMockSession(userData?: { userId?: string; email?: string; role?: string }): CustomSession {
    console.log("Creating mock session for user:", userData);
    
    const mockTokens: CustomTokens = {
      accessToken: this.generateMockJWT({
        sub: userData?.userId || 'mock-user-id',
        email: userData?.email || 'test@example.com',
        role: userData?.role || 'user',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      idToken: this.generateMockJWT({
        sub: userData?.userId || 'mock-user-id',
        email: userData?.email || 'test@example.com',
        name: 'Test User'
      })
    };

    return this.createSessionWithTokens(mockTokens, userData?.userId || 'mock-user-id');
  }

  /**
   * Login with email/password and create session
   */
  async loginWithCredentials(email: string, password: string): Promise<CustomSession> {
    try {
      // Replace this with your actual authentication API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const authData = await response.json();
      
      const tokens: CustomTokens = {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        idToken: authData.idToken
      };

      return this.createSessionWithTokens(tokens, authData.userId, authData.expiresIn);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Login with external token
   */
  async loginWithToken(token: string): Promise<CustomSession> {
    try {
      // Validate token with your backend
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      const validationData = await response.json();
      
      const tokens: CustomTokens = {
        accessToken: token,
        refreshToken: validationData.refreshToken
      };

      return this.createSessionWithTokens(tokens, validationData.userId, validationData.expiresIn);
      
    } catch (error) {
      console.error('Token login error:', error);
      throw error;
    }
  }

  /**
   * Refresh session using refresh token
   */
  private async refreshSession(refreshToken: string): Promise<CustomSession | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        return null;
      }

      const refreshData = await response.json();
      
      const tokens: CustomTokens = {
        accessToken: refreshData.accessToken,
        refreshToken: refreshData.refreshToken || refreshToken,
        idToken: refreshData.idToken
      };

      return this.createSessionWithTokens(tokens, refreshData.userId, refreshData.expiresIn);
      
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Check if session is valid
   */
  private isSessionValid(session: CustomSession): boolean {
    if (!session.tokens?.accessToken) {
      return false;
    }

    if (session.expiresAt && session.expiresAt < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Store session in localStorage
   */
  private storeSession(session: CustomSession): void {
    try {
      localStorage.setItem('customAuthSession', JSON.stringify(session));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  /**
   * Get stored session from localStorage
   */
  private getStoredSession(): CustomSession | null {
    try {
      const stored = localStorage.getItem('customAuthSession');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  }

  /**
   * Generate a mock JWT token (for development only)
   */
  private generateMockJWT(payload: any): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';
    console.log("Generated mock JWT:", `${encodedHeader}.${encodedPayload}.${signature}`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Clear current session (logout)
   */
  clearSession(): void {
    this.currentSession = null;
    localStorage.removeItem('customAuthSession');
  }

  /**
   * Get current session
   */
  getCurrentSession(): CustomSession | null {
    return this.currentSession;
  }
}

// Utility function to replace AWS fetchAuthSession
export async function fetchAuthSession(): Promise<CustomSession> {
  const sessionManager = SessionManager.getInstance();
  return await sessionManager.fetchAuthSession();
}

// Utility function to replace AWS getCurrentUser
export async function getCurrentUser(): Promise<any> {
  const sessionManager = SessionManager.getInstance();
  const session = await sessionManager.fetchAuthSession();
  
  if (!session.tokens?.accessToken) {
    throw new Error('No current user');
  }

  // Decode JWT to get user info (in production, validate with backend)
  try {
    const payload = JSON.parse(atob(session.tokens.accessToken.split('.')[1]));
    return {
      userId: payload.sub,
      username: payload.email || payload.username,
      attributes: {
        email: payload.email,
        name: payload.name,
        role: payload.role
      }
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Utility function to replace AWS signInWithRedirect
export function signInWithRedirect(): void {
  // Store current URL for redirect after login
  const currentUrl = window.location.pathname + window.location.search;
  localStorage.setItem('redirectURL', currentUrl);
  
  // Redirect to your custom login page
  window.location.href = '/404';
}