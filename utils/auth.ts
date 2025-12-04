// Authentication utilities for managing user session state
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  role?: string;
}

// Lazy import createClient to avoid evaluation during build
let createClientFn: (() => any) | null = null;

function getCreateClient() {
  if (!createClientFn && typeof window !== 'undefined') {
    // Dynamic import - only loads when actually called in browser
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const clientModule = require('@/lib/client');
    createClientFn = clientModule.createClient;
  }
  return createClientFn;
}

export class AuthManager {
  private static instance: AuthManager;
  private currentUser: AuthUser | null = null;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];
  private _supabase: any = null;
  
  private get supabase() {
    if (!this._supabase && typeof window !== 'undefined') {
      const createClient = getCreateClient();
      if (createClient) {
        this._supabase = createClient();
      }
    }
    return this._supabase;
  }

  private constructor() {
    // Only initialize auth listener in browser environment
    if (typeof window !== 'undefined') {
      this.initAuthStateListener();
    }
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private initAuthStateListener() {
    this.supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.setCurrentUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.setCurrentUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await this.setCurrentUser(session.user);
      }
    });
  }

  private async setCurrentUser(user: User | null) {
    if (user) {
      // Get user role from profile
      let role = user.user_metadata?.role;

      if (!role) {
        const { data: profileData } = await this.supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        role = profileData?.role;
      }

      this.currentUser = { ...user, role };

      // ❌ DO NOT store role in localStorage anymore
      // This was a security vulnerability - removed for security
    } else {
      this.currentUser = null;
    }

    // Notify all listeners
    this.authStateListeners.forEach(listener => listener(this.currentUser));
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public async checkAuthStatus(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error || !user) {
        this.setCurrentUser(null);
        return null;
      }

      await this.setCurrentUser(user);
      return this.currentUser;
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.setCurrentUser(null);
      return null;
    }
  }

  public onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.authStateListeners.push(callback);

    // Call immediately with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  public async signOut() {
    try {
      const currentUser = this.getCurrentUser();

      if (currentUser) {
        // Call logout API to update session
        await fetch('/api/auth/logout', {
          method: 'POST',
        });
      }

      await this.supabase.auth.signOut();

    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  }
}

// Export singleton instance - only create in browser
export const authManager = typeof window !== 'undefined' 
  ? AuthManager.getInstance() 
  : null as any; // Type assertion for build time

// Helper functions
export const getCurrentUser = () => authManager.getCurrentUser();
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) =>
  authManager.onAuthStateChange(callback);
export const checkAuthStatus = () => authManager.checkAuthStatus();
export const signOut = () => authManager.signOut();
