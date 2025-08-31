// API utility functions to replace direct Supabase calls
import { supabase } from "./supabase";

export const api = {
  // Authentication
  login: async (email: string, password: string) => {
    // Import supabase here to avoid circular dependency
    
    
    // Authenticate directly with Supabase client to establish session
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || !data.user) {
      throw new Error('Authentication failed. Please try again.');
    }

    // Get user role from profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    const userRole = profileData?.role || data.user.user_metadata?.role;

    // Create session record on server via API call
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: data.user.id,
          sessionOnly: true // Flag to indicate we only want session tracking
        }),
      });
    } catch (sessionError) {
      console.error('Error tracking session:', sessionError);
      // Continue even if session tracking fails
    }

    return {
      user: data.user,
      session: data.session,
      role: userRole,
    };
  },

  signup: async (email: string, password: string, name: string, role: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, role }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    
    return response.json();
  },

  // Dashboard data
  getPMDashboard: async () => {
    const response = await fetch('/api/dashboard/pm');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch PM dashboard data');
    }
    
    return response.json();
  },

  getProcessorDashboard: async () => {
    const response = await fetch('/api/dashboard/processor');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch processor dashboard data');
    }
    
    return response.json();
  },

  getQCDashboard: async () => {
    const response = await fetch('/api/dashboard/qc');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch QC dashboard data');
    }
    
    return response.json();
  },

  // Task operations
  getTaskDetails: async (taskId: string) => {
    const response = await fetch(`/api/tasks/${taskId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch task details');
    }

    
    
    return response.json();
  },

  assignTask: async (taskId: string, selectedUserData: any) => {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'assign', data: selectedUserData }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to assign task');
    }
    
    return response.json();
  },

  pickupTask: async (taskId: string, currentUser: any) => {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'pickup', data: currentUser }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to pick up task');
    }
    
    return response.json();
  },

  // Project operations
  createProject: async (projectData: any, fileGroups: any[], selectedFiles: any[], currentUser: any) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectData, fileGroups, selectedFiles, currentUser }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }
    
    return response.json();
  },

  // File operations
  getFiles: async (taskId: string, stage?: string) => {
    const params = new URLSearchParams({ taskId });
    if (stage) params.append('stage', stage);
    
    const response = await fetch(`/api/files?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch files');
    }
    
    return response.json();
  },

  uploadFile: async (taskId: string, file: File, stage: string, currentUser: any) => {
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId, file, stage, currentUser }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }
    
    return response.json();
  },

  // Download history
  getDownloadHistory: async (taskId: string) => {
    const response = await fetch(`/api/downloads/history?taskId=${taskId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch download history');
    }
    
    return response.json();
  },

  trackDownload: async (taskId: string, fileId: string, fileName: string, storageName: string, folderPath: string, downloadDetails: any) => {
    const response = await fetch('/api/downloads/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId, fileId, fileName, storageName, folderPath, downloadDetails }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to track download');
    }
    
    return response.json();
  },

  // Get available users for assignment
  getAvailableUsers: async (stage: string) => {
    const response = await fetch(`/api/users/available?stage=${stage}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch available users');
    }
    return response.json();
  },

  // Get task timeline
  getTaskTimeline: async (taskId: string) => {
    const response = await fetch(`/api/tasks/${taskId}/timeline`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch task timeline');
    }
    return response.json();
  },

  // Get QA dashboard
  getQADashboard: async () => {
    const response = await fetch('/api/dashboard/qa');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch QA dashboard');
    }
    return response.json();
  },

  // Get project names
  getProjectNames: async (projectIds: string[]) => {
    const response = await fetch('/api/projects/names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectIds })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch project names');
    }
    return response.json();
  },

};
