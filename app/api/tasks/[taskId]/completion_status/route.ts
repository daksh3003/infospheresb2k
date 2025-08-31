import { NextRequest } from 'next/server';
import { supabase } from "@/utils/supabase";


export async function POST(request: NextRequest) {
    const { taskId, projectId } = await request.json();

    const { error } = await supabase
          .from("tasks_test")
          .update({
            completion_status: true,
          })
          .eq("task_id", taskId);

        if (error) {
          console.error("Error updating task:", error);
          return;
        }

        // check all the tasks mapped to the same project are completed or not
        const { data: projectTasks, error: projectTasksError } = await supabase
          .from("tasks_test")
          .select("completion_status")
          .eq("project_id", projectId);

        console.log("projectTasks", projectTasks);

        if (projectTasksError) {
          console.error("Error fetching project tasks:", projectTasksError);
          return;
        }

        const isAllTasksCompleted = projectTasks.every(
          (task) => task.completion_status
        );

        console.log("isAllTasksCompleted", isAllTasksCompleted);

        if (isAllTasksCompleted) {
          const { error: projectError } = await supabase
            .from("projects_test")
            .update({ completion_status: true })
            .eq("project_id", projectId);

          if (projectError) {
            console.error("Error updating project:", projectError);
            return;
          }
        }

        
}   