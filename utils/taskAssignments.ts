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
                        };
                    }) => ({
                        user_id: action.user_id,
                        name: action.metadata?.user_name || action.user_id,
                        email: action.metadata?.user_email || "",
                        role: action.metadata?.user_role || "",
                        action_type: action.action_type,
                        assigned_at: action.created_at,
                        stage: action.action_type === "assigned_to"
                            ? (action.metadata?.assignment_stage || "")
                            : (action.metadata?.stage || ""),
                        source: "task_actions",
                    })
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
        const allUsers = [...taskActionsUsers, ...filesUsers];

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
        const finalFilteredUsers = usersWithResolvedNames.filter(
            (user) => user.user_id !== taskCreatorId && user.user_id !== creatorId
        );

        // Return simplified format
        return finalFilteredUsers.map((user) => ({
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            action_type: user.action_type,
        }));
    } catch (error) {
        console.error("Error fetching task assignments:", error);
        return [];
    }
}

/**
 * Batch fetch assigned users for multiple tasks
 * Uses the same logic as fetchTaskAssignments but optimized for multiple tasks
 */
export async function fetchBatchTaskAssignments(
    taskIds: string[]
): Promise<Record<string, AssignedUser[]>> {
    const results: Record<string, AssignedUser[]> = {};

    // Fetch assignments for each task
    await Promise.all(
        taskIds.map(async (taskId) => {
            const assignments = await fetchTaskAssignments(taskId);
            results[taskId] = assignments;
        })
    );

    return results;
}
