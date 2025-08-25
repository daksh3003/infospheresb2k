import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
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
      console.error("Error fetching project tasks:", projectTasksError);
    }

    // Fetch task iterations
    const { data, error: iterationError } = await supabase
      .from("task_iterations")
      .select("*")
      .eq("task_id", taskId)
      .order("iteration_number", { ascending: false });

    if (iterationError) {
      console.error("Error fetching iterations:", iterationError);
    }

    // Fetch stages
    const { data: stages, error: stagesError } = await supabase
      .from("task_iterations")
      .select("stages")
      .eq("task_id", taskId)
      .single();

    console.log("stages", stages?.stages);

    if (stagesError) {
      console.error("Error fetching stages:", stagesError);
    }

    // Fetch assigned users
    const { data: assignedData, error: assignedError } = await supabase
      .from("files_test")
      .select("assigned_to")
      .eq("task_id", taskId)
      .single();

    if (assignedError && assignedError.code !== "PGRST116") {
      console.error("Error fetching assigned users:", assignedError);
    }

    // Fetch available users
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .order("name", { ascending: true });

    if (usersError) {
      console.error("Error fetching users:", usersError);
    }

    return NextResponse.json({
      task: response,
      projectTasks: projectTasks || [],
      iterations: data || [],
      stages: stages || [],
      assignedUsers: assignedData?.assigned_to || [],
      availableUsers: users || [],
    });

  } catch (error: any) {
    console.error('Task detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = await params;
    const { action, data } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'assign':
        return await handleTaskAssignment(taskId, data);
      case 'pickup':
        return await handleTaskPickup(taskId, data);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Task action error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTaskAssignment(taskId: string, selectedUserData: any) {
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

  } catch (error: any) {
    console.error('Task assignment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign task' },
      { status: 500 }
    );
  }
}

async function handleTaskPickup(taskId: string, currentUser: any) {
  try {
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create assignment entry
    const newAssignment = {
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      user_id: currentUser.id,
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

  } catch (error: any) {
    console.error('Task pickup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to pick up task' },
      { status: 500 }
    );
  }
}
