import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import { emit } from 'process';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FileFormData {
  file_name: string;
  page_count: string;
  assigned_to: {
    user_id: string;
    name: string;
    email: string;
    role: string;
    assigned_at: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Check content type to handle both JSON and FormData
    const contentType = request.headers.get('content-type') || '';
    let projectData, fileGroups, selectedFiles, currentUser, formData = null;

    if (contentType.includes('application/json')) {
      // Handle legacy JSON format
      const jsonData = await request.json();
      projectData = jsonData.projectData;
      fileGroups = jsonData.fileGroups;
      selectedFiles = jsonData.selectedFiles;
      currentUser = jsonData.currentUser;
    } else {
      // Handle new FormData format
      formData = await request.formData();
      const projectDataStr = formData.get('projectData') as string;
      const fileGroupsStr = formData.get('fileGroups') as string;
      const selectedFilesStr = formData.get('selectedFiles') as string;
      const currentUserStr = formData.get('currentUser') as string;

      if (!currentUserStr) {
        return NextResponse.json(
          { error: 'You must be logged in to create a project' },
          { status: 401 }
        );
      }

      if (!projectDataStr || !fileGroupsStr || !selectedFilesStr) {
        return NextResponse.json(
          { error: 'Project data, file groups, and selected files are required' },
          { status: 400 }
        );
      }

      // Parse JSON strings
      projectData = JSON.parse(projectDataStr);
      fileGroups = JSON.parse(fileGroupsStr);
      selectedFiles = JSON.parse(selectedFilesStr);
      currentUser = JSON.parse(currentUserStr);
    }

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to create a project' },
        { status: 401 }
      );
    }

    if (!projectData || !fileGroups || !selectedFiles) {
      return NextResponse.json(
        { error: 'Project data, file groups, and selected files are required' },
        { status: 400 }
      );
    }

    // console.log('Creating project with data:', {
    //   // projectData,
    //   fileGroups: fileGroups[1].filesData,
    //   // selectedFiles,
    //   // currentUser
    // });

    // 1. Create project in projects_test table
    const { data: projectResult, error: projectError } = await supabase
      .from("projects_test")
      .insert([
        {
          ...projectData,
          list_of_files: selectedFiles.map((f: { name: string }) => f.name),
        },
      ])
      .select("project_id")
      .single();

    if (projectError) {
      console.error("Error creating project:", projectError);
      return NextResponse.json(
        { error: `Failed to create project: ${projectError.message}` },
        { status: 400 }
      );
    }

    const projectId = projectResult.project_id;

    // 2. Create tasks and files for each group
    for (let groupIndex = 0; groupIndex < fileGroups.length; groupIndex++) {
      const group = fileGroups[groupIndex];

      // Create task
      const { data: taskResult, error: taskError } = await supabase
        .from("tasks_test")
        .insert([
          {
            ...group.taskData,
            project_id: projectId,
          },
        ])
        .select("task_id")
        .single();

      if (taskError) {
        console.error("Error creating task:", taskError);
        return NextResponse.json(
          { error: `Failed to create task ${groupIndex + 1}: ${taskError.message}` },
          { status: 400 }
        );
      }

      const taskId = taskResult.task_id;

      // Create task iteration
      const { data: _taskIterationResult, error: taskIterationError } =
        await supabase.from("task_iterations").insert([
          {
            task_id: taskId,
            iteration_number: 1,
            current_stage: "Processor",
            sent_by: "PM",
            stages: ["PM"],
            notes: "",
          },
        ]);

      if (taskIterationError) {
        console.error("Error creating task iteration:", taskIterationError);
        return NextResponse.json(
          { error: `Failed to create task iteration: ${taskIterationError.message}` },
          { status: 400 }
        );
      }

      // Create process logs
      const { data: _process_logs, error: process_logsError } = await supabase
        .from("process_logs_test")
        .insert([
          {
            task_id: taskId,
            current_stage: "Processor",
            sent_by: "PM",
            assigned_to: [],
          },
        ]);

      if (process_logsError) {
        console.error("Error creating process logs:", process_logsError);
        return NextResponse.json(
          { error: `Failed to create process logs: ${process_logsError.message}` },
          { status: 400 }
        );
      }

      // Upload files to storage with proper file handling
      for (const fileData of group.filesData) {
        const fileName = fileData.file_name;
        const filePath = `${taskId}/${fileName}`;
        
        // Get the actual file from FormData using group and file indices
        let actualFile: File | null = null;
        if (formData) {
          // Find the file index within this group's filesData array
          const fileIndex = group.filesData.findIndex((f: FileFormData) => f.file_name === fileName);
          
          // Try the new format first: file_group_X_file_Y
          const newFormatKey = `file_group_${groupIndex}_file_${fileIndex}`;
          actualFile = formData.get(newFormatKey) as File;
          
          // Fallback to old format for backward compatibility
          if (!actualFile) {
            actualFile = formData.get(`file_${taskId}_${fileName}`) as File;
          }
        }
        
        if (!actualFile) {
          console.warn(`File not found in FormData with keys: file_group_${groupIndex}_file_X or file_${taskId}_${fileName}. Skipping file upload for backward compatibility.`);
          // Skip this file if not found in FormData - for backward compatibility
          // In the future, all files should be provided in FormData
          continue;
        }
        
        // Get file extension and determine file type
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        console.log('File Extension:', fileExtension);
        // Define supported file types (same as in files API)
        // const supportedTypes: Record<string, string[]> = {
        //   documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
        //   images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg', 'webp'],
        //   spreadsheets: ['xls', 'xlsx', 'csv', 'ods'],
        //   presentations: ['ppt', 'pptx', 'odp'],
        //   archives: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
        //   audio: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
        //   video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
        //   code: ['js', 'ts', 'html', 'css', 'json', 'xml', 'sql', 'py', 'java', 'cpp', 'c'],
        //   other: []
        // };

        // Determine file category
        // let fileCategory = 'other';
        // for (const [category, extensions] of Object.entries(supportedTypes)) {
        //   if (extensions.includes(fileExtension)) {
        //     fileCategory = category;
        //     break;
        //   }
        // }

        // Determine MIME type based on extension (comprehensive mapping)
        const mimeTypes: Record<string, string> = {
          // Documents
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'txt': 'text/plain',
          'rtf': 'application/rtf',
          'odt': 'application/vnd.oasis.opendocument.text',
          
          // Images
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'bmp': 'image/bmp',
          'tiff': 'image/tiff',
          'svg': 'image/svg+xml',
          'webp': 'image/webp',
          
          // Spreadsheets
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'csv': 'text/csv',
          'ods': 'application/vnd.oasis.opendocument.spreadsheet',
          
          // Presentations
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'odp': 'application/vnd.oasis.opendocument.presentation',
          
          // Archives
          'zip': 'application/x-zip-compressed',
          'rar': 'application/x-rar-compressed',
          '7z': 'application/x-7z-compressed',
          'tar': 'application/x-tar',
          'gz': 'application/gzip',
          'bz2': 'application/x-bzip2',
          
          // Audio
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'flac': 'audio/flac',
          'aac': 'audio/aac',
          'ogg': 'audio/ogg',
          
          // Video
          'mp4': 'video/mp4',
          'avi': 'video/x-msvideo',
          'mkv': 'video/x-matroska',
          'mov': 'video/quicktime',
          'wmv': 'video/x-ms-wmv',
          'flv': 'video/x-flv',
          'webm': 'video/webm',
          
          // Code files
          'js': 'application/javascript',
          'ts': 'application/typescript',
          'html': 'text/html',
          'css': 'text/css',
          'json': 'application/json',
          'xml': 'application/xml',
          'sql': 'application/sql',
          'py': 'text/x-python',
          'java': 'text/x-java-source',
          'cpp': 'text/x-c++src',
          'c': 'text/x-csrc'
        };

        const mimeType = actualFile.type || mimeTypes[fileExtension] || 'application/octet-stream';

        // Upload file with proper content type using actual file blob
        const { error: uploadError } = await supabase.storage
          .from("task-files")
          .upload(filePath, actualFile, {
            contentType: mimeType,
            upsert: false
          });

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          return NextResponse.json(
            { error: `Failed to upload file ${fileName}: ${uploadError.message}` },
            { status: 400 }
          );
        }

        // Create comprehensive file record
        const { error: fileRecordError } = await supabase
          .from("files_test")
          .insert([
            {
              task_id: taskId,
              file_name: fileName,
              storage_name: "task-files",
              assigned_to: fileData.assigned_to,
              file_path: filePath,
              page_count: fileData.page_count,
              // file_extension: fileExtension,
              // file_category: fileCategory,
              // mime_type: mimeType,
              // file_size: actualFile.size,
              uploaded_by: { 
                id: currentUser.id, 
                name: currentUser.name, 
                email: currentUser.email, 
                role: currentUser.role 
              },
              uploaded_at: new Date().toISOString(),
            },
          ]);

        if (fileRecordError) {
          console.error("Error creating file record:", fileRecordError);
          return NextResponse.json(
            { error: `Failed to create file record for ${fileName}: ${fileRecordError.message}` },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({
      message: 'Project created successfully',
      projectId,
    });

  } catch (error: unknown) {
    console.error('Project creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
