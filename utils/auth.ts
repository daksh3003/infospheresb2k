// Authentication utilities for managing user session state
import { supabase } from './supabase.js';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  role?: string;
}

export class AuthManager {
  private static instance: AuthManager;
  private currentUser: AuthUser | null = null;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  private constructor() {
    this.initAuthStateListener();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private initAuthStateListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
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
      // Get user role from profile or metadata
      let role = user.user_metadata?.role;
      
      if (!role) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

          
          role = profileData?.role;
        }
        
        this.currentUser = { ...user, role };
        
        console.log("Fetched profile data for role:", user);
      // Store role in localStorage for quick access
      if (role) {
        localStorage.setItem('userRole', role);
      }
    } else {
      this.currentUser = null;
      localStorage.removeItem('userRole');
    }

    // Notify all listeners
    this.authStateListeners.forEach(listener => listener(this.currentUser));
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public async checkAuthStatus(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
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
        // Update session with logout time
        await supabase
          .from("user_sessions")
          .update({
            logout_time: new Date().toISOString(),
          })
          .eq("user_id", currentUser.id)
          .is("logout_time", null);
      }

      await supabase.auth.signOut();
      sessionStorage.clear();
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();

// Helper functions
export const getCurrentUser = () => authManager.getCurrentUser();
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => 
  authManager.onAuthStateChange(callback);
export const checkAuthStatus = () => authManager.checkAuthStatus();
export const signOut = () => authManager.signOut();
