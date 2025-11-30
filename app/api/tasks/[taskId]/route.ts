import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/app/api/middleware/auth';
import { AuthorizationService } from '@/app/api/middleware/authorization';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const authenticatedUser = authResult;

    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Check if user can access this task
    const canAccess = await AuthorizationService.canAccessTask(authenticatedUser.id, taskId);
    if (!canAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to access this task' },
        { status: 403 }
      );
    }

    // Fetch task data
    const { data: response, error: error } = await supabase
      .from("tasks_test")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Fetch project data
    const { data: projectTasks, error: projectTasksError } = await supabase
      .from("tasks_test")
      .select("*")
      .eq("project_id", response.project_id);

    if (projectTasksError) {
      // Error fetching project tasks - non-critical
    }

    // Fetch task iterations
    const { data, error: iterationError } = await supabase
      .from("task_iterations")
      .select("*")
      .eq("task_id", taskId)
      .order("iteration_number", { ascending: false });

    if (iterationError) {
      // Error fetching iterations - non-critical
    }

    // Fetch stages
    const { data: stages, error: stagesError } = await supabase
      .from("task_iterations")
      .select("stages")
      .eq("task_id", taskId)
      .single();

    if (stagesError) {
      // Error fetching stages - non-critical
    }

    // Fetch assigned users
    const { data: assignedData, error: assignedError } = await supabase
      .from("files_test")
      .select("assigned_to")
      .eq("task_id", taskId)
      .single();

    if (assignedError && assignedError.code !== "PGRST116") {
      // Error fetching assigned users - non-critical
    }

    // Fetch available users
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .order("name", { ascending: true });

    if (usersError) {
      // Error fetching users - non-critical
    }

    return NextResponse.json({
      task: response,
      projectTasks: projectTasks || [],
      iterations: data || [],
      stages: stages || [],
      assignedUsers: assignedData?.assigned_to || [],
      availableUsers: users || [],
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const authenticatedUser = authResult;

    const { taskId } = await params;
    const { action, data } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Check if user can modify this task
    const canModify = await AuthorizationService.canModifyTask(authenticatedUser.id, taskId);
    if (!canModify) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this task' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'assign':
        return await handleTaskAssignment(taskId, data, authenticatedUser);
      case 'pickup':
        return await handleTaskPickup(taskId, authenticatedUser);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTaskAssignment(taskId: string, selectedUserData: { id: string; name: string; email: string }) {
  try {
    if (!selectedUserData) {
      return NextResponse.json(
        { error: 'User data is required' },
        { status: 400 }
      );
    }

    const assignedToArray = Array.isArray(selectedUserData) ? selectedUserData : [selectedUserData];

    const logData = {
      task_id: taskId,
      assigned_to: assignedToArray,
    };

    // Check if record exists
    const { data: existingLog, error: checkError } = await supabase
      .from("files_test")
      .select("assigned_to")
      .eq("task_id", taskId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingLog) {
      const { error: updateError } = await supabase
        .from("files_test")
        .update({ assigned_to: logData.assigned_to })
        .eq("task_id", taskId);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("files_test")
        .insert(logData);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ message: 'Task assigned successfully' });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}

async function handleTaskPickup(taskId: string, authenticatedUser: {
  role: string; id: string; email: string 
}) {
  try {
    const now = new Date().toISOString();

    // Create assignment entry
    const newAssignment = {
      name: authenticatedUser.email, // Using email as name fallback
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      user_id: authenticatedUser.id,
      assigned_at: now,
    };

    const logData = {
      task_id: taskId,
      assigned_to: [newAssignment],
    };

    // Check if record exists
    const { data: existingLog, error: fetchError } = await supabase
      .from("files_test")
      .select("assigned_to")
      .eq("task_id", taskId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (existingLog) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("files_test")
        .update({ assigned_to: logData.assigned_to })
        .eq("task_id", taskId);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("files_test")
        .insert(logData);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ message: 'Task picked up successfully' });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to pick up task' },
      { status: 500 }
    );
  }
}
