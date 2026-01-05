import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

// Type definitions
interface TaskActionMetadata {
  assignment_stage?: string;
  stage?: string;
  assigned_to_user_name?: string;
  assigned_to_user_email?: string;
  user_name?: string;
  user_email?: string;
  [key: string]: unknown;
}

interface TaskAction {
  action_type: "assigned_to" | "taken_by";
  user_id: string;
  metadata: TaskActionMetadata | null;
  created_at: string;
}

interface Assignment {
  name?: string;
  user_name?: string;
  email?: string;
  user_email?: string;
  role?: string;
  user_role?: string;
  assigned_at?: string;
}

/**
 * GET - Fetch the current worker assigned to a task
 * Returns the user assigned to the task based on the current stage
 * Fetches from task_actions table (assigned_to or taken_by actions)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const supabase = await createClient();

    // First, get the current stage from task_iterations
    const { data: iteration, error: iterationError } = await supabase
      .from("task_iterations")
      .select("current_stage")
      .eq("task_id", taskId)
      .single();

    if (iterationError || !iteration) {
      return NextResponse.json({ 
        data: null,
        message: "No task iteration found"
      });
    }

    const currentStage = iteration.current_stage;

    // Get assignments from task_actions - check both 'assigned_to' and 'taken_by' actions
    const { data: actions, error: actionsError } = await supabase
      .from("task_actions")
      .select("action_type, user_id, metadata, created_at")
      .eq("task_id", taskId)
      .in("action_type", ["assigned_to", "taken_by"])
      .order("created_at", { ascending: false });

    if (actionsError) {
      console.error("Error fetching task actions:", actionsError);
      // Fallback to files_test
      return getFromFilesTest(supabase, taskId, currentStage);
    }

    if (!actions || actions.length === 0) {
      // Fallback to files_test if no task_actions found
      return getFromFilesTest(supabase, taskId, currentStage);
    }

    // Filter actions by current stage
    // For 'assigned_to': check metadata.assignment_stage
    // For 'taken_by': check metadata.stage
    const stageActions = actions.filter((action: TaskAction) => {
      if (action.action_type === "assigned_to") {
        const assignmentStage = action.metadata?.assignment_stage;
        return assignmentStage === currentStage;
      } else if (action.action_type === "taken_by") {
        const takenStage = action.metadata?.stage;
        return takenStage === currentStage;
      }
      return false;
    });

    // If no action for current stage, use the most recent action
    const actionToUse = stageActions.length > 0 ? stageActions[0] : actions[0];

    if (!actionToUse) {
      return NextResponse.json({ 
        data: null,
        message: "No assignment found for this task"
      });
    }

    // Extract user information from metadata
    const metadata = actionToUse.metadata || {};
    
    // For 'assigned_to' actions
    if (actionToUse.action_type === "assigned_to") {
      const userName = metadata.assigned_to_user_name || 
                       metadata.user_name || 
                       metadata.assigned_to_user_email ||
                       "Unknown";
      const userEmail = metadata.assigned_to_user_email || 
                        metadata.user_email || 
                        null;

      return NextResponse.json({ 
        data: {
          name: userName,
          email: userEmail,
        }
      });
    }

    // For 'taken_by' actions
    if (actionToUse.action_type === "taken_by") {
      const userName = metadata.user_name || 
                       metadata.user_email ||
                       "Unknown";
      const userEmail = metadata.user_email || null;

      return NextResponse.json({ 
        data: {
          name: userName,
          email: userEmail,
        }
      });
    }

    // If metadata doesn't have user info, fetch from profiles table
    const userId = actionToUse.user_id;
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", userId)
        .single();

      if (!profileError && profile) {
        return NextResponse.json({ 
          data: {
            name: profile.name || profile.email || "Unknown",
            email: profile.email || null,
          }
        });
      }
    }

    // Final fallback to files_test
    return getFromFilesTest(supabase, taskId, currentStage);
  } catch (error) {
    console.error("Error fetching current worker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fallback function to get assignment from files_test
async function getFromFilesTest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  currentStage: string
) {
  try {
    // Map current stage to expected role
    const stageToRoleMap: Record<string, string> = {
      "Processor": "processor",
      "QC": "qcTeam",
      "QA": "qaTeam",
    };

    const expectedRole = stageToRoleMap[currentStage] || null;

    const { data: fileData, error: fileError } = await supabase
      .from("files_test")
      .select("assigned_to")
      .eq("task_id", taskId)
      .limit(1)
      .single();

    if (fileError || !fileData) {
      return NextResponse.json({ 
        data: null,
        message: "No assignment found for this task"
      });
    }

    const assignedTo = fileData.assigned_to;
    
    if (!assignedTo || !Array.isArray(assignedTo) || assignedTo.length === 0) {
      return NextResponse.json({ 
        data: null,
        message: "No users assigned to this task"
      });
    }

    // Filter valid assignments
    const validAssignments = (assignedTo as Assignment[]).filter(
      (a: Assignment) => a && typeof a === "object"
    );
    
    if (validAssignments.length === 0) {
      return NextResponse.json({ 
        data: null,
        message: "No valid assignments found"
      });
    }

    // Filter by role matching current stage
    let stageAssignments = validAssignments;
    
    if (expectedRole) {
      stageAssignments = validAssignments.filter((a: Assignment) => {
        const assignmentRole = a.role || a.user_role || "";
        return assignmentRole.toLowerCase() === expectedRole.toLowerCase();
      });
    }

    // If no assignment for current stage, use all assignments
    const assignmentsToUse = stageAssignments.length > 0 ? stageAssignments : validAssignments;

    // Sort by assigned_at (most recent first)
    const sortedAssignments = assignmentsToUse.sort((a: Assignment, b: Assignment) => {
      const dateA = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
      const dateB = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
      return dateB - dateA;
    });

    const mostRecentAssignment = sortedAssignments[0];

    // Extract user information
    const userName = mostRecentAssignment.name || 
                     mostRecentAssignment.user_name || 
                     mostRecentAssignment.email ||
                     mostRecentAssignment.user_email || 
                     "Unknown";
    const userEmail = mostRecentAssignment.email || 
                      mostRecentAssignment.user_email || 
                      null;

    return NextResponse.json({ 
      data: {
        name: userName,
        email: userEmail,
      }
    });
  } catch (error) {
    console.error("Error in getFromFilesTest:", error);
    return NextResponse.json({ 
      data: null,
      message: "Error fetching assignment"
    });
  }
}

