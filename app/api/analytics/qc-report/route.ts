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

        let startOfRange: Date;
        let endOfRange: Date;

        if(startDate && endDate) {
            startOfRange = new Date(startDate);
            startOfRange.setHours(0, 0, 0, 0);
            endOfRange = new Date(endDate);
            endOfRange.setHours(23, 59, 59, 999);
        } else if(startDate) {
            startOfRange = new Date(startDate);
            startOfRange.setHours(0, 0, 0, 0);
            endOfRange = new Date();
            endOfRange.setHours(23, 59, 59, 999);
        } else {
            endOfRange = new Date();
            endOfRange.setHours(23, 59, 59, 999);
            startOfRange = new Date();
            startOfRange.setDate(startOfRange.getDate() - 30);
            startOfRange.setHours(0, 0, 0, 0);
        }

        let query = supabase
            .from("task_actions")
            .select("task_id, user_id, action_type, metadata, created_at")
            .gte("created_at", startOfRange.toISOString())
            .lte("created_at", endOfRange.toISOString())
            .order("created_at", { ascending: false });

        const { data: taskActions, error: actionsError } = await query;

        if(actionsError) {
            console.error("Error fetching task actions:", actionsError);
            return NextResponse.json({ error: actionsError.message }, { status: 500 });
        }

        if(!taskActions || taskActions.length === 0) {
            return NextResponse.json([]);
        }

        const qcActions = taskActions.filter((action: any) => {
            const metadata = action.metadata || {};
            const currentStage = metadata.current_stage || metadata.upload_stage || "Unknown";
            return currentStage === "QC";
        });
        
        if(qcActions.length === 0) {
            return NextResponse.json([]);
        }

        const taskIds = [...new Set(qcActions.map((action: any) => action.task_id))];
        const userIds = [...new Set(qcActions.map((action: any) => action.user_id))];
        
        const { data: tasks, error: tasksError } = await supabase
            .from("tasks_test")
            .select("task_id, project_id")
            .in("task_id", taskIds);

        if(tasksError) {
            console.error("Error fetching tasks:", tasksError);
            return NextResponse.json({ error: tasksError.message }, { status: 500 });
        }

        const taskToProjectMap = new Map();
        if(tasks) {
            tasks.forEach((task: any) => {
                taskToProjectMap.set(task.task_id, task.project_id);
            });
        }
        
        const projectIds = [...new Set(Array.from(taskToProjectMap.values()))].filter(Boolean);
        const { data: projects, error: projectsError } = await supabase
            .from("projects_test")
            .select("project_id, project_name, po_hours")
            .in("project_id", projectIds);

        if(projectsError) {
            console.error("Error fetching projects:", projectsError);
            return NextResponse.json({ error: projectsError.message }, { status: 500 });
        }

        const projectToNameMap = new Map();
        const projectToPOHoursMap = new Map();
        if(projects) {
            projects.forEach((project: any) => {
                projectToNameMap.set(project.project_id, project.project_name);
                const pohours = project.po_hours || project.pohours || project.poHours || 0;
                projectToPOHoursMap.set(project.project_id, pohours);
            });
        }

        const { data: files, error: filesError } = await supabase
            .from("files_test")
            .select("file_id, task_id, file_name")
            .in("task_id", taskIds);

        if(filesError) {
            console.error("Error fetching files:", filesError);
            return NextResponse.json({ error: filesError.message }, { status: 500 });
        }

        const taskToFileMap = new Map();
        if(files) {
            files.forEach((file: any) => {
                if(!taskToFileMap.has(file.task_id)) {
                    taskToFileMap.set(file.task_id, file.file_name);
                }
            });
        }
        
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", userIds);

        if(profilesError) {
            console.error("Error fetching profiles:", profilesError);
            return NextResponse.json({ error: profilesError.message }, { status: 500 });
        }

        const userIdToNameMap = new Map();
        if(profiles) {
            profiles.forEach((profile: any) => {
                userIdToNameMap.set(profile.id, profile.name);
            });
        }

        const taskGroups = new Map<string, any[]>();
        qcActions.forEach((action: any) => {
            const taskId = action.task_id;
            if(!taskGroups.has(taskId)) {
                taskGroups.set(taskId, []);
            }
            taskGroups.get(taskId)!.push(action);
        });

        const reportEntries: any[] = [];

        taskGroups.forEach((actions, taskId) => {
            actions.sort((a, b) => {
                const timeA = a.metadata?.timestamp || a.created_at;
                const timeB = b.metadata?.timestamp || b.created_at;
                return new Date(timeA).getTime() - new Date(timeB).getTime();
            });

            for(let i=0; i<actions.length; i++) {
                const action = actions[i];
                const metadata = action.metadata || {};
                const timestamp = metadata.timestamp || action.created_at;
                const actionDate = new Date(timestamp);

                if(['start', 'complete', 'pause', 'resume', 'upload'].includes(action.action_type)) {
                    const currentStage = metadata.current_stage || metadata.upload_stage || "Unknown";

                    if(currentStage !== "QC") continue;

                    let pageCount = 0;
                    if(metadata.files_info && Array.isArray(metadata.files_info)) {
                        pageCount = metadata.files_info.reduce((sum: number, file: any) => {
                            return sum + (file.page_count || 0);
                        }, 0);
                    }

                    const projectId = taskToProjectMap.get(taskId);
                    const clientName = "N/A";
                    const filename = taskToFileMap.get(taskId) || "N/A";
                    const poHours = projectId ? (projectToPOHoursMap.get(projectId) || 0) : 0;
                    const username = metadata.user_name || userIdToNameMap.get(action.user_id) || "N/A";

                    let endTime = timestamp;
                    if(i < actions.length - 1) {
                        const nextAction = actions[i + 1];
                        endTime = nextAction.metadata?.timestamp || nextAction.created_at;
                    } else {
                        const defaultEndTime = new Date(timestamp);
                        defaultEndTime.setMinutes(defaultEndTime.getMinutes() + 10);
                        endTime = defaultEndTime.toISOString();
                    }

                    const startTimeObj = new Date(timestamp);
                    const endTimeObj = new Date(endTime);
                    const diffMs = endTimeObj.getTime() - startTimeObj.getTime();
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const hours = Math.floor(diffMins / 60);
                    const minutes = diffMins % 60;
                    const totalWorkingHours = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    
                    const day = String(actionDate.getDate()).padStart(2, '0');
                    const month = String(actionDate.getMonth() + 1).padStart(2, '0');
                    const year = actionDate.getFullYear();
                    const workingDate = `${day}-${month}-${year}`;

                    const startTime = startTimeObj.toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    const endTimeFormatted = endTimeObj.toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    reportEntries.push({
                        working_date: workingDate,
                        name: username,
                        client_name: clientName,
                        file_name: filename,
                        work_type: currentStage,
                        page_no: pageCount,
                        start_time: startTime,
                        end_time: endTimeFormatted,
                        total_working_hours: totalWorkingHours,
                        po: poHours,
                    });
                }
            }
        });

        reportEntries.sort((a, b) => {
            const dateA = new Date(a.working_date.split('-').reverse().join('-'));
            const dateB = new Date(b.working_date.split('-').reverse().join('-'));
            if(dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime();
            }
            const timeA = a.start_time.split(':').map(Number);
            const timeB = b.start_time.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });

        return NextResponse.json(reportEntries);
    } catch (error) {
        console.error("Error fetching QC report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}