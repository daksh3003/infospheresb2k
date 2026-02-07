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

        // Process each task group and merge consecutive actions
        taskGroups.forEach((actions, taskId) => {
            actions.sort((a, b) => {
                const timeA = a.metadata?.timestamp || a.created_at; 
                const timeB = b.metadata?.timestamp || b.created_at; 
                return new Date(timeA).getTime() - new Date(timeB).getTime();
            });

            // Filter to only relevant actions
            const relevantActions = actions.filter((action: any) => 
                ['start', 'complete', 'pause', 'resume', 'upload'].includes(action.action_type)
            );

            if (relevantActions.length === 0) return;

            // Get common task information
            const fileId = taskToFileMap.get(taskId) || "N/A";
            const projectId = taskToProjectMap.get(taskId);
            const clientName = projectId ? (projectToNameMap.get(projectId) || "N/A") : "N/A";
            const taskName = taskToNameMap.get(taskId) || "N/A";
            const projectName = projectToNameMap.get(projectId) || "N/A";

            // Process first action to get initial values
            const firstAction = relevantActions[0];
            const firstMetadata = firstAction.metadata || {};
            const firstTimestamp = firstMetadata.timestamp || firstAction.created_at;
            const firstDate = new Date(firstTimestamp);
            
            // Determine work type from first action
            const currentStage = firstMetadata.current_stage || firstMetadata.upload_stage || "Unknown";
            const sentBy = firstMetadata.sent_by || "";
            let displayWorkType = currentStage;
            const currentStageUpper = String(currentStage).toUpperCase();
            const sentByUpper = String(sentBy).toUpperCase().trim();

            if (currentStageUpper === "PROCESSOR") {
                if (sentByUpper === "QC") {
                    displayWorkType = "QC CXN";
                } else if (sentByUpper === "QA") {
                    displayWorkType = "QA CXN";
                }
            }

            // Get page count from first action (or sum if multiple files)
            let pageCount = 0;
            if (firstMetadata.files_info && Array.isArray(firstMetadata.files_info)) {
                pageCount = firstMetadata.files_info.reduce((sum: number, file: any) => {
                    return sum + (file.page_count || 0);
                }, 0);
            }

            const displayName = firstMetadata.user_name || userName;

            // Use first action's start time and last action's end time
            const startTime = new Date(firstTimestamp);
            const lastAction = relevantActions[relevantActions.length - 1];
            const lastMetadata = lastAction.metadata || {};
            const lastTimestamp = lastMetadata.timestamp || lastAction.created_at;
            const endTime = new Date(lastTimestamp);

            // Calculate total working time
            const timeDifference = endTime.getTime() - startTime.getTime();
            const totalWorkingHours = timeDifference / (1000 * 60 * 60);
            const hours = Math.floor(totalWorkingHours);
            const minutes = Math.floor((totalWorkingHours - hours) * 60);
            const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
            const totalWorkingTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            // Create a single merged entry for this task
            reportEntries.push({
                s_no: reportEntries.length + 1,
                year: firstDate.getFullYear(),
                month: firstDate.toLocaleString('en-US', { month: 'long' }),
                working_date: firstDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }),
                name: displayName,
                client_name: clientName,
                task_name: taskName,
                project_name: projectName,
                file_no: fileId,
                work_type: displayWorkType, 
                no_of_pages: pageCount,
                start_time: startTime.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                end_time: endTime.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                total_working_time: totalWorkingTime,
            });
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

        // Merge consecutive entries with same file_no (same task), regardless of work_type/phases
        // This ensures one record per task even if it goes through multiple phases (QC → QA → Processor)
        const mergedEntries: any[] = [];
        const mergeKey = (entry: any) => `${entry.file_no}_${entry.working_date}`;
        
        const parseTimeToSeconds = (timeStr: string) => {
            const parts = timeStr.split(':').map(Number);
            return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
        };

        for (let i = 0; i < reportEntries.length; i++) {
            const current = reportEntries[i];
            const currentKey = mergeKey(current);
            
            // Check if we can merge with previous entry
            if (mergedEntries.length > 0) {
                const last = mergedEntries[mergedEntries.length - 1];
                const lastKey = mergeKey(last);
                
                // If same file and date, check if times are consecutive (within 5 seconds)
                // This merges all phases of the same task into one record
                if (currentKey === lastKey) {
                    const lastEndSeconds = parseTimeToSeconds(last.end_time);
                    const currentStartSeconds = parseTimeToSeconds(current.start_time);
                    const timeGap = currentStartSeconds - lastEndSeconds;
                    
                    // Merge if times are consecutive or within 5 seconds (to handle small timing differences)
                    if (timeGap >= 0 && timeGap <= 5) {
                        // Merge: update end time and recalculate total working time
                        last.end_time = current.end_time;
                        
                        // Recalculate total working time from start_time and end_time strings
                        const startSeconds = parseTimeToSeconds(last.start_time);
                        const endSeconds = parseTimeToSeconds(current.end_time);
                        const totalSeconds = endSeconds - startSeconds;
                        
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        last.total_working_time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                        
                        // Use the most recent work_type (last phase)
                        last.work_type = current.work_type;
                        
                        // Sum page counts if they differ
                        if (current.no_of_pages > 0 && last.no_of_pages !== current.no_of_pages) {
                            last.no_of_pages = Math.max(last.no_of_pages, current.no_of_pages);
                        }
                        continue;
                    }
                }
            }
            
            // Can't merge, add as new entry
            mergedEntries.push({ ...current });
        }

        // Update serial numbers
        mergedEntries.forEach((entry, index) => {
            entry.s_no = index + 1;
        });

        return NextResponse.json(mergedEntries);
    } catch (error) {
        console.error("Error fetching daily user report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}