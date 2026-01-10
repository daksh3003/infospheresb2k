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
          assigned_to_processor_user_id,
          assigned_to_qc_user_id,
          assigned_to_qa_user_id
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
    const iterations = task.task_iterations;
    if (!iterations || !Array.isArray(iterations) || iterations.length === 0) return false;

    // Get the latest iteration (or first if only one)
    const iteration = iterations[0];

    const assignedUsers = [
      iteration.assigned_to_processor_user_id,
      iteration.assigned_to_qc_user_id,
      iteration.assigned_to_qa_user_id
    ].filter(Boolean); // Filter out null/undefined values

    return assignedUsers.includes(userId);
  }

  /**
   * Check if user can modify a task
   */
  static async canModifyTask(userId: string, taskId: string): Promise<boolean> {
    const supabase = await createClient();



    const { data: task, error: taskError } = await supabase
      .from('tasks_test')
      .select(`
        task_id,
        task_iterations (
          current_stage,
          assigned_to_processor_user_id,
          assigned_to_qc_user_id,
          assigned_to_qa_user_id
        )
      `)
      .eq('task_id', taskId)
      .single();

    if (taskError || !task) {

      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {

      return false;
    }



    // PMs can always modify
    if (profile?.role === 'projectManager') {

      return true;
    }

    const iterations = task.task_iterations;
    if (!iterations || !Array.isArray(iterations) || iterations.length === 0) {

      // Allow modification if no iterations exist yet (task is being set up)
      return true;
    }

    // Get the latest iteration (or first if only one)
    const iteration = iterations[0];


    // Check if user is assigned to ANY stage (not just current stage)
    // This allows assigned users to modify task details
    const assignedUsers = [
      iteration.assigned_to_processor_user_id,
      iteration.assigned_to_qc_user_id,
      iteration.assigned_to_qa_user_id
    ].filter(Boolean);

    const isAssignedToTask = assignedUsers.includes(userId);



    return isAssignedToTask;
  }

  /**
   * Check if user can access a file
   */
  static async canAccessFile(userId: string, fileId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: file } = await supabase
      .from('files_test')
      .select('task_id')
      .eq('file_id', fileId)
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
          assigned_to_processor_user_id,
          assigned_to_qc_user_id,
          assigned_to_qa_user_id
        )
      `)
      .eq('task_id', taskId)
      .single();

    if (!task) return false;

    const iterations = task.task_iterations;
    if (!iterations || !Array.isArray(iterations) || iterations.length === 0) return false;

    // Get the latest iteration (or first if only one)
    const iteration = iterations[0];

    // Check if user is assigned to the stage they're uploading to
    const stageAssignments: Record<string, string> = {
      'processor': iteration.assigned_to_processor_user_id,
      'qc': iteration.assigned_to_qc_user_id,
      'qa': iteration.assigned_to_qa_user_id
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
