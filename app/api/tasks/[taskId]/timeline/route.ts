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

      // Helper function to fetch files with uploader info from a specific storage
      const fetchFilesFromStorage = async (
        storageName: string,
        folderPath: string,
        startIndex: number = 0
      ) => {
        const { data: files, error: filesError } =
          await supabase.storage.from(storageName).list(folderPath);

        if (filesError || !files) {
          return [];
        }

        const filesWithUploader = await Promise.all(
          files.map(async (file: { name: string }, index: number) => {
            const storagePath = `${folderPath}/${file.name}`;

            const { data: fileTestData, error: fileTestError } = await supabase
              .from('files_test')
              .select('uploaded_by, file_name')
              .eq('task_id', taskId)
              .eq('file_path', storagePath)
              .maybeSingle();

            let uploaderName = null;
            let uploaderRole = null;
            let originalFileName = file.name;

            if (!fileTestError && fileTestData) {
              originalFileName = fileTestData.file_name || file.name;

              if (fileTestData.uploaded_by) {
                uploaderName = fileTestData.uploaded_by.name || "Unknown";
                uploaderRole = fileTestData.uploaded_by.role || "Unknown";
              }
            }

            return {
              name: originalFileName,
              storage_name: storageName,
              folder_path: folderPath,
              index: startIndex + index,
              uploaded_by_name: uploaderName,
              uploaded_by_role: uploaderRole,
            };
          })
        );

        return filesWithUploader.filter(item => item !== undefined);
      };

      // For Delivery stage, fetch files from processor, QC, and QA storages
      let validContent: any[] = [];

      if (current_stage === "Delivery") {
        // Fetch processor files
        const processorFiles = await fetchFilesFromStorage(storage_name, folder_path, 0);

        // Fetch QC files if they exist
        const qcFiles = await fetchFilesFromStorage("qc-files", taskId, processorFiles.length);

        // Fetch QA files if they exist
        const qaFiles = await fetchFilesFromStorage("qa-files", taskId, processorFiles.length + qcFiles.length);

        // Combine all files
        validContent = [...processorFiles, ...qcFiles, ...qaFiles];
      } else {
        // For non-Delivery stages, use original logic
        const { data: uploadedFiles, error: uploadedFilesError } =
          await supabase.storage.from(storage_name).list(folder_path);

        if (uploadedFilesError) {
          return NextResponse.json({ error: 'Failed to fetch uploaded files' }, { status: 500 });
        }

        const contentWithUploader = await Promise.all(
          uploadedFiles.map(async (file: { name: string }, index: number) => {
            const storagePath = `${folder_path}/${file.name}`;

            const { data: fileTestData, error: fileTestError } = await supabase
              .from('files_test')
              .select('uploaded_by, file_name')
              .eq('task_id', taskId)
              .eq('file_path', storagePath)
              .maybeSingle();

            let uploaderName = null;
            let uploaderRole = null;
            let originalFileName = file.name;

            if (!fileTestError && fileTestData) {
              originalFileName = fileTestData.file_name || file.name;

              if (fileTestData.uploaded_by) {
                uploaderName = fileTestData.uploaded_by.name || "Unknown";
                uploaderRole = fileTestData.uploaded_by.role || "Unknown";
              }
            }

            return {
              name: originalFileName,
              storage_name,
              folder_path,
              index,
              uploaded_by_name: uploaderName,
              uploaded_by_role: uploaderRole,
            };
          })
        );

        validContent = contentWithUploader.filter(item => item !== undefined);
      }

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
