// Utility function to fetch assigned users for a task, filtered by current stage
import { createClient } from '@/lib/client';
import { getTaskActions } from './taskActions';

export interface AssignedUser {
    user_id: string;
    name: string;
    email: string;
    role: string;
    action_type: string;
}

/**
 * Fetches assigned users for a specific task, filtered by current stage
 * Uses the same logic as MainTaskCard.tsx
 */
export async function fetchTaskAssignments(
    taskId: string,
    creatorId?: string
): Promise<AssignedUser[]> {
    try {
        const supabase = createClient();

        // Get task creator ID to filter them out
        const { data: taskData, error: taskError } = await supabase
            .from("tasks_test")
            .select("created_by")
            .eq("task_id", taskId)
            .single();

        const taskCreatorId = taskData?.created_by || null;

        if (taskError) {
            console.error(`[${taskId}] Error fetching task creator:`, taskError);
        }

        // First, get the current stage from task_iterations
        const { data: iteration, error: iterationError } = await supabase
            .from("task_iterations")
            .select("current_stage")
            .eq("task_id", taskId)
            .single();

        const currentStage = iteration?.current_stage || null;

        if (iterationError && iterationError.code !== "PGRST116") {
            console.error("Error fetching current stage:", iterationError);
        }

        // Fetch from task_actions table for 'taken_by' and 'assigned_to' actions
        const actionsResult = await getTaskActions({
            task_id: taskId,
            action_type: ["taken_by", "assigned_to"],
        });

        let taskActionsUsers: {
            user_id: string;
            name: string;
            email: string;
            role: string;
            action_type: string;
            assigned_at: string;
            stage: string;
            source: string;
        }[] = [];

        if (actionsResult.success && actionsResult.data) {
            // Process task actions to get assigned users
            taskActionsUsers = actionsResult.data
                .filter((action: any) => action.user_id !== taskCreatorId) // Filter out creator
                .map(
                    (action: {
                        user_id: string;
                        action_type: string;
                        created_at: string;
                        metadata?: {
                            user_name?: string;
                            user_email?: string;
                            user_role?: string;
                            stage?: string;
                            assignment_stage?: string;
                            assigned_to_user_id?: string;
                            assigned_to_user_name?: string;
                            assigned_to_user_email?: string;
                            assigned_to_user_role?: string;
                        };
                    }) => {
                        // For 'assigned_to' actions, use the assigned_to_user_* fields from metadata
                        // which represent the person BEING assigned, not the person doing the assigning
                        const isAssignedToAction = action.action_type === "assigned_to";
                        const actualUserId = isAssignedToAction
                            ? (action.metadata?.assigned_to_user_id || action.user_id)
                            : action.user_id;
                        const actualUserName = isAssignedToAction
                            ? (action.metadata?.assigned_to_user_name || action.metadata?.user_name || action.user_id)
                            : (action.metadata?.user_name || action.user_id);
                        const actualUserEmail = isAssignedToAction
                            ? (action.metadata?.assigned_to_user_email || action.metadata?.user_email || "")
                            : (action.metadata?.user_email || "");
                        const actualUserRole = isAssignedToAction
                            ? (action.metadata?.assigned_to_user_role || action.metadata?.user_role || "")
                            : (action.metadata?.user_role || "");

                        return {
                            user_id: actualUserId,
                            name: actualUserName,
                            email: actualUserEmail,
                            role: actualUserRole,
                            action_type: action.action_type,
                            assigned_at: action.created_at,
                            stage: action.action_type === "assigned_to"
                                ? (action.metadata?.assignment_stage || "")
                                : (action.metadata?.stage || ""),
                            source: "task_actions",
                        };
                    }
                );

            // Filter by current stage if available
            if (currentStage) {
                taskActionsUsers = taskActionsUsers.filter(
                    (user) => user.stage === currentStage
                );
            }
        }

        // Fetch from files_test table
        const { data: filesData, error: filesError } = await supabase
            .from("files_test")
            .select("taken_by, assigned_to, created_at")
            .eq("task_id", taskId);

        const filesUsers: {
            user_id: string;
            name: string;
            email: string;
            role: string;
            action_type: string;
            assigned_at: string;
            stage: string;
            source: string;
        }[] = [];

        if (!filesError && filesData) {
            // Process files_test data
            filesData.forEach(
                (file: {
                    taken_by?: string;
                    assigned_to?: {
                        user_id?: string;
                        id?: string;
                        name?: string;
                        email?: string;
                        role?: string;
                        assigned_at?: string;
                    }[];
                    created_at: string;
                }) => {
                    // Process taken_by field
                    if (file.taken_by && file.taken_by !== taskCreatorId) {
                        filesUsers.push({
                            user_id: file.taken_by,
                            name: file.taken_by,
                            email: "",
                            role: "",
                            action_type: "taken_by",
                            assigned_at: file.created_at,
                            stage: "", // Files table usually doesn't have stage info
                            source: "files_test",
                        });
                    }

                    // Process assigned_to array
                    if (file.assigned_to && Array.isArray(file.assigned_to)) {
                        file.assigned_to.forEach(
                            (assignment: {
                                user_id?: string;
                                id?: string;
                                name?: string;
                                email?: string;
                                role?: string;
                                assigned_at?: string;
                            }) => {
                                if (assignment && typeof assignment === "object") {
                                    const userId = assignment.user_id || assignment.id || "unknown";

                                    // Skip the creator
                                    if (userId === taskCreatorId) return;

                                    // Filter by current stage if possible (match role to stage)
                                    // e.g. currentStage "QC" matches role "QC"
                                    if (currentStage && assignment.role &&
                                        assignment.role.toLowerCase() !== currentStage.toLowerCase()) {
                                        return;
                                    }

                                    filesUsers.push({
                                        user_id: userId,
                                        name:
                                            assignment.name ||
                                            assignment.user_id ||
                                            assignment.id ||
                                            "unknown",
                                        email: assignment.email || "",
                                        role: assignment.role || "",
                                        action_type: "assigned_to",
                                        assigned_at: assignment.assigned_at || file.created_at,
                                        stage: assignment.role || "",
                                        source: "files_test",
                                    });
                                }
                            }
                        );
                    }
                }
            );
        }

        // Combine both sources
        let allUsers = [...taskActionsUsers, ...filesUsers];

        console.log(`🔍 Before handover check: ${allUsers.length} total users (${taskActionsUsers.length} from actions, ${filesUsers.length} from files)`);

        // Check if there's a handover action after the last assignment (check AFTER combining sources)
        const handoverResult = await getTaskActions({
            task_id: taskId,
            action_type: "handover",
        });

        if (handoverResult.success && handoverResult.data && handoverResult.data.length > 0) {
            // Get the latest handover timestamp
            const latestHandover = handoverResult.data[0]; // Already sorted by created_at desc
            const handoverTime = new Date(latestHandover.created_at);

            // Get the latest assignment timestamp from ALL sources
            const latestAssignmentTime = allUsers.length > 0
                ? new Date(Math.max(...allUsers.map(u => new Date(u.assigned_at).getTime())))
                : new Date(0);

            console.log('🔍 Handover check (combined):', {
                handoverTime: handoverTime.toISOString(),
                latestAssignmentTime: latestAssignmentTime.toISOString(),
                willClear: handoverTime > latestAssignmentTime,
                currentAssignments: allUsers.length
            });

            // If handover happened after the last assignment, clear ALL assignments
            if (handoverTime > latestAssignmentTime) {
                allUsers = [];
                console.log('✅ Cleared ALL assignments due to handover');
            } else {
                // If there was a handover but new assignments after it,
                // keep only assignments that happened AFTER the handover
                allUsers = allUsers.filter(u => new Date(u.assigned_at) > handoverTime);
                console.log(`✅ Filtered to ${allUsers.length} assignments after handover`);
            }
        }

        // Remove duplicates based on user_id and keep the latest action
        const uniqueAssignedUsers = allUsers.reduce(
            (
                acc: {
                    user_id: string;
                    name: string;
                    email: string;
                    role: string;
                    action_type: string;
                    assigned_at: string;
                    stage: string;
                    source: string;
                }[],
                current: {
                    user_id: string;
                    name: string;
                    email: string;
                    role: string;
                    action_type: string;
                    assigned_at: string;
                    stage: string;
                    source: string;
                }
            ) => {
                const existingIndex = acc.findIndex(
                    (user) => user.user_id === current.user_id
                );
                if (existingIndex === -1) {
                    acc.push(current);
                } else {
                    // Keep the latest assignment
                    if (
                        new Date(current.assigned_at) >
                        new Date(acc[existingIndex].assigned_at)
                    ) {
                        acc[existingIndex] = current;
                    }
                }
                return acc;
            },
            []
        );

        // Resolve user names for user_ids that don't have names
        const usersWithResolvedNames = await Promise.all(
            uniqueAssignedUsers.map(async (user) => {
                if (!user.name || user.name === user.user_id) {
                    try {
                        const { data: profileData, error: profileError } = await supabase
                            .from("profiles")
                            .select("name, email, role")
                            .eq("id", user.user_id)
                            .single();

                        if (!profileError && profileData) {
                            return {
                                ...user,
                                name: profileData.name || user.name,
                                email: profileData.email || user.email,
                                role: profileData.role || user.role,
                            };
                        }
                    } catch (error) {
                        console.warn(
                            `Failed to fetch profile for user ${user.user_id}:`,
                            error
                        );
                    }
                }
                return user;
            })
        );

        // Filter out the task creator from assigned users (redundant but safe)
        let finalFilteredUsers = usersWithResolvedNames.filter(
            (user) => user.user_id !== taskCreatorId && user.user_id !== creatorId
        );

        // Keep only the most recent assignment (latest person working on the task)
        if (finalFilteredUsers.length > 1) {
            const mostRecent = finalFilteredUsers.reduce((latest, current) => {
                return new Date(current.assigned_at) > new Date(latest.assigned_at) ? current : latest;
            });
            finalFilteredUsers = [mostRecent];
        }

        // Return simplified format
        const result = finalFilteredUsers.map((user) => ({
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            action_type: user.action_type,
        }));

        return result;
    } catch (error) {
        console.error("Error fetching task assignments:", error);
        return [];
    }
}

/**
 * Batch fetch assigned users for multiple tasks
 * Uses optimized batch endpoint instead of individual calls
 */
export async function fetchBatchTaskAssignments(
    taskIds: string[]
): Promise<Record<string, AssignedUser[]>> {
    try {
        // Use the batch endpoint for efficiency
        const response = await fetch('/api/batch-task-assignments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskIds }),
        });

        if (!response.ok) {
            console.error('Batch task assignments request failed:', response.statusText);
            return {};
        }

        const results = await response.json();
        return results;
    } catch (error) {
        console.error('Error in fetchBatchTaskAssignments:', error);
        return {};
    }
}
