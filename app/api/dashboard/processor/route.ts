import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("task_iterations")
      .select(
        `
        id, 
        current_stage, 
        status_flag, 
        task_id, 
        iteration_number, 
        tasks_test ( task_name, task_id, project_id )
      `
      )
      .eq("current_stage", "Processor");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (data && data.length > 0) {
      const processedTasks = data.map((item: any) => ({
        projectId: item.tasks_test?.project_id || item.task_id || "unknown",
        projectName: item.tasks_test?.task_name || "No Project Name",
        projectTaskId: item.tasks_test?.task_id || null,
        clientInstruction: null,
        deliveryDate: null,
        deliveryTime: null,
        processType: null,
        poHours: null,
        isProjectOverallComplete: false,
        taskIterationId: item.id,
        iterationNumber: item.iteration_number || 1,
        currentStage: item.current_stage,
        statusFlag: item.status_flag || null,
        iterationNotes: null,
        currentFileVersionId: null,
        currentFileName: null,
        calculatedStatus: "pending",
        calculatedPriority: "medium",
        displayId: item.id,
        displayTitle: item.tasks_test?.task_name || "No Project Name",
        displayDescription: `Status Flag: ${item.status_flag || "N/A"}`,
        displayDueDate: null,
        displayAssignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
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

  } catch (error: any) {
    console.error('Processor Dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
