import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const { taskId } = await params;

    // Get stages from task_iterations
    const { data: stages, error: timelineError } = await supabase
      .from("task_iterations")
      .select("stages")
      .eq("task_id", taskId)
      .single();

    if (timelineError) {
      return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
    }

    const stagesArray = stages.stages;
    const len = stagesArray.length;
    const timelineItems: { id: string; title: string; content: { name: string; storage_name: string; folder_path: string; index: number; uploaded_by_name: string, uploaded_by_role: string }[]; completed: boolean; date: string }[] = [];
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

      console.log("folder_path", folder_path);
      console.log("storage_name", storage_name);
      console.log("stagesArray", stagesArray);
      console.log("i : ", i)

      // Get files from storage
      const { data: uploadedFiles, error: uploadedFilesError } =
        await supabase.storage.from(storage_name).list(folder_path);

      if (uploadedFilesError) {
        return NextResponse.json({ error: 'Failed to fetch uploaded files' }, { status: 500 });
      }

      // For each file, fetch uploaded_by and original filename from files_test
      const contentWithUploader = await Promise.all(
        uploadedFiles.map(async (file: { name: string }, index: number) => {
          // Construct the file_path that would have been stored in files_test
          // The file.name from storage listing is the sanitized storage filename
          const storagePath = `${folder_path}/${file.name}`;

          // Query files_test for this file using the file_path
          const { data: fileTestData, error: fileTestError } = await supabase
            .from('files_test')
            .select('uploaded_by, file_name')
            .eq('task_id', taskId)
            .eq('file_path', storagePath)
            .maybeSingle();

          let uploaderName = null;
          let uploaderRole = null;
          let originalFileName = file.name; // Default to storage name if no match

          if (!fileTestError && fileTestData) {
            // Use the original filename from files_test table
            originalFileName = fileTestData.file_name || file.name;

            if (fileTestData.uploaded_by) {
              uploaderName = fileTestData.uploaded_by.name || "Unknown";
              uploaderRole = fileTestData.uploaded_by.role || "Unknown";
            }
          } else if (fileTestError) {
            // Error fetching file test data - non-critical
          }

          // Always return a valid object, never undefined
          return {
            name: originalFileName, // Use original filename from database
            storage_name,
            folder_path,
            index,
            uploaded_by_name: uploaderName,
            uploaded_by_role: uploaderRole,
          };
        })
      );

      // Filter out any potential undefined values (though we shouldn't have any now)
      const validContent = contentWithUploader.filter(item => item !== undefined);

      const timelineItem = {
        id: taskId,
        title: current_stage,
        content: validContent,
        completed: true,
        date: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      };

      timelineItems.push(timelineItem);
    }

    return NextResponse.json({ timelineItems });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
