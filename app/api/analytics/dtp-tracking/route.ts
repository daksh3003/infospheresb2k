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
            .select("project_id, project_name, po_hours, mail_instruction, delivery_date, delivery_time, created_by, created_at, language, platform")
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
            .select("task_id, task_name, project_id, task_type, created_at")
            .in("project_id", projectIds);

        if (tasksError) {
            console.error("Error fetching tasks:", tasksError);
        }

        const taskIds = tasks?.map((t: any) => t.task_id) || [];

        // Fetch user profiles for project creators (needed for early return case)
        const projectCreatorIds = new Set<string>();
        if (projects) projects.forEach((p: any) => p.created_by && projectCreatorIds.add(p.created_by));

        const { data: projectProfiles, error: projectProfilesError } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", Array.from(projectCreatorIds));

        if (projectProfilesError) {
            console.error("Error fetching project creator profiles:", projectProfilesError);
        }

        const userIdToNameMap = new Map();
        if (projectProfiles) {
            projectProfiles.forEach((profile: any) => {
                userIdToNameMap.set(profile.id, profile.name);
            });
        }

        // Fetch files for these tasks (even if empty, we'll handle projects without tasks in the main loop)
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
            .select("id, task_id, current_stage, stages, sent_by, assigned_to_processor_user_id, assigned_to_qc_user_id, assigned_to_qa_user_id, created_at, updated_at")
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

        // Fetch all user profiles (including task-related users)
        const allUserIds = new Set<string>();
        if (projects) projects.forEach((p: any) => p.created_by && allUserIds.add(p.created_by));
        if (taskIterations) {
            taskIterations.forEach((ti: any) => {
                if (ti.assigned_to_processor_user_id) allUserIds.add(ti.assigned_to_processor_user_id);
                if (ti.assigned_to_qc_user_id) allUserIds.add(ti.assigned_to_qc_user_id);
                if (ti.assigned_to_qa_user_id) allUserIds.add(ti.assigned_to_qa_user_id);
            });
        }
        if (taskActions) {
            taskActions.forEach((ta: any) => ta.user_id && allUserIds.add(ta.user_id));
        }

        // Fetch all profiles and update the map
        if (allUserIds.size > 0) {
            const { data: allProfiles, error: allProfilesError } = await supabase
                .from("profiles")
                .select("id, name")
                .in("id", Array.from(allUserIds));

            if (allProfilesError) {
                console.error("Error fetching all profiles:", allProfilesError);
            }

            if (allProfiles) {
                allProfiles.forEach((profile: any) => {
                    userIdToNameMap.set(profile.id, profile.name);
                });
            }
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
            
            // If no tasks for this project, still create an entry
            if (projectTasks.length === 0) {
                // Format date as "DD-MM-YYYY"
                let date = "N/A";
                if (project.created_at) {
                    const dateObj = new Date(project.created_at);
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    date = `${day}-${month}-${year}`;
                }
                
                // Format delivery time
                let deliveryTime = "N/A";
                if (project.delivery_time) {
                    try {
                        const timeObj = new Date(project.delivery_time);
                        if (!isNaN(timeObj.getTime())) {
                            deliveryTime = timeObj.toLocaleTimeString('en-US', { 
                                hour12: false, 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                        } else {
                            const timeStr = String(project.delivery_time);
                            const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
                            if (timeMatch) {
                                const hours = String(parseInt(timeMatch[1])).padStart(2, '0');
                                const minutes = timeMatch[2];
                                deliveryTime = `${hours}:${minutes}`;
                            }
                        }
                    } catch (e) {
                        const timeStr = String(project.delivery_time);
                        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
                        if (timeMatch) {
                            const hours = String(parseInt(timeMatch[1])).padStart(2, '0');
                            const minutes = timeMatch[2];
                            deliveryTime = `${hours}:${minutes}`;
                        }
                    }
                }
                
                const deliveredBy = project.created_by ? userIdToNameMap.get(project.created_by) : "N/A";
                const poHours = project.po_hours || project.pohours || project.poHours || 0;
                
                reportEntries.push({
                    job_no: jobNo++,
                    delivered_by: deliveredBy,
                    po: poHours || 0,
                    mail_instruction: project.mail_instruction || "N/A",
                    task_type: "N/A",
                    task_name: "N/A",
                    file_count: 0,
                    page_count: 0,
                    language: project.language || "N/A",
                    platform: project.platform || "N/A",
                    stage: "Pending",
                    date: date,
                    delivery_time: deliveryTime,
                    dtp_person: "N/A",
                    dtp_start_time: "N/A",
                    dtp_end_time: "N/A",
                    abbyy_compare_dtp: "N/A",
                    dtp_status: "Pending",
                    qc_taken_by: "N/A",
                    qc_start_time: "N/A",
                    qc_end_time: "N/A",
                    abbyy_compare_qc: "N/A",
                    qc_status: "Pending",
                    qc_cxn_taken: "N/A",
                    qc_cxn_start_time: "N/A",
                    qc_cxn_end_time: "N/A",
                    cxn_status: "N/A",
                    qa_taken_by: "N/A",
                    qa_start_time: "N/A",
                    qa_end_time: "N/A",
                    abbyy_compare_qa: "N/A",
                    qa_status: "Pending",
                    qa_cxn_taken: "N/A",
                    qa_cxn_start_time: "N/A",
                    qa_cxn_end_time: "N/A",
                    file_status: project.completion_status ? "RFD" : "In Progress",
                });
                return; // Skip to next project
            }
            
            projectTasks.forEach((task: any) => {
                const taskFiles = taskToFilesMap.get(task.task_id) || [];
                const fileCount = taskFiles.length;
                const pageCount = taskFiles.reduce((sum: number, f: any) => sum + (f.page_count || 0), 0);
                const fileId = taskFiles[0]?.file_id || "N/A";
                
                const iterations = taskToIterationsMap.get(task.task_id) || [];
                const actions = taskToActionsMap.get(task.task_id) || [];
                
                // Sort iterations by created_at to get the most recent one
                const sortedIterations = [...iterations].sort((a: any, b: any) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                
                // Get stages array from the most recent iteration (it contains the full history)
                // The 'stages' column is a JSON array with the complete stage history
                let stages: string[] = [];
                if (sortedIterations.length > 0) {
                    const mostRecentIteration = sortedIterations[sortedIterations.length - 1];
                    // Use the 'stages' column if available, otherwise fall back to current_stage
                    if (mostRecentIteration.stages && Array.isArray(mostRecentIteration.stages)) {
                        stages = mostRecentIteration.stages;
                    } else if (mostRecentIteration.current_stage) {
                        // Fallback: if no stages array, use current_stage from all iterations
                        stages = sortedIterations.map((it: any) => it.current_stage);
                    }
                }
                
                // Debug logging - show detailed stage information
                if (stages.length > 0) {
                    console.log(`\n=== Task ${task.task_id} ===`);
                    console.log(`Iterations count: ${iterations.length}`);
                    console.log(`Stages array (from stages column):`, JSON.stringify(stages));
                    console.log(`Stages array length: ${stages.length}`);
                    console.log(`Sorted iterations details:`, sortedIterations.map((it: any, idx: number) => ({
                        index: idx,
                        current_stage: it.current_stage,
                        stages: it.stages,
                        created_at: it.created_at,
                        processor_user_id: it.assigned_to_processor_user_id
                    })));
                }
                
                // Check for QC CXN: Find actions where sent_by is QC and current_stage is Processor
                let hasQCCXN = false;
                let qcCXNPersonId: string | null = null;
                let qcCXNStartTime = "N/A";
                let qcCXNEndTime = "N/A";
                
                // Find all actions where metadata.sent_by === "QC" and metadata.current_stage === "Processor"
                const qcCXNActions = actions.filter((a: any) => {
                    const metadata = a.metadata || {};
                    const sentBy = metadata.sent_by || "";
                    const currentStage = metadata.current_stage || metadata.upload_stage || "";
                    return (sentBy === "QC" || sentBy.toUpperCase() === "QC") &&
                           (currentStage === "Processor" || currentStage.toUpperCase() === "PROCESSOR") &&
                           (a.action_type === 'start' || a.action_type === 'complete' || a.action_type === 'upload' || a.action_type === 'taken_by');
                }).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                
                if (qcCXNActions.length > 0) {
                    hasQCCXN = true;
                    // Get the person who took it up (first action's user_id)
                    qcCXNPersonId = qcCXNActions[0].user_id;
                    // Start time: first action
                    qcCXNStartTime = new Date(qcCXNActions[0].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                    // End time: last action
                    qcCXNEndTime = new Date(qcCXNActions[qcCXNActions.length - 1].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                }
                
                // Check for QA CXN: Find actions where sent_by is QA and current_stage is Processor
                let hasQACXN = false;
                let qaCXNPersonId: string | null = null;
                let qaCXNStartTime = "N/A";
                let qaCXNEndTime = "N/A";
                
                // Find all actions where metadata.sent_by === "QA" and metadata.current_stage === "Processor"
                const qaCXNActions = actions.filter((a: any) => {
                    const metadata = a.metadata || {};
                    const sentBy = metadata.sent_by || "";
                    const currentStage = metadata.current_stage || metadata.upload_stage || "";
                    return (sentBy === "QA" || sentBy.toUpperCase() === "QA") &&
                           (currentStage === "Processor" || currentStage.toUpperCase() === "PROCESSOR") &&
                           (a.action_type === 'start' || a.action_type === 'complete' || a.action_type === 'upload' || a.action_type === 'taken_by');
                }).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                
                if (qaCXNActions.length > 0) {
                    hasQACXN = true;
                    // Get the person who took it up (first action's user_id)
                    qaCXNPersonId = qaCXNActions[0].user_id;
                    // Start time: first action
                    qaCXNStartTime = new Date(qaCXNActions[0].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                    // End time: last action
                    qaCXNEndTime = new Date(qaCXNActions[qaCXNActions.length - 1].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                }
                
                console.log(`Task ${task.task_id} - Final result: hasQCCXN=${hasQCCXN}, hasQACXN=${hasQACXN}`);
                if (hasQCCXN) {
                    console.log(`  QC CXN - Person ID: ${qcCXNPersonId}, Start: ${qcCXNStartTime}, End: ${qcCXNEndTime}`);
                }
                if (hasQACXN) {
                    console.log(`  QA CXN - Person ID: ${qaCXNPersonId}, Start: ${qaCXNStartTime}, End: ${qaCXNEndTime}`);
                }
                console.log(`=== End Task ${task.task_id} ===\n`);
                
                // Get DTP person (processor) - only for tasks where task_type is "DTP"
                // Find the person who took up the Processor stage for DTP tasks
                let dtpPersonId: string | null = null;
                let dtpPerson = "N/A";
                let dtpStartTime = "N/A";
                let dtpEndTime = "N/A";
                
                // Only process DTP tasks
                if (task.task_type === "DTP" || task.task_type?.toUpperCase() === "DTP") {
                    // Find actions in Processor stage for this DTP task
                    const dtpActions = actions.filter((a: any) => {
                        const metadata = a.metadata || {};
                        const currentStage = metadata.current_stage || metadata.upload_stage;
                        return currentStage === "Processor" && 
                               (a.action_type === 'start' || a.action_type === 'complete' || a.action_type === 'upload' || a.action_type === 'taken_by');
                    }).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    
                    if (dtpActions.length > 0) {
                        // Get the person who took it up (first action's user_id)
                        dtpPersonId = dtpActions[0].user_id;
                        dtpStartTime = new Date(dtpActions[0].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                        dtpEndTime = new Date(dtpActions[dtpActions.length - 1].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                    } else {
                        // Fallback: check iterations for assigned processor
                        const processorIteration = iterations.find((it: any) => 
                            (it.current_stage === "Processor" || it.current_stage?.toUpperCase() === "PROCESSOR") &&
                            it.assigned_to_processor_user_id
                        );
                        if (processorIteration) {
                            dtpPersonId = processorIteration.assigned_to_processor_user_id;
                        }
                    }
                    
                    dtpPerson = dtpPersonId ? userIdToNameMap.get(dtpPersonId) || "N/A" : "N/A";
                }
                
                // Get QC person - find from actions where current_stage is "QC"
                const qcActions = actions.filter((a: any) => {
                    const metadata = a.metadata || {};
                    const currentStage = metadata.current_stage || metadata.upload_stage;
                    return currentStage === "QC" && 
                           (a.action_type === 'start' || a.action_type === 'complete');
                });
                const qcPersonId = qcActions.length > 0 ? qcActions[0].user_id : 
                    (iterations.find((it: any) => it.current_stage === "QC" || it.assigned_to_qc_user_id)?.assigned_to_qc_user_id || null);
                const qcPerson = qcPersonId ? userIdToNameMap.get(qcPersonId) : "N/A";
                
                const qcStartTime = qcActions[0]?.created_at ? 
                    new Date(qcActions[0].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                const qcEndTime = qcActions[qcActions.length - 1]?.created_at ? 
                    new Date(qcActions[qcActions.length - 1].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                
                // Get QA person - find from actions where current_stage is "QA"
                const qaActions = actions.filter((a: any) => {
                    const metadata = a.metadata || {};
                    const currentStage = metadata.current_stage || metadata.upload_stage;
                    return currentStage === "QA" && 
                           (a.action_type === 'start' || a.action_type === 'complete');
                });
                const qaPersonId = qaActions.length > 0 ? qaActions[0].user_id : 
                    (iterations.find((it: any) => it.current_stage === "QA" || it.assigned_to_qa_user_id)?.assigned_to_qa_user_id || null);
                const qaPerson = qaPersonId ? userIdToNameMap.get(qaPersonId) : "N/A";
                
                const qaStartTime = qaActions[0]?.created_at ? 
                    new Date(qaActions[0].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                const qaEndTime = qaActions[qaActions.length - 1]?.created_at ? 
                    new Date(qaActions[qaActions.length - 1].created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "N/A";
                
                // Format PO hours - use same format as other tables (raw decimal)
                const poHours = project.po_hours || project.pohours || project.poHours || 0;
                
                // Format delivery time - ensure only hours and minutes (HH:MM)
                let deliveryTime = "N/A";
                if (project.delivery_time) {
                    try {
                        // If it's a timestamp or ISO string, parse it
                        const timeObj = new Date(project.delivery_time);
                        if (!isNaN(timeObj.getTime())) {
                            deliveryTime = timeObj.toLocaleTimeString('en-US', { 
                                hour12: false, 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                        } else {
                            // If it's already a time string (e.g., "14:30:45"), extract HH:MM
                            const timeStr = String(project.delivery_time);
                            const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
                            if (timeMatch) {
                                const hours = String(parseInt(timeMatch[1])).padStart(2, '0');
                                const minutes = timeMatch[2];
                                deliveryTime = `${hours}:${minutes}`;
                            } else {
                                deliveryTime = project.delivery_time;
                            }
                        }
                    } catch (e) {
                        // If parsing fails, try to extract HH:MM from the string
                        const timeStr = String(project.delivery_time);
                        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
                        if (timeMatch) {
                            const hours = String(parseInt(timeMatch[1])).padStart(2, '0');
                            const minutes = timeMatch[2];
                            deliveryTime = `${hours}:${minutes}`;
                        } else {
                            deliveryTime = project.delivery_time;
                        }
                    }
                }
                
                // Format date as "DD-MM-YYYY" (manually format to ensure hyphens)
                let date = "N/A";
                if (project.created_at) {
                    const dateObj = new Date(project.created_at);
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    date = `${day}-${month}-${year}`;
                }
                
                const deliveredBy = project.created_by ? userIdToNameMap.get(project.created_by) : "N/A";
                
                reportEntries.push({
                    // Job Details
                    job_no: jobNo++,
                    delivered_by: deliveredBy,
                    po: poHours || 0,
                    mail_instruction: project.mail_instruction || "N/A",
                    task_type: task.task_type || "N/A",
                    task_name: task.task_name || "N/A",
                    file_count: fileCount,
                    page_count: pageCount,
                    
                    // DTP Process
                    language: project.language || "N/A", // This might need to come from metadata or another source
                    platform: project.platform || "N/A", // Default or from metadata
                    stage: iterations.find((it: any) => it.current_stage === "Processor" || it.assigned_to_processor_user_id) ? "Completed" : "Pending",
                    date: date,
                    delivery_time: deliveryTime,
                    dtp_person: dtpPerson,
                    dtp_start_time: dtpStartTime,
                    dtp_end_time: dtpEndTime,
                    abbyy_compare_dtp: iterations.length === 0 ? "N/A" : (hasQCCXN ? "Yes" : "No"),
                    dtp_status: dtpPersonId ? "Completed" : "Pending",
                    
                    // QC Tracking
                    qc_taken_by: qcPerson,
                    qc_start_time: qcStartTime,
                    qc_end_time: qcEndTime,
                    abbyy_compare_qc: iterations.length === 0 ? "N/A" : (hasQCCXN ? "Yes" : "No"),
                    qc_status: qcPersonId ? "Completed" : "Pending",
                    qc_cxn_taken: hasQCCXN && qcCXNPersonId ? userIdToNameMap.get(qcCXNPersonId) : "N/A",
                    qc_cxn_start_time: qcCXNStartTime,
                    qc_cxn_end_time: qcCXNEndTime,
                    cxn_status: hasQCCXN ? "Yes" : "N/A",
                    
                    // QA Tracking
                    qa_taken_by: qaPerson,
                    qa_start_time: qaStartTime,
                    qa_end_time: qaEndTime,
                    abbyy_compare_qa: iterations.length === 0 ? "N/A" : (hasQACXN ? "Yes" : "No"),
                    qa_status: qaPersonId ? "Completed" : "Pending",
                    qa_cxn_taken: hasQACXN && qaCXNPersonId ? userIdToNameMap.get(qaCXNPersonId) : "N/A",
                    qa_cxn_start_time: qaCXNStartTime,
                    qa_cxn_end_time: qaCXNEndTime,
                    file_status: project.completion_status ? "RFD" : "In Progress",
                });
            });
        });

        console.log(`DTP Tracking: Found ${reportEntries.length} entries`);
        if (reportEntries.length === 0) {
            console.log("No report entries created. Projects:", projects?.length || 0, "Tasks:", tasks?.length || 0);
        }

        return NextResponse.json(reportEntries);
    } catch (error) {
        console.error("Error fetching DTP Tracking report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}