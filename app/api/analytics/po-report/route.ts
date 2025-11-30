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

        let query = supabase
            .from("projects_test")
            .select("*")
            .order("created_at", { ascending: false });

        if(startDate) {
            query = query.gte("created_at", new Date(startDate).toISOString());
        }

        if(endDate) {
            query = query.lte("created_at", new Date(endDate).toISOString());
        }

        const { data: projects, error: projectsError } = await query;

        if(projectsError) {
            console.error("Error fetching projects:", projectsError);
            return NextResponse.json({ error: projectsError.message }, { status: 500 });
        }

        if(!projects || projects.length === 0) {
            return NextResponse.json([]);
        }

        const projectIds = projects.map((project: any) => project.project_id);

        const { data: tasks, error: tasksError } = await supabase
            .from("tasks_test")
            .select("task_id, project_id, processor_type")
            .in("project_id", projectIds);

        if(tasksError) {
            console.error("Error fetching tasks:", tasksError);
        }

        const { data: files, error: filesError } = await supabase
            .from("files_test")
            .select("file_id, task_id, page_count")
            .in("task_id", tasks?.map((task: any) => task.task_id) || []);

        if(filesError) {
            console.error("Error fetching files:", filesError);
        }

        // Fetch task_iterations to determine process types (OCR, QC, QA)
        const taskIds = tasks?.map((task: any) => task.task_id) || [];
        const { data: taskIterations, error: iterationsError } = await supabase
            .from("task_iterations")
            .select("task_id, current_stage")
            .in("task_id", taskIds);

        if(iterationsError) {
            console.error("Error fetching task iterations:", iterationsError);
        }

        // Create task_id to stages map
        const taskToStagesMap = new Map<string, Set<string>>();
        if(taskIterations) {
            taskIterations.forEach((iteration: any) => {
                if(!taskToStagesMap.has(iteration.task_id)) {
                    taskToStagesMap.set(iteration.task_id, new Set());
                }
                const stages = taskToStagesMap.get(iteration.task_id)!;
                // Map "Processor" to "OCR" for display
                if(iteration.current_stage === "Processor") {
                    stages.add("OCR");
                } else if(iteration.current_stage === "QC") {
                    stages.add("QC");
                } else if(iteration.current_stage === "QA") {
                    stages.add("QA");
                } else if(iteration.current_stage === "Delivery") {
                    stages.add("Delivery");
                }
            });
        }

        const projectToTasksMap = new Map<string, any[]>();
        if(tasks) {
            tasks.forEach((task: any) => {
                if(!projectToTasksMap.has(task.project_id)) {
                    projectToTasksMap.set(task.project_id, []);
                }
                projectToTasksMap.get(task.project_id)!.push(task);
            });
        }

        const taskToFileMap = new Map<string, any[]>();
        if(files) {
            files.forEach((file: any) => {
                if(!taskToFileMap.has(file.task_id)) {
                    taskToFileMap.set(file.task_id, []);
                }
                taskToFileMap.get(file.task_id)!.push(file);
            });
        }

        
        const reportEntries: any[] = [];
        let serialNumber = 1;

        projects.forEach((project: any) => {
            const projectTasks = projectToTasksMap.get(project.project_id) || [];
            let receivedPages = 0;
            let outputPages = 0;
            const processTypeSet = new Set<string>();

            // Collect all process types from task iterations
            projectTasks.forEach((task: any) => {
                const taskStages = taskToStagesMap.get(task.task_id);
                if(taskStages) {
                    taskStages.forEach((stage) => {
                        processTypeSet.add(stage);
                    });
                }
                const taskFiles = taskToFileMap.get(task.task_id) || [];
                taskFiles.forEach((file: any) => {
                    const pageCount = file.page_count || 0;
                    receivedPages += pageCount;
                    outputPages += pageCount;
                });
            });

            const receivedDate = project.created_at
                ? new Date(project.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
                : 'N/A';

            const deliveryDate = project.delivery_date
                ? new Date(project.delivery_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
                : 'N/A';

            const pohours = project.po_hours || project.pohours || project.poHours || 0;

            const status = project.completion_status ? 'Delivered' : 'In Progress';

            // Sort process types: OCR, QC, QA, Delivery
            const processTypes = Array.from(processTypeSet);
            const sortedProcessTypes = ['OCR', 'QC', 'QA', 'Delivery'].filter(type => processTypes.includes(type));

            // Create separate record for each process type
            if(sortedProcessTypes.length > 0) {
                sortedProcessTypes.forEach((processType) => {
                    reportEntries.push({ 
                        s_no: serialNumber++,
                        received_date: receivedDate,
                        project_name: project.project_name || 'N/A',
                        received_pages: receivedPages,
                        process: processType,
                        po_hours: pohours,
                        output_pages: outputPages,
                        delivery_date: deliveryDate,
                        status: status,
                        po_status: project.po_status || 'N/A',
                        po_number: project.po_number || project.poNumber || 'N/A',
                    });
                });
            } else {
                // If no process types found, create one record with 'N/A'
                reportEntries.push({ 
                    s_no: serialNumber++,
                    received_date: receivedDate,
                    project_name: project.project_name || 'N/A',
                    received_pages: receivedPages,
                    process: 'N/A',
                    po_hours: pohours,
                    output_pages: outputPages,
                    delivery_date: deliveryDate,
                    status: status,
                    po_status: project.po_status || 'N/A',
                    po_number: project.po_number || project.poNumber || 'N/A',
                });
            }
        });

        return NextResponse.json(reportEntries);
    } catch(error) {
        console.error("Error fetching PO report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}