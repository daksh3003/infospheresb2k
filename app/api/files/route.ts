import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const stage = searchParams.get('stage');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    let files = [];

    if (stage === 'processor') {
      // Fetch processor files
      const { data: processorFiles, error: processorError } = await supabase
        .from("files_test")
        .select("*")
        .eq("task_id", taskId)
        .eq("file_type", "processor");

      if (processorError) {
        console.error("Error fetching processor files:", processorError);
      } else {
        files = processorFiles || [];
      }
    } else if (stage === 'qc') {
      // Fetch QC files
      const { data: qcFiles, error: qcError } = await supabase.storage
        .from("qc-files")
        .list(`${taskId}`);

      if (qcError) {
        console.error("Error fetching QC files:", qcError);
      } else {
        files = qcFiles || [];
      }
    } else if (stage === 'pm') {
      // Fetch PM files
      const { data: PMFiles, error: PMError } = await supabase.storage
        .from("pm-files")
        .list(`${taskId}`);

      if (PMError) {
        console.error("Error fetching PM files:", PMError);
      } else {
        files = PMFiles || [];
      }
    } else {
      // Fetch all files for the task
      const { data: allFiles, error: allFilesError } = await supabase
        .from("files_test")
        .select("*")
        .eq("task_id", taskId);

      if (allFilesError) {
        console.error("Error fetching all files:", allFilesError);
      } else {
        files = allFiles || [];
      }
    }

    return NextResponse.json({ files });

  } catch (error: any) {
    console.error('File fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { taskId, file, stage, currentUser } = await request.json();

    if (!taskId || !file || !stage || !currentUser) {
      return NextResponse.json(
        { error: 'Task ID, file, stage, and current user are required' },
        { status: 400 }
      );
    }

    let uploadResult;
    let fileRecord;

    if (stage === 'processor') {
      // Upload to processor storage
      const filePath = `${taskId}/${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("processor-files")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      uploadResult = uploadData;

      // Create file record
      const { data: recordData, error: recordError } = await supabase
        .from("files_test")
        .insert([
          {
            task_id: taskId,
            file_name: file.name,
            storage_name: "processor-files",
            folder_path: taskId,
            file_size: file.size,
            file_type: "processor",
            uploaded_by: currentUser.id,
            uploaded_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (recordError) {
        throw recordError;
      }

      fileRecord = recordData;

    } else if (stage === 'qc') {
      // Upload to QC storage
      const filePath = `${taskId}/${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("qc-files")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      uploadResult = uploadData;

    } else if (stage === 'pm') {
      // Upload to PM storage
      const filePath = `${taskId}/${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("pm-files")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      uploadResult = uploadData;
    }

    // Log the upload
    const { error: logError } = await supabase
      .from("process_logs_test")
      .insert([
        {
          task_id: taskId,
          current_stage: stage,
          sent_by: currentUser.role,
          project_id: taskId, // This might need to be the actual project ID
          assigned_to: [],
          action: `File uploaded: ${file.name}`,
          timestamp: new Date().toISOString(),
        },
      ]);

    if (logError) {
      console.error("Error logging upload:", logError);
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      uploadResult,
      fileRecord,
    });

  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
