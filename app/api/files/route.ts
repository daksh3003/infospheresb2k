import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';
import { AuthorizationService } from '@/app/api/middleware/authorization';
import { generateSafeStorageFileName } from '@/lib/file-utils';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const authenticatedUser = authResult;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const stage = searchParams.get('stage');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Check if user can access this task
    const canAccess = await AuthorizationService.canAccessTask(authenticatedUser.id, taskId);
    if (!canAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to access this task' },
        { status: 403 }
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
        // Error fetching processor files
      } else {
        files = processorFiles || [];
      }
    } else if (stage === 'qc') {
      // Fetch QC files
      const { data: qcFiles, error: qcError } = await supabase.storage
        .from("qc-files")
        .list(`${taskId}`);

      if (qcError) {
        // Error fetching QC files
      } else {
        files = qcFiles || [];
      }
    } else if (stage === 'pm') {
      // Fetch PM files
      const { data: PMFiles, error: PMError } = await supabase.storage
        .from("pm-files")
        .list(`${taskId}`);

      if (PMError) {
        // Error fetching PM files
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
        // Error fetching all files
      } else {
        files = allFiles || [];
      }
    }

    return NextResponse.json({ files });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const authenticatedUser = authResult;
    const supabase = await createClient();

    const formData = await request.formData();
    const taskId = formData.get('taskId') as string;
    const file = formData.get('file') as File;
    const stage = formData.get('stage') as string;

    if (!taskId || !file || !stage) {
      return NextResponse.json(
        { error: 'Task ID, file, and stage are required' },
        { status: 400 }
      );
    }

    // Check if user can upload files for this task/stage
    const canUpload = await AuthorizationService.canUploadFile(authenticatedUser.id, taskId, stage);
    if (!canUpload) {
      return NextResponse.json(
        { error: 'You do not have permission to upload files for this task/stage' },
        { status: 403 }
      );
    }

    // Get file extension and determine file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const originalFileName = file.name;
    const safeStorageFileName = generateSafeStorageFileName(originalFileName);
    const fileSize = file.size;

    // Define supported file types
    const supportedTypes: Record<string, string[]> = {
      documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
      images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg', 'webp'],
      spreadsheets: ['xls', 'xlsx', 'csv', 'ods'],
      presentations: ['ppt', 'pptx', 'odp'],
      archives: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
      audio: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
      video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
      code: ['js', 'ts', 'html', 'css', 'json', 'xml', 'sql', 'py', 'java', 'cpp', 'c'],
      other: []
    };

    // Determine file category
    let fileCategory = 'other';
    for (const [category, extensions] of Object.entries(supportedTypes)) {
      if (extensions.includes(fileExtension)) {
        fileCategory = category;
        break;
      }
    }

    // Validate file type (allow all basic types and archives)
    const allSupportedExtensions = Object.values(supportedTypes).flat();
    if (!allSupportedExtensions.includes(fileExtension) && fileExtension !== '') {
      return NextResponse.json(
        { error: `Unsupported file type: .${fileExtension}. Supported types include documents, images, spreadsheets, presentations, archives (zip, rar, etc.), audio, video, and code files.` },
        { status: 400 }
      );
    }

    let uploadResult;
    let fileRecord;

    if (stage === 'processor') {
      // Upload to processor storage
      const filePath = `${taskId}/${safeStorageFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("processor-files")
        .upload(filePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadResult = uploadData;

      // Create file record with comprehensive metadata
      const { data: recordData, error: recordError } = await supabase
        .from("files_test")
        .insert([
          {
            task_id: taskId,
            file_name: originalFileName,
            storage_name: "processor-files",
            folder_path: taskId,
            file_size: fileSize,
            file_type: "processor",
            file_extension: fileExtension,
            file_category: fileCategory,
            mime_type: file.type || 'application/octet-stream',
            uploaded_by: {
              id: authenticatedUser.id,
              name: authenticatedUser.email, // Will be updated with profile name if needed
              email: authenticatedUser.email,
              role: authenticatedUser.role
            },
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
      const filePath = `${taskId}/${safeStorageFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("qc-files")
        .upload(filePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadResult = uploadData;

      // Create file record for QC
      const { data: recordData, error: recordError } = await supabase
        .from("files_test")
        .insert([
          {
            task_id: taskId,
            file_name: originalFileName,
            storage_name: "qc-files",
            folder_path: taskId,
            // file_size: fileSize,
            // file_type: "qc",
            // file_extension: fileExtension,
            // file_category: fileCategory,
            // mime_type: file.type || 'application/octet-stream',
            uploaded_by: {
              id: authenticatedUser.id,
              name: authenticatedUser.email, // Will be updated with profile name if needed
              email: authenticatedUser.email,
              role: authenticatedUser.role
            },
            uploaded_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (recordError) {
        throw recordError;
      }

      fileRecord = recordData;

    } else if (stage === 'pm') {
      // Upload to PM storage
      const filePath = `${taskId}/${safeStorageFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("task-files")
        .upload(filePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadResult = uploadData;

      // Create file record for PM
      const { data: recordData, error: recordError } = await supabase
        .from("files_test")
        .insert([
          {
            task_id: taskId,
            file_name: originalFileName,
            storage_name: "task-files",
            folder_path: taskId,
            file_size: fileSize,
            file_type: "pm",
            file_extension: fileExtension,
            file_category: fileCategory,
            mime_type: file.type || 'application/octet-stream',
            uploaded_by: {
              id: authenticatedUser.id,
              name: authenticatedUser.email, // Will be updated with profile name if needed
              email: authenticatedUser.email,
              role: authenticatedUser.role
            },
            uploaded_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (recordError) {
        throw recordError;
      }

      fileRecord = recordData;
    }

    // Log the upload with file details
    const { error: logError } = await supabase
      .from("process_logs_test")
      .insert([
        {
          task_id: taskId,
          current_stage: stage,
          sent_by: authenticatedUser.role,
          project_id: taskId, // This might need to be the actual project ID
          assigned_to: [],
          action: `File uploaded: ${originalFileName} (${fileCategory}, .${fileExtension}, ${Math.round(fileSize / 1024)}KB)`,
          timestamp: new Date().toISOString(),
        },
      ]);

    if (logError) {
      // Error logging upload - non-critical
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      uploadResult,
      fileRecord,
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
