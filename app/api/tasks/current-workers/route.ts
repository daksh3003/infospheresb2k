import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

/**
 * POST - Batch fetch current workers for multiple tasks
 * Accepts an array of task IDs and returns current worker info for each
 * This is more efficient than making individual API calls per task
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { taskIds } = body;

        if (!taskIds || !Array.isArray(taskIds)) {
            return NextResponse.json(
                { error: "taskIds array is required" },
                { status: 400 }
            );
        }

        if (taskIds.length === 0) {
            return NextResponse.json({ data: {} });
        }

        const supabase = await createClient();

        // Fetch all task iterations for the given task IDs
        const { data: iterations, error: iterationsError } = await supabase
            .from("task_iterations")
            .select("task_id, current_stage")
            .in("task_id", taskIds);

        if (iterationsError) {
            console.error("Error fetching iterations:", iterationsError);
            return NextResponse.json(
                { error: "Failed to fetch task iterations" },
                { status: 500 }
            );
        }

        // Create a map of task_id to current_stage
        const stageMap: Record<string, string> = {};
        iterations?.forEach((iteration) => {
            stageMap[iteration.task_id] = iteration.current_stage;
        });

        // Fetch all relevant task actions for these tasks
        const { data: actions, error: actionsError } = await supabase
            .from("task_actions")
            .select("task_id, action_type, user_id, metadata, created_at")
            .in("task_id", taskIds)
            .in("action_type", ["assigned_to", "taken_by"])
            .order("created_at", { ascending: false });

        if (actionsError) {
            console.error("Error fetching task actions:", actionsError);
        }

        // Group actions by task_id
        const actionsByTask: Record<string, any[]> = {};
        actions?.forEach((action) => {
            if (!actionsByTask[action.task_id]) {
                actionsByTask[action.task_id] = [];
            }
            actionsByTask[action.task_id].push(action);
        });

        // Process each task to find assigned workers for current stage only
        const results: Record<string, { name: string; email?: string }[]> = {};

        for (const taskId of taskIds) {
            const currentStage = stageMap[taskId];
            const taskActions = actionsByTask[taskId] || [];

            if (taskActions.length === 0) {
                results[taskId] = [];
                continue;
            }

            // Filter actions by current stage
            const stageFilteredActions = taskActions.filter((action) => {
                const metadata = action.metadata || {};

                if (action.action_type === "assigned_to") {
                    // For assigned_to, check assignment_stage in metadata
                    const assignmentStage = metadata.assignment_stage;
                    return assignmentStage === currentStage;
                } else if (action.action_type === "taken_by") {
                    // For taken_by, check stage in metadata
                    const takenStage = metadata.stage;
                    return takenStage === currentStage;
                }
                return false;
            });

            // Collect all unique assigned users from stage-filtered actions
            const assignedUsers = new Map<string, { name: string; email?: string }>();

            for (const action of stageFilteredActions) {
                const metadata = action.metadata || {};
                let userName: string;
                let userEmail: string | null;
                let userId: string;

                if (action.action_type === "assigned_to") {
                    userName =
                        metadata.assigned_to_user_name ||
                        metadata.user_name ||
                        metadata.assigned_to_user_email ||
                        "Unknown";
                    userEmail =
                        metadata.assigned_to_user_email || metadata.user_email || null;
                    userId = action.user_id || userEmail || userName;
                } else if (action.action_type === "taken_by") {
                    userName =
                        metadata.user_name || metadata.user_email || "Unknown";
                    userEmail = metadata.user_email || null;
                    userId = action.user_id || userEmail || userName;
                } else {
                    continue;
                }

                // Add to map if not already present (deduplication by userId)
                if (!assignedUsers.has(userId)) {
                    assignedUsers.set(userId, {
                        name: userName,
                        email: userEmail || undefined,
                    });
                }
            }

            results[taskId] = Array.from(assignedUsers.values());
        }

        return NextResponse.json({ data: results });
    } catch (error) {
        console.error("Error in batch fetch current workers:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
