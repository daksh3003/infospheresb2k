import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try { 
    const { taskId } = await params;

    console.log(taskId);

    // Get stages from task_iterations
    const { data: stages, error: timelineError } = await supabase
      .from("task_iterations")
      .select("stages")
      .eq("task_id", taskId)
      .single();

    if (timelineError) {
      console.error("Error fetching timeline items:", timelineError);
      return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
    }

    const stagesArray = stages.stages;
    const len = stagesArray.length;
    const timelineItems: { id: string; title: string; content: { name: string; storage_name: string; folder_path: string; index: number }[]; completed: boolean; date: string }[] = [];
    let cnt_of_processor = 1;
    let latest_processor_folder_path = "";

    for (let i = 0; i < len; i++) {
      let folder_path = "";
      let storage_name = "";
      let current_stage = "";

      if (stagesArray[i] === "PM") {
        folder_path = taskId;
        storage_name = "task-files";
        current_stage = "PM";
      } else if (stagesArray[i] === "Processor") {
        if (stagesArray[i - 1] === "PM") {
          folder_path = `PM_${taskId}`;
          storage_name = "processor-files";
          current_stage = "Processor (" + cnt_of_processor + ")";
        } else if (stagesArray[i - 1] === "QC") {
          folder_path = `QC_${taskId}`;
          storage_name = "processor-files";
          current_stage = "Processor (" + cnt_of_processor + ")";
        } else if (stagesArray[i - 1] === "QA") {
          folder_path = `QA_${taskId}`;
          storage_name = "processor-files";
          current_stage = "Processor (" + cnt_of_processor + ")";
        }
        latest_processor_folder_path = folder_path;
        cnt_of_processor++;
      } else if (stagesArray[i] === "QC") {
        folder_path = taskId;
        storage_name = "qc-files";
        current_stage = "QC";
      } else if (stagesArray[i] === "QA") {
        folder_path = taskId;
        storage_name = "qa-files";
        current_stage = "QA";
      } else if (stagesArray[i] === "Delivery") {
        // if (cnt_of_processor == 2) {
        //   folder_path = `PM_${taskId}`;
        // } else if (cnt_of_processor == 3) {
        //   folder_path = `QC_${taskId}`;
        // } else if (cnt_of_processor == 4) {
        //   folder_path = `QA_${taskId}`;
        // }
        folder_path = latest_processor_folder_path;
        storage_name = "processor-files";
        current_stage = "Delivery";
      }

      // Get files from storage
      const { data: uploadedFiles, error: uploadedFilesError } =
        await supabase.storage.from(storage_name).list(folder_path);

      if (uploadedFilesError) {
        console.error("Error fetching uploaded files:", uploadedFilesError);
        continue;
      }

      const timelineItem = {
        id: taskId,
        title: current_stage,
        content: uploadedFiles.map((file: { name: string }, index: number) => ({
          name: file.name,
          storage_name,
          folder_path,
          index,
        })),
        completed: true,
        date: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      };

      timelineItems.push(timelineItem);
    }

    return NextResponse.json({ timelineItems });
  } catch (error) {
    console.error('Error in getTaskTimeline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
