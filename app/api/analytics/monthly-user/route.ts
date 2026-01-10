import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const selectedMonth = searchParams.get('month');
        const userIdsParam = searchParams.get('userIds');
        const teamType = searchParams.get('teamType');

        if (!selectedMonth) {
            return NextResponse.json({ error: 'Month is required' }, { status: 400 });
        }

        const [year, month] = selectedMonth.split('-').map(Number);
        const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0).toISOString();
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

        // Parse user IDs if provided
        let targetUserIds: string[] | null = null;
        if (userIdsParam) {
            targetUserIds = userIdsParam.split(',').filter(Boolean);
        }

        // If team type is provided, fetch users by role
        if (teamType && !targetUserIds) {
            const roleMap: Record<string, string> = {
                "QA": "qaTeam",
                "QC": "qcTeam",
                "Processor": "processor"
            };
            const targetRole = roleMap[teamType];

            if (targetRole) {
                const { data: profiles, error: profilesError } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("role", targetRole);

                if (!profilesError && profiles) {
                    targetUserIds = profiles.map((p: any) => p.id);
                }
            }
        }

        let query = supabase
            .from("task_actions")
            .select("task_id, action_type, metadata, created_at, user_id")
            .gte("created_at", startOfMonth)
            .lte("created_at", endOfMonth)
            .order("created_at", { ascending: true });

        // Filter by user IDs if provided
        if (targetUserIds && targetUserIds.length > 0) {
            query = query.in("user_id", targetUserIds);
        }

        const { data: taskActions, error: actionsError } = await query;

        if (actionsError) {
            console.error("Error fetching task actions:", actionsError);
            return NextResponse.json({ error: actionsError.message }, { status: 500 });
        }

        if (!taskActions || taskActions.length === 0) {
            return NextResponse.json({
                month: selectedMonth,
                dates: [],
                data: [],
            });
        }

        const taskIds = [...new Set(taskActions.map((action: any) => action.task_id))];
        const userIds = [...new Set(taskActions.map((action: any) => action.user_id))];

        // Get tasks to get project_id
        const { data: tasks, error: tasksError } = await supabase
            .from("tasks_test")  // Changed from "task_test" to "tasks_test"
            .select("task_id, project_id")
            .in("task_id", taskIds);

        if (tasksError) {
            console.error("Error fetching tasks:", tasksError);
            return NextResponse.json({ error: `Error fetching tasks: ${tasksError.message}` }, { status: 500 });
        }

        // Create task_id to project_id map
        const taskToProjectMap = new Map();
        if (tasks && tasks.length > 0) {
            tasks.forEach((task: any) => {
                taskToProjectMap.set(task.task_id, task.project_id);
            });
        } else {

        }

        // Get unique project IDs
        const projectIds = [...new Set(Array.from(taskToProjectMap.values()))].filter(Boolean);

        if (projectIds.length === 0) {

            // Return empty data instead of continuing
            return NextResponse.json({
                month: selectedMonth,
                dates: [],
                data: [],
            });
        }

        // Fetch projects_test with all data including po_hours
        const { data: projects, error: projectsError } = await supabase
            .from("projects_test")
            .select("*")
            .in("project_id", projectIds);

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
            return NextResponse.json({ error: `Error fetching projects: ${projectsError.message}` }, { status: 500 });
        }

        if (!projects || projects.length === 0) {

            return NextResponse.json({
                month: selectedMonth,
                dates: [],
                data: [],
            });
        }

        // Create project_id to po_hours map (and store all project data if needed)
        const projectToPOHoursMap = new Map();
        const projectDataMap = new Map();
        if (projects) {
            projects.forEach((project: any) => {
                // Try different possible column names for PO hours
                const pohours = parseFloat(project.po_hours || project.pohours || project.poHours || 0);

                // Debug logging


                projectToPOHoursMap.set(project.project_id, pohours);
                projectDataMap.set(project.project_id, project);
            });
        }

        // Create task_id to po_hours map
        const taskToPOHoursMap = new Map();
        taskToProjectMap.forEach((projectId, taskId) => {
            if (projectId) {
                const pohours = projectToPOHoursMap.get(projectId) || 0;
                taskToPOHoursMap.set(taskId, pohours);


            }
        });

        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", userIds);

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
        }

        const userIdToNameMap = new Map();
        if (profiles) {
            profiles.forEach((profile: any) => {
                userIdToNameMap.set(profile.id, profile.name);
            });
        }

        const userDateDataMap = new Map<string, Map<string, { pages: number, hours: number }>>();
        // Track which tasks have been counted per day to avoid double counting
        const taskDateCounted = new Set<string>(); // Format: "taskId_dateKey"

        taskActions.forEach((action: any) => {
            const metadata = action.metadata || {};
            const userId = action.user_id;
            const taskId = action.task_id;
            const actionDate = new Date(action.created_at);
            const dateKey = `${String(actionDate.getDate()).padStart(2, '0')}-${String(actionDate.getMonth() + 1).padStart(2, '0')}-${actionDate.getFullYear()}`;
            const taskDateKey = `${taskId}_${dateKey}`;

            if (['start', 'complete', 'pause', 'resume', 'upload'].includes(action.action_type)) {
                if (!userDateDataMap.has(userId)) {
                    userDateDataMap.set(userId, new Map());
                }

                const userDateMap = userDateDataMap.get(userId)!;

                if (!userDateMap.has(dateKey)) {
                    userDateMap.set(dateKey, { pages: 0, hours: 0 });
                }

                const dateEntry = userDateMap.get(dateKey)!;

                // Add page count from files_info
                if (metadata.files_info && Array.isArray(metadata.files_info)) {
                    const pageCount = metadata.files_info.reduce((sum: number, file: any) => {
                        return sum + (file.page_count || 0);
                    }, 0);
                    dateEntry.pages += pageCount;
                }

                // Use PO hours from projects_test - count once per task per day for any work action
                if (!taskDateCounted.has(taskDateKey)) {
                    const pohours = taskToPOHoursMap.get(taskId) || 0;
                    if (pohours > 0) {
                        dateEntry.hours += pohours;
                        taskDateCounted.add(taskDateKey);


                    }
                }
            }
        });

        const allDates = new Set<string>();
        userDateDataMap.forEach((dateMap) => {
            dateMap.forEach((entry, dateKey) => {
                allDates.add(dateKey);
            });
        });

        const sortedDates = Array.from(allDates).sort((a, b) => {
            const [dayA, monthA, yearA] = a.split('-').map(Number);
            const [dayB, monthB, yearB] = b.split('-').map(Number);
            return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
        });

        const reportEntries: any[] = [];
        let serialNumber = 1;

        userDateDataMap.forEach((dateMap, userId) => {
            const userName = userIdToNameMap.get(userId) || 'Unknown';
            let totalPages = 0;
            let totalHours = 0;

            const dateColumns: Record<string, { pages: number, hours: number }> = {};
            sortedDates.forEach((dateKey) => {
                const dateData = dateMap.get(dateKey) || { pages: 0, hours: 0 };
                dateColumns[dateKey] = dateData;
                totalPages += dateData.pages;
                totalHours += dateData.hours;
            });

            reportEntries.push({
                s_no: serialNumber++,
                name: userName,
                user_id: userId,
                date_columns: dateColumns,
                total_pages: totalPages,
                total_hours: totalHours.toFixed(1),
                sorted_dates: sortedDates,
            });
        });

        reportEntries.sort((a, b) => a.name.localeCompare(b.name));

        reportEntries.forEach((entry, index) => {
            entry.s_no = index + 1;
        });

        return NextResponse.json({
            month: selectedMonth,
            dates: sortedDates,
            data: reportEntries,
            // Include project data if needed
            project_data: Object.fromEntries(projectDataMap),
        });
    } catch (error) {
        console.error("Error fetching monthly user report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}