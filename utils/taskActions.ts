// Utility functions for task action logging

export interface TaskActionPayload {
  user_id: string;
  task_id: string;
  action_type: 'start' | 'pause' | 'resume' | 'complete' | 'send_to' | 'download' | 'upload' | 'taken_by' | 'assigned_to' | 'handover';
  metadata?: Record<string, any>;
}

export interface TaskActionResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * Log a task action to the database via API
 */
export async function logTaskAction(payload: TaskActionPayload): Promise<TaskActionResponse> {
  try {
    const response = await fetch('/api/task-actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.details || result.error || 'Failed to log task action');
    }

    return result;
  } catch (error) {
    console.error('Error logging task action:', error);
    return {
      success: false,
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get task actions from the database via API
 */
export async function getTaskActions(filters?: {
  task_id?: string;
  user_id?: string;
  action_type?: string | string[];
  limit?: number;
}): Promise<TaskActionResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.task_id) params.append('task_id', filters.task_id);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.action_type) {
      // Handle both string and array of action types
      const actionTypeParam = Array.isArray(filters.action_type) 
        ? filters.action_type.join(',') 
        : filters.action_type;
      params.append('action_type', actionTypeParam);
    }
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/task-actions?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.details || result.error || 'Failed to fetch task actions');
    }

    return result;
  } catch (error) {
    console.error('Error fetching task actions:', error);
    return {
      success: false,
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a standardized metadata object for task actions
 */
export function createTaskActionMetadata(
  user: any,
  taskId: string,
  currentStage: string,
  sentBy: string,
  additionalMetadata?: Record<string, any>
): Record<string, any> {
  return {
    user_name: user.name || user.full_name,
    user_email: user.email,
    user_role: user.role,
    task_id: taskId,
    current_stage: currentStage,
    sent_by: sentBy,
    timestamp: new Date().toISOString(),
    ...additionalMetadata
  };
}
