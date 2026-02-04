import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const selectedDate = searchParams.get('date');

        if(!userId || !selectedDate) {
            return NextResponse.json({ error: 'User ID and date are required' }, { status: 400 });
        }

        const dateObj = new Date(selectedDate);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();

        // Updated: taskaction table with correct column names
        const { data: taskActions, error: actionsError } = await supabase
            .from("task_actions")
            .select("task_id, action_type, metadata, created_at")
            .eq("user_id", userId)
            .gte("created_at", startOfDay)
            .lte("created_at", endOfDay)
            .order("created_at", { ascending: false });

        if(actionsError) {
            console.error("Error fetching task actions:", actionsError);
            return NextResponse.json({ error: actionsError.message }, { status: 500 });
        }

        if(!taskActions || taskActions.length === 0) {
            return NextResponse.json([]);
        }

        const taskIds = [...new Set(taskActions.map((action: any) => action.task_id))]; // Fixed: task_id instead of taskid

        // Updated: task_test table (correct name)
        const { data: tasks, error: tasksError } = await supabase
            .from("task_test")
            .select("task_id, project_id, task_name")
            .in("task_id", taskIds);

        if(tasksError) {
            console.error("Error fetching tasks:", tasksError);
        }

        const taskToProjectMap = new Map();
        const taskToNameMap = new Map();
        if(tasks) {
            tasks.forEach((task: any) => {
                taskToProjectMap.set(task.task_id, task.project_id);
                taskToNameMap.set(task.task_id, task.task_name || "N/A");
            });
        }

        const projectIds = [...new Set(Array.from(taskToProjectMap.values()))];

        // Updated: projecttest table with correct column names
        const { data: projects, error: projectsError } = await supabase
            .from("projects_test")
            .select("project_id, project_name")
            .in("project_id", projectIds);

        if(projectsError) {
            console.error("Error fetching projects:", projectsError);
        }
        
        const projectToNameMap = new Map();
        if(projects) {
            projects.forEach((project: any) => {
                projectToNameMap.set(project.project_id, project.project_name); // Fixed: project_id and project_name
            });
        }
        
        // Updated: filetest table with correct column names
        const { data: files, error: filesError } = await supabase
            .from("files_test")
            .select("file_id, task_id, file_name")
            .in("task_id", taskIds);

        if(filesError) {
            console.error("Error fetching files:", filesError);
        }

        const taskToFileMap = new Map();
        if(files) {
            files.forEach((file: any) => {
                taskToFileMap.set(file.task_id, file.file_id); // Fixed: task_id and file_id
            });
        }

        // Updated: use profiles table (plural) to match other routes
        const { data: profile, error: profilesError } = await supabase
            .from("profiles")  // Changed from "profile" to "profiles"
            .select("id, name")
            .eq("id", userId)
            .single();
        
        const userName = profile?.name || 'Unknown';
        const reportEntries: any[] = [];
        const taskGroups = new Map<string, any[]>();

        taskActions.forEach((action: any) => {
            const taskId = action.task_id; 
            if(!taskGroups.has(taskId)) {
                taskGroups.set(taskId, []);
            }
            taskGroups.get(taskId)!.push(action);
        });

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

                // Process actions that have work information (start, complete, upload, etc.)
                if (['start', 'complete', 'pause', 'resume', 'upload'].includes(action.action_type)) {
                    // Get current_stage from metadata - this is the work_type
                    const currentStage = metadata.current_stage || metadata.upload_stage || "Unknown";
                    
                    // Get page count from files_info array
                    let pageCount = 0;
                    if (metadata.files_info && Array.isArray(metadata.files_info)) {
                        // Sum page_count from all files
                        pageCount = metadata.files_info.reduce((sum: number, file: any) => {
                            return sum + (file.page_count || 0);
                        }, 0);
                    }
                    
                    const fileId = taskToFileMap.get(taskId) || "N/A";
                    const projectId = taskToProjectMap.get(taskId);
                    const clientName = projectId ? (projectToNameMap.get(projectId) || "N/A") : "N/A";
                    const taskName = taskToNameMap.get(taskId) || "N/A";
                    const projectName = projectToNameMap.get(projectId) || "N/A";
                    
                    // Use user_name from metadata if available, otherwise use profile name
                    const displayName = metadata.user_name || userName;

                    // Find end time (next action or complete)
                    let endTime = timestamp;
                    if (i < actions.length - 1) {
                        const nextAction = actions[i + 1];
                        endTime = nextAction.metadata?.timestamp || nextAction.created_at;
                    } else {
                        endTime = timestamp;
                    }

                    const startTime = new Date(timestamp);
                    const endTimeDate = new Date(endTime);
                    
                    // Calculate total working time in hours
                    const timeDifference = endTimeDate.getTime() - startTime.getTime();
                    const totalWorkingHours = timeDifference / (1000 * 60 * 60); // Convert milliseconds to hours
                    
                    // Format as HH:MM
                    const hours = Math.floor(totalWorkingHours);
                    const minutes = Math.floor((totalWorkingHours - hours) * 60);
                    const totalWorkingTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

                    reportEntries.push({
                        s_no: reportEntries.length + 1,
                        year: actionDate.getFullYear(),
                        month: actionDate.toLocaleString('en-US', { month: 'long' }),
                        working_date: actionDate.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }),
                        name: displayName,
                        client_name: clientName,
                        task_name: taskName,
                        project_name: projectName,
                        file_no: fileId,
                        work_type: currentStage, 
                        no_of_pages: pageCount,
                        start_time: actionDate.toLocaleTimeString('en-US', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        }),
                        end_time: new Date(endTime).toLocaleTimeString('en-US', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        }),
                        total_working_time: totalWorkingTime,
                    });
                }
            }
        });

        // Sort by start_time
        reportEntries.sort((a, b) => {
            if (!a.start_time || !b.start_time) {
                return 0;
            }
            const timeA = a.start_time.split(':').map(Number);
            const timeB = b.start_time.split(':').map(Number);
            if (timeA.length < 2 || timeB.length < 2) {
                return 0;
            }
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });

        reportEntries.forEach((entry, index) => {
            entry.s_no = index + 1;
        });

        return NextResponse.json(reportEntries);
    } catch (error) {
        console.error("Error fetching daily user report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}