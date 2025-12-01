import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        // Fetch all projects with their tasks
        const { data: projects, error: projectsError } = await supabase
            .from("projects_test")
            .select("project_id, project_name, po_hours, mail_instruction, delivery_date, delivery_time, created_by, created_at")
            .order("created_at", { ascending: false });

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
            return NextResponse.json({ error: projectsError.message }, { status: 500 });
        }

        if (!projects || projects.length === 0) {
            return NextResponse.json([]);
        }

        const projectIds = projects.map((p: any) => p.project_id);

        // Fetch tasks for these projects
        const { data: tasks, error: tasksError } = await supabase
            .from("tasks_test")
            .select("task_id, task_name, project_id, processor_type, created_at")
            .in("project_id", projectIds);

        if (tasksError) {
            console.error("Error fetching tasks:", tasksError);
        }

        const taskIds = tasks?.map((t: any) => t.task_id) || [];

        // Fetch files for these tasks
        const { data: files, error: filesError } = await supabase
            .from("files_test")
            .select("file_id, task_id, file_name, page_count")
            .in("task_id", taskIds);

        if (filesError) {
            console.error("Error fetching files:", filesError);
        }

        // Fetch task iterations
        const { data: taskIterations, error: iterationsError } = await supabase
            .from("task_iterations")
            .select("id, task_id, current_stage, assigned_to_processor_user_id, assigned_to_qc_user_id, assigned_to_qa_user_id, created_at, updated_at")
            .in("task_id", taskIds)
            .order("created_at", { ascending: true });

        if (iterationsError) {
            console.error("Error fetching task iterations:", iterationsError);
        }

        // Fetch task actions for timing information
        const { data: taskActions, error: actionsError } = await supabase
            .from("task_actions")
            .select("task_id, user_id, action_type, metadata, created_at")
            .in("task_id", taskIds)
            .order("created_at", { ascending: true });

        if (actionsError) {
            console.error("Error fetching task actions:", actionsError);
        }

        // Fetch user profiles
        const userIds = new Set<string>();
        if (projects) projects.forEach((p: any) => p.created_by && userIds.add(p.created_by));
        if (taskIterations) {
            taskIterations.forEach((ti: any) => {
                if (ti.assigned_to_processor_user_id) userIds.add(ti.assigned_to_processor_user_id);
                if (ti.assigned_to_qc_user_id) userIds.add(ti.assigned_to_qc_user_id);
                if (ti.assigned_to_qa_user_id) userIds.add(ti.assigned_to_qa_user_id);
            });
        }
        if (taskActions) {
            taskActions.forEach((ta: any) => ta.user_id && userIds.add(ta.user_id));
        }

        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", Array.from(userIds));

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
        }

        const userIdToNameMap = new Map();
        if (profiles) {
            profiles.forEach((profile: any) => {
                userIdToNameMap.set(profile.id, profile.name);
            });
        }

        // Build maps for easier lookup
        const projectToTasksMap = new Map();
        if (tasks) {
            tasks.forEach((task: any) => {
                if (!projectToTasksMap.has(task.project_id)) {
                    projectToTasksMap.set(task.project_id, []);
                }
                projectToTasksMap.get(task.project_id).push(task);
            });
        }

        const taskToFilesMap = new Map();
        if (files) {
            files.forEach((file: any) => {
                if (!taskToFilesMap.has(file.task_id)) {
                    taskToFilesMap.set(file.task_id, []);
                }
                taskToFilesMap.get(file.task_id).push(file);
            });
        }

        const taskToIterationsMap = new Map();
        if (taskIterations) {
            taskIterations.forEach((iteration: any) => {
                if (!taskToIterationsMap.has(iteration.task_id)) {
                    taskToIterationsMap.set(iteration.task_id, []);
                }
                taskToIterationsMap.get(iteration.task_id).push(iteration);
            });
        }

        const taskToActionsMap = new Map();
        if (taskActions) {
            taskActions.forEach((action: any) => {
                if (!taskToActionsMap.has(action.task_id)) {
                    taskToActionsMap.set(action.task_id, []);
                }
                taskToActionsMap.get(action.task_id).push(action);
            });
        }

        // Build report entries
        const reportEntries: any[] = [];
        let jobNo = 1;

        projects.forEach((project: any) => {
            const projectTasks = projectToTasksMap.get(project.project_id) || [];
            
            projectTasks.forEach((task: any) => {
                const taskFiles = taskToFilesMap.get(task.task_id) || [];
                const fileCount = taskFiles.length;
                const pageCount = taskFiles.reduce((sum: number, f: any) => sum + (f.page_count || 0), 0);
                const fileId = taskFiles[0]?.file_id || "N/A";
                
                const iterations = taskToIterationsMap.get(task.task_id) || [];
                const actions = taskToActionsMap.get(task.task_id) || [];
                
                // Get DTP person (processor)
                const dtpIteration = iterations.find((it: any) => it.current_stage === "Processor" || it.assigned_to_processor_user_id);
                const dtpPersonId = dtpIteration?.assigned_to_processor_user_id;
                const dtpPerson = dtpPersonId ? userIdToNameMap.get(dtpPersonId) : "N/A";
                
                // Get DTP start/end times from actions
                const dtpActions = actions.filter((a: any) => 
                    a.user_id === dtpPersonId && 
                    (a.action_type === 'start' || a.action_type === 'complete' || a.action_type === 'upload')
                );
                const dtpStartTime = dtpActions[0]?.created_at ? 
                    new Date(dtpActions[0].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                const dtpEndTime = dtpActions[dtpActions.length - 1]?.created_at ? 
                    new Date(dtpActions[dtpActions.length - 1].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                
                // Get QC person
                const qcIteration = iterations.find((it: any) => it.current_stage === "QC" || it.assigned_to_qc_user_id);
                const qcPersonId = qcIteration?.assigned_to_qc_user_id;
                const qcPerson = qcPersonId ? userIdToNameMap.get(qcPersonId) : "N/A";
                
                // Get QC start/end times
                const qcActions = actions.filter((a: any) => 
                    a.user_id === qcPersonId && 
                    (a.action_type === 'start' || a.action_type === 'complete')
                );
                const qcStartTime = qcActions[0]?.created_at ? 
                    new Date(qcActions[0].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                const qcEndTime = qcActions[qcActions.length - 1]?.created_at ? 
                    new Date(qcActions[qcActions.length - 1].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                
                // Get QA person
                const qaIteration = iterations.find((it: any) => it.current_stage === "QA" || it.assigned_to_qa_user_id);
                const qaPersonId = qaIteration?.assigned_to_qa_user_id;
                const qaPerson = qaPersonId ? userIdToNameMap.get(qaPersonId) : "N/A";
                
                // Get QA start/end times
                const qaActions = actions.filter((a: any) => 
                    a.user_id === qaPersonId && 
                    (a.action_type === 'start' || a.action_type === 'complete')
                );
                const qaStartTime = qaActions[0]?.created_at ? 
                    new Date(qaActions[0].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                const qaEndTime = qaActions[qaActions.length - 1]?.created_at ? 
                    new Date(qaActions[qaActions.length - 1].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                
                // Format PO hours - use same format as other tables (raw decimal)
                const poHours = project.po_hours || project.pohours || project.poHours || 0;
                
                // Format delivery time
                const deliveryTime = project.delivery_time || "N/A";
                
                // Format date
                const date = project.created_at ? 
                    new Date(project.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A";
                
                const deliveredBy = project.created_by ? userIdToNameMap.get(project.created_by) : "N/A";
                
                reportEntries.push({
                    // Job Details
                    job_no: jobNo++,
                    delivered_by: deliveredBy,
                    po: poHours || 0,
                    mail_instruction: project.mail_instruction || "N/A",
                    task_type: task.processor_type || "N/A",
                    task_name: task.task_name || "N/A",
                    file_count: fileCount,
                    page_count: pageCount,
                    
                    // DTP Process
                    language: "N/A", // This might need to come from metadata or another source
                    platform: "Word", // Default or from metadata
                    stage: dtpIteration?.current_stage || "Initial",
                    date: date,
                    delivery_time: deliveryTime,
                    dtp_person: dtpPerson,
                    dtp_start_time: dtpStartTime,
                    dtp_end_time: dtpEndTime,
                    abbyy_compare_dtp: "N/A", // This might need to come from metadata
                    dtp_status: dtpIteration ? "Completed" : "Pending",
                    
                    // QC Tracking
                    qc_taken_by: qcPerson,
                    qc_start_time: qcStartTime,
                    qc_end_time: qcEndTime,
                    abbyy_compare_qc: "N/A",
                    qc_status: qcIteration ? "Completed" : "Pending",
                    qc_cxn_taken: "N/A", // This might need special logic
                    qc_cxn_start_time: "N/A",
                    qc_cxn_end_time: "N/A",
                    cxn_status: "N/A",
                    
                    // QA Tracking
                    qa_taken_by: qaPerson,
                    qa_start_time: qaStartTime,
                    qa_end_time: qaEndTime,
                    abbyy_compare_qa: "N/A",
                    qa_status: qaIteration ? "Completed" : "Pending",
                    qa_cxn_taken: "N/A",
                    qa_cxn_start_time: "N/A",
                    qa_cxn_end_time: "N/A",
                    file_status: project.completion_status ? "RFD" : "In Progress",
                });
            });
        });

        return NextResponse.json(reportEntries);
    } catch (error) {
        console.error("Error fetching DTP Tracking report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}