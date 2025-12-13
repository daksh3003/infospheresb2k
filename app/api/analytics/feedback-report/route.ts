import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Fetch comments with related task and project data
        let commentsQuery = supabase
            .from("comments")
            .select(`
                comment_id,
                comment,
                task_id,
                user_id,
                created_at,
                updated_at,
                parent_comment_id
            `)
            .order("created_at", { ascending: false });

        if (startDate) {
            commentsQuery = commentsQuery.gte("created_at", new Date(startDate).toISOString());
        }
        if (endDate) {
            // Include the full end date
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            commentsQuery = commentsQuery.lte("created_at", endDateTime.toISOString());
        }

        const { data: comments, error: commentsError } = await commentsQuery;

        if (commentsError) {
            console.error("Error fetching comments:", commentsError);
            return NextResponse.json({ error: commentsError.message }, { status: 500 });
        }

        console.log(`Feedback Report: Found ${comments?.length || 0} comments`);
        
        if (!comments || comments.length === 0) {
            console.log("Feedback Report: No comments found in database");
            console.log("Feedback Report: Query was:", {
                startDate,
                endDate,
                hasFilters: !!(startDate || endDate)
            });
            return NextResponse.json([]);
        }
        
        // Log first few comments for debugging
        console.log("Feedback Report: Sample comments:", comments.slice(0, 3).map((c: any) => ({
            comment_id: c.comment_id,
            task_id: c.task_id,
            created_at: c.created_at,
            has_comment: !!c.comment
        })));

        // Get unique task IDs
        const taskIds = [...new Set(comments.map((c: any) => c.task_id).filter(Boolean))];
        
        if (taskIds.length === 0) {
            console.log("Feedback Report: No valid task IDs found in comments");
            return NextResponse.json([]);
        }
        
        // Fetch tasks
        const { data: tasks, error: tasksError } = await supabase
            .from("tasks_test")
            .select("task_id, task_name, project_id, task_type, processor_type")
            .in("task_id", taskIds);

        if (tasksError) {
            console.error("Error fetching tasks:", tasksError);
        }

        console.log(`Feedback Report: Found ${tasks?.length || 0} tasks for ${taskIds.length} unique task IDs`);

        // Get unique project IDs
        const projectIds = [...new Set(tasks?.map((t: any) => t.project_id) || [])];
        
        console.log(`Feedback Report: Found ${projectIds.length} unique project IDs`);
        
        // Fetch projects
        const { data: projects, error: projectsError } = await supabase
            .from("projects_test")
            .select("project_id, project_name, language")
            .in("project_id", projectIds);

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
        }

        // Fetch files for page count
        const { data: files, error: filesError } = await supabase
            .from("files_test")
            .select("file_id, task_id, file_name, page_count")
            .in("task_id", taskIds);

        if (filesError) {
            console.error("Error fetching files:", filesError);
        }

        // Fetch task actions to find who actually performed QC/QA work
        const { data: taskActions, error: actionsError } = await supabase
            .from("task_actions")
            .select("task_id, user_id, action_type, created_at, metadata")
            .in("task_id", taskIds)
            .order("created_at", { ascending: true });

        if (actionsError) {
            console.error("Error fetching task actions:", actionsError);
        }

        // Fetch task iterations for QC/QA info (fallback)
        const { data: iterations, error: iterationsError } = await supabase
            .from("task_iterations")
            .select("task_id, current_stage, assigned_to_qc_user_id, assigned_to_qa_user_id, created_at")
            .in("task_id", taskIds)
            .order("created_at", { ascending: true });

        if (iterationsError) {
            console.error("Error fetching iterations:", iterationsError);
        }

        // Fetch user profiles
        const userIds = [...new Set([
            ...comments.map((c: any) => c.user_id),
            ...(taskActions?.map((a: any) => a.user_id).filter(Boolean) || []),
            ...(iterations?.map((i: any) => i.assigned_to_qc_user_id).filter(Boolean) || []),
            ...(iterations?.map((i: any) => i.assigned_to_qa_user_id).filter(Boolean) || [])
        ])];
        
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", userIds);

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
        }

        // Create maps for quick lookup
        const taskToProjectMap = new Map();
        tasks?.forEach((task: any) => {
            taskToProjectMap.set(task.task_id, task);
        });

        const projectMap = new Map();
        projects?.forEach((project: any) => {
            projectMap.set(project.project_id, project);
        });

        const taskToFilesMap = new Map();
        files?.forEach((file: any) => {
            if (!taskToFilesMap.has(file.task_id)) {
                taskToFilesMap.set(file.task_id, []);
            }
            taskToFilesMap.get(file.task_id).push(file);
        });

        const taskToIterationsMap = new Map();
        iterations?.forEach((iteration: any) => {
            if (!taskToIterationsMap.has(iteration.task_id)) {
                taskToIterationsMap.set(iteration.task_id, []);
            }
            taskToIterationsMap.get(iteration.task_id).push(iteration);
        });

        const taskToActionsMap = new Map();
        taskActions?.forEach((action: any) => {
            if (!taskToActionsMap.has(action.task_id)) {
                taskToActionsMap.set(action.task_id, []);
            }
            taskToActionsMap.get(action.task_id).push(action);
        });

        const userIdToNameMap = new Map();
        profiles?.forEach((profile: any) => {
            userIdToNameMap.set(profile.id, profile.name);
        });

        // Build report entries
        const reportEntries: any[] = [];
        let sNo = 1;

        comments.forEach((comment: any) => {
            const task = taskToProjectMap.get(comment.task_id);
            
            // Still create entry even if task is not found - use comment data
            const project = task ? projectMap.get(task.project_id) : null;
            const taskFiles = taskToFilesMap.get(comment.task_id) || [];
            const pageCount = taskFiles.reduce((sum: number, f: any) => sum + (f.page_count || 0), 0);
            const fileName = taskFiles[0]?.file_name || "N/A";
            const taskIterations = taskToIterationsMap.get(comment.task_id) || [];
            const actions = taskToActionsMap.get(comment.task_id) || [];
            const commentDate = comment.created_at ? new Date(comment.created_at).getTime() : null;
            
            // Find QC person - first from task_actions (who actually performed QC), then fallback to task_iterations
            const qcActions = actions.filter((a: any) => {
                const metadata = a.metadata || {};
                const currentStage = metadata.current_stage || metadata.upload_stage;
                return currentStage === "QC" && 
                       (a.action_type === 'start' || a.action_type === 'complete');
            });
            
            // If comment has a date, find QC action closest to comment date, otherwise use first
            let qcPersonId = null;
            if (qcActions.length > 0) {
                if (commentDate) {
                    // Find QC action closest to comment date (before or at comment time)
                    const qcActionBeforeComment = qcActions
                        .filter((a: any) => new Date(a.created_at).getTime() <= commentDate)
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                    qcPersonId = qcActionBeforeComment?.user_id || qcActions[0].user_id;
                } else {
                    qcPersonId = qcActions[0].user_id;
                }
            }
            
            // Fallback to task_iterations if no actions found
            if (!qcPersonId) {
                const qcIteration = taskIterations
                    .filter((it: any) => it.current_stage === "QC")
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                qcPersonId = qcIteration?.assigned_to_qc_user_id || null;
            }
            
            const qcPerson = qcPersonId ? userIdToNameMap.get(qcPersonId) : "-";
            
            // Find QA person - first from task_actions (who actually performed QA), then fallback to task_iterations
            const qaActions = actions.filter((a: any) => {
                const metadata = a.metadata || {};
                const currentStage = metadata.current_stage || metadata.upload_stage;
                return currentStage === "QA" && 
                       (a.action_type === 'start' || a.action_type === 'complete');
            });
            
            // If comment has a date, find QA action closest to comment date, otherwise use first
            let qaPersonId = null;
            if (qaActions.length > 0) {
                if (commentDate) {
                    // Find QA action closest to comment date (before or at comment time)
                    const qaActionBeforeComment = qaActions
                        .filter((a: any) => new Date(a.created_at).getTime() <= commentDate)
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                    qaPersonId = qaActionBeforeComment?.user_id || qaActions[0].user_id;
                } else {
                    qaPersonId = qaActions[0].user_id;
                }
            }
            
            // Fallback to task_iterations if no actions found
            if (!qaPersonId) {
                const qaIteration = taskIterations
                    .filter((it: any) => it.current_stage === "QA")
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                qaPersonId = qaIteration?.assigned_to_qa_user_id || null;
            }
            
            const qaPerson = qaPersonId ? userIdToNameMap.get(qaPersonId) : "-";

            // Format date as DD-MM-YYYY
            const date = comment.created_at 
                ? new Date(comment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                : "N/A";

            // Determine if comment is internal or external based on parent_comment_id
            // If parent_comment_id exists, it might be a reply (could be internal)
            // For now, we'll treat all comments as external comments
            const externalComment = comment.comment || "N/A";
            const internalComment = comment.parent_comment_id ? "N/A" : "N/A"; // Adjust based on your business logic

            reportEntries.push({
                // Section 1: Job Details
                s_no: sNo++,
                date: date,
                client: project?.project_name || "N/A",
                task: task?.task_name || "N/A",
                filename: fileName,
                pages: pageCount,
                language: project?.language || "N/A",
                task_type: task?.task_type || "N/A",
                process: task?.processor_type || "N/A",
                qc: qcPerson || "-",

                // Section 2: Quality Assurance
                qa: qaPerson || "-",
                delivery: "N/A", // Add delivery info if available
                internal_auditor: "N/A", // Add if you have this field
                internal_comments: internalComment,
                external_comments: externalComment,
                total_errors: 1, // Count errors - you might need to calculate this
                remarks: "N/A", // Add if you have this field

                // Section 3: Impact and RCA
                impact: "High", // You might need to add this field to comments table
                action: "N/A", // You might need to add this field
                rca: "Yes", // You might need to add this field
                action_2: "N/A", // You might need to add this field
                rca_2: "Yes", // You might need to add this field
            });
        });

        console.log(`Feedback Report: Created ${reportEntries.length} report entries from ${comments.length} comments`);
        
        if (reportEntries.length === 0 && comments.length > 0) {
            console.warn("Feedback Report: No report entries created even though comments exist. Check if tasks are found for comment task_ids.");
        }

        return NextResponse.json(reportEntries);
    } catch (error) {
        console.error("Error fetching Feedback Report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}