import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        let startOfMonth: Date;
        let endOfMonth: Date;

        if(month) {
            const [year, monthNum] = month.split('-').map(Number);
            startOfMonth = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
            endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);
        } else {
            const now = new Date();
            startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        
        const { data: taskActions, error: actionsError } = await supabase
            .from("task_actions")
            .select("task_id, action_type, metadata, created_at, user_id")
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString())
            .order("created_at", { ascending: false });

        if(actionsError) {
            console.error("Error fetching task actions:", actionsError);
            return NextResponse.json({ error: actionsError.message }, { status: 500 });
        }

        if(!taskActions || taskActions.length === 0) {
            return NextResponse.json([]);
        }

        const taskIds = [...new Set(taskActions.map((action: any) => action.task_id))];
        const userIds = [...new Set(taskActions.map((action: any) => action.user_id))];

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
            .select("file_id, task_id, file_name, page_count")
            .in("task_id", taskIds);

        if(filesError) {
            console.error("Error fetching files:", filesError);
            return NextResponse.json({ error: filesError.message }, { status: 500 });
        }
        
        const taskToFileMap = new Map();
        const taskToPageCountMap = new Map();
        if(files) {
            files.forEach((file: any) => {
                if(!taskToFileMap.has(file.task_id)) {
                    taskToFileMap.set(file.task_id, file.file_name);
                }
                if(file.page_count) {
                    const currentCount = taskToPageCountMap.get(file.task_id) || 0;
                    taskToPageCountMap.set(file.task_id, currentCount + (file.page_count || 0));
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
        taskActions.forEach((action: any) => {
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

                    let pageCount = 0;
                    if(metadata.files_info && Array.isArray(metadata.files_info)) {
                        pageCount = metadata.files_info.reduce((sum: number, file: any) => {
                            return sum + (file.page_count || 0);
                        }, 0);
                    }
                    
                    // Use page count from files_test as fallback if metadata doesn't have it
                    if (pageCount === 0) {
                        pageCount = taskToPageCountMap.get(taskId) || 0;
                    }

                    const projectId = taskToProjectMap.get(taskId);
                    const clientName = projectId ? (projectToNameMap.get(projectId) || "N/A") : "N/A";
                    const jobNo  = taskToFileMap.get(taskId) || "N/A";
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
                    let shift = "Day";
                    const startHour = startTimeObj.getHours();
                    if(startHour >= 18) {
                        shift = "Night";
                    }
                    const diffMs = endTimeObj.getTime() - startTimeObj.getTime();
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const hours = Math.floor(diffMins / 60);
                    const minutes = diffMins % 60;
                    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
                    const totalTimeTaken = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

                    // Format date as "DD-MM-YYYY" (manually format to ensure hyphens)
                    const day = String(actionDate.getDate()).padStart(2, '0');
                    const month = String(actionDate.getMonth() + 1).padStart(2, '0');
                    const year = actionDate.getFullYear();
                    const date = `${day}-${month}-${year}`;

                    const startTime = startTimeObj.toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });

                    const endTimeFormatted = endTimeObj.toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });

                    reportEntries.push({
                        date: date,
                        name: username,
                        client: clientName,
                        job_no: jobNo,
                        process: currentStage,
                        page_count: pageCount,
                        start_time: startTime,
                        end_time: endTimeFormatted,
                        total_time_taken: totalTimeTaken,
                        shift: shift,
                        po: poHours,
                    });
                }
            }
        });

        reportEntries.sort((a, b) => {
            const dateA = new Date(a.date.split('-').reverse().join('-'));
            const dateB = new Date(b.date.split('-').reverse().join('-'));
            if(dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime();
            }
            const timeA = a.start_time.split(':').map(Number);
            const timeB = b.start_time.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });

        // Group entries by job_no and date first, then merge within each group
        const groupedByFile = new Map<string, any[]>();

        reportEntries.forEach(entry => {
            const key = `${entry.job_no}_${entry.date}`;
            if (!groupedByFile.has(key)) {
                groupedByFile.set(key, []);
            }
            groupedByFile.get(key)!.push(entry);
        });

        const parseTimeToSeconds = (timeStr: string) => {
            const parts = timeStr.split(':').map(Number);
            return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
        };

        const mergedEntries: any[] = [];

        // Process each job group
        groupedByFile.forEach((entries, key) => {
            // Sort entries within this job group by start time
            entries.sort((a, b) => {
                const timeA = parseTimeToSeconds(a.start_time);
                const timeB = parseTimeToSeconds(b.start_time);
                return timeA - timeB;
            });

            // Merge consecutive entries within this job group
            for (let i = 0; i < entries.length; i++) {
                const current = entries[i];
                
                if (mergedEntries.length > 0) {
                    const last = mergedEntries[mergedEntries.length - 1];
                    const lastKey = `${last.job_no}_${last.date}`;
                    
                    // Only merge if it's the same job and date
                    if (lastKey === key) {
                        const lastEndSeconds = parseTimeToSeconds(last.end_time);
                        const currentStartSeconds = parseTimeToSeconds(current.start_time);
                        const timeGap = currentStartSeconds - lastEndSeconds;
                        
                        // Merge if gap is 5 seconds or less
                        if (timeGap >= 0 && timeGap <= 5) {
                            last.end_time = current.end_time;
                            const startSeconds = parseTimeToSeconds(last.start_time);
                            const endSeconds = parseTimeToSeconds(current.end_time);
                            const totalSeconds = endSeconds - startSeconds;
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            last.total_time_taken = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                            last.process = current.process;
                            if (current.page_count > 0 && last.page_count !== current.page_count) {
                                last.page_count = Math.max(last.page_count, current.page_count);
                            }
                            continue;
                        }
                    }
                }
                
                mergedEntries.push({ ...current });
            }
        });

        // Final sort by date and time across all entries
        mergedEntries.sort((a, b) => {
            const dateA = new Date(a.date.split('-').reverse().join('-'));
            const dateB = new Date(b.date.split('-').reverse().join('-'));
            if(dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime();
            }
            const timeA = parseTimeToSeconds(a.start_time);
            const timeB = parseTimeToSeconds(b.start_time);
            return timeA - timeB;
        });

        // Add serial numbers after all merging and sorting
        mergedEntries.forEach((entry, index) => {
            entry.s_no = index + 1;
        });

        return NextResponse.json(mergedEntries);
    } catch (error) {
        console.error("Error fetching DTP report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}