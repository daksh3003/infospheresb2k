import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("task_iterations")
      .select(
        `
        id, 
        current_stage, 
        status, 
        task_id, 
        iteration_number, 
        tasks_test ( task_name, task_id, project_id )
      `
      )
      .eq("current_stage", "QC");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (data && data.length > 0) {
      const processedTasks = data.map((item: { id: number; current_stage: string; status: string | null; task_id: string; iteration_number: number | null; tasks_test: { task_name: string; task_id: string; project_id: string }[] | null }) => ({
        projectId: item.tasks_test?.[0]?.project_id || item.task_id || "unknown",
        projectName: item.tasks_test?.[0]?.task_name || "No Project Name",
        projectTaskId: item.tasks_test?.[0]?.task_id || null,
        clientInstruction: null,
        deliveryDate: null,
        processType: null,
        poHours: null,
        isProjectOverallComplete: false,
        taskIterationId: item.id,
        iterationNumber: item.iteration_number || 1,
        currentStage: item.current_stage,
        status: item.status || null,
        iterationNotes: null,
        currentFileVersionId: null,
        currentFileName: null,
        calculatedStatus: "pending",
        calculatedPriority: "medium",
        displayId: item.id,
        displayTitle: item.tasks_test?.[0]?.task_name || "No Project Name",
        displayDescription: `Status: ${item.status || "N/A"}`,
        displayDueDate: null,
        displayAssignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
        title: item.tasks_test?.[0]?.task_name || "No Project Name",
        description: `Status: ${item.status || "N/A"}`,
        // status: "pending",
        priority: "medium",
        dueDate: "",
        assignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
      }));

      // Get unique project IDs and fetch their names and delivery info
      const uniqueProjectIds = [
        ...new Set(processedTasks.map((task) => task.projectId)),
      ];

      const { data: projectNamesData, error: projectNamesError } = await supabase
        .from("projects_test")
        .select("project_id, project_name, delivery_date, delivery_time")
        .in("project_id", uniqueProjectIds);

      if (projectNamesError) {
        console.error("Error fetching project names:", projectNamesError);
      }

      const projectNameMap = projectNamesData?.reduce(
        (
          acc: {
            [key: string]: {
              name: string;
              delivery_date: string;
              delivery_time: string;
            };
          },
          project
        ) => {
          acc[project.project_id] = {
            name: project.project_name,
            delivery_date: project.delivery_date,
            delivery_time: project.delivery_time,
          };
          return acc;
        },
        {}
      ) || {};

      return NextResponse.json({
        tasks: processedTasks,
        projectNames: projectNameMap,
      });
    }

    return NextResponse.json({
      tasks: [],
      projectNames: {},
    });

  } catch (error: unknown) {
    console.error('QC Dashboard error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
