import { createClient } from '@/lib/server';

export class AuthorizationService {
  /**
   * Check if user can access a specific task
   */
  static async canAccessTask(userId: string, taskId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: task } = await supabase
      .from('tasks_test')
      .select(`
        task_id,
        task_iterations (
          assigned_processor,
          assigned_qc,
          assigned_qa
        )
      `)
      .eq('task_id', taskId)
      .single();

    if (!task) return false;

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    // Project Managers can access all tasks
    if (profile?.role === 'projectManager') return true;

    // Check if user is assigned to this task
    const iteration = task.task_iterations;
    if (!iteration) return false;

    const assignedUsers = [
      iteration.assigned_processor,
      iteration.assigned_qc,
      iteration.assigned_qa
    ];

    return assignedUsers.includes(userId);
  }

  /**
   * Check if user can modify a task
   */
  static async canModifyTask(userId: string, taskId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: task } = await supabase
      .from('tasks_test')
      .select(`
        task_id,
        task_iterations (
          current_stage,
          assigned_processor,
          assigned_qc,
          assigned_qa
        )
      `)
      .eq('task_id', taskId)
      .single();

    if (!task) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    // PMs can always modify
    if (profile?.role === 'projectManager') return true;

    const iteration = task.task_iterations;
    if (!iteration) return false;

    // Check if user is assigned to current stage
    const stageAssignments: Record<string, string> = {
      'processor': iteration.assigned_processor,
      'qc': iteration.assigned_qc,
      'qa': iteration.assigned_qa
    };

    const currentStageAssignment = stageAssignments[iteration.current_stage.toLowerCase()];
    return currentStageAssignment === userId;
  }

  /**
   * Check if user can access a file
   */
  static async canAccessFile(userId: string, fileId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: file } = await supabase
      .from('files_test')
      .select('task_id')
      .eq('id', fileId)
      .single();

    if (!file) return false;

    return this.canAccessTask(userId, file.task_id);
  }

  /**
   * Check if user can upload files for a task/stage
   */
  static async canUploadFile(userId: string, taskId: string, stage: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    // PM can upload to any stage
    if (profile?.role === 'projectManager') return true;

    const { data: task } = await supabase
      .from('tasks_test')
      .select(`
        task_iterations (
          current_stage,
          assigned_processor,
          assigned_qc,
          assigned_qa
        )
      `)
      .eq('task_id', taskId)
      .single();

    if (!task) return false;

    const iteration = task.task_iterations;
    if (!iteration) return false;

    // Check if user is assigned to the stage they're uploading to
    const stageAssignments: Record<string, string> = {
      'processor': iteration.assigned_processor,
      'qc': iteration.assigned_qc,
      'qa': iteration.assigned_qa
    };

    return stageAssignments[stage.toLowerCase()] === userId;
  }

  /**
   * Check if user can create projects
   */
  static async canCreateProject(userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    // Only PMs can create projects
    return profile?.role === 'projectManager';
  }
}
