import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {projectIds} = await request.json();

  const { data, error } = await supabase
  .from("projects_test")
  .select("project_id, project_name, delivery_date, delivery_time")
  .in("project_id", projectIds);

if (error) throw error;

return NextResponse.json(data);
}

// export async function POST(request: NextRequest) {
//   try {
//     const { projectData, fileGroups, selectedFiles, currentUser } = await request.json();

//     if (!currentUser) {
//       return NextResponse.json(
//         { error: 'You must be logged in to create a project' },
//         { status: 401 }
//       );
//     }

//     if (!projectData || !fileGroups || !selectedFiles) {
//       return NextResponse.json(
//         { error: 'Project data, file groups, and selected files are required' },
//         { status: 400 }
//       );
//     }

//     // 1. Create project in projects_test table
//     const { data: projectResult, error: projectError } = await supabase
//       .from("projects_test")
//       .insert([
//         {
//           ...projectData,
//           list_of_files: selectedFiles.map((f: any) => f.name),
//         },
//       ])
//       .select("project_id")
//       .single();

//     if (projectError) {
//       console.error("Error creating project:", projectError);
//       return NextResponse.json(
//         { error: `Failed to create project: ${projectError.message}` },
//         { status: 400 }
//       );
//     }

//     const projectId = projectResult.project_id;

//     // 2. Create tasks and files for each group
//     for (let groupIndex = 0; groupIndex < fileGroups.length; groupIndex++) {
//       const group = fileGroups[groupIndex];

//       // Create task
//       const { data: taskResult, error: taskError } = await supabase
//         .from("tasks_test")
//         .insert([
//           {
//             ...group.taskData,
//             project_id: projectId,
//           },
//         ])
//         .select("task_id")
//         .single();

//       if (taskError) {
//         console.error("Error creating task:", taskError);
//         return NextResponse.json(
//           { error: `Failed to create task ${groupIndex + 1}: ${taskError.message}` },
//           { status: 400 }
//         );
//       }

//       const taskId = taskResult.task_id;

//       // Create task iteration
//       const { data: taskIterationResult, error: taskIterationError } =
//         await supabase.from("task_iterations").insert([
//           {
//             task_id: taskId,
//             iteration_number: 1,
//             current_stage: "Processor",
//             sent_by: "PM",
//             stages: ["PM"],
//             notes: "",
//           },
//         ]);

//       if (taskIterationError) {
//         console.error("Error creating task iteration:", taskIterationError);
//         return NextResponse.json(
//           { error: `Failed to create task iteration: ${taskIterationError.message}` },
//           { status: 400 }
//         );
//       }

//       // Create process logs
//       const { data: process_logs, error: process_logsError } = await supabase
//         .from("process_logs_test")
//         .insert([
//           {
//             task_id: taskId,
//             current_stage: "Processor",
//             sent_by: "PM",
//             project_id: projectId,
//             assigned_to: [],
//           },
//         ]);

//       if (process_logsError) {
//         console.error("Error creating process logs:", process_logsError);
//         return NextResponse.json(
//           { error: `Failed to create process logs: ${process_logsError.message}` },
//           { status: 400 }
//         );
//       }

//       // Upload files to storage
//       for (const file of group.files) {
//         const filePath = `${projectId}/${taskId}/${file.name}`;
        
//         const { error: uploadError } = await supabase.storage
//           .from("project-files")
//           .upload(filePath, file);

//         if (uploadError) {
//           console.error("Error uploading file:", uploadError);
//           return NextResponse.json(
//             { error: `Failed to upload file ${file.name}: ${uploadError.message}` },
//             { status: 400 }
//           );
//         }

//         // Create file record
//         const { error: fileRecordError } = await supabase
//           .from("files_test")
//           .insert([
//             {
//               task_id: taskId,
//               file_name: file.name,
//               storage_name: "project-files",
//               folder_path: `${projectId}/${taskId}`,
//               file_size: file.size,
//               file_type: file.type,
//               uploaded_by: currentUser.id,
//               uploaded_at: new Date().toISOString(),
//             },
//           ]);

//         if (fileRecordError) {
//           console.error("Error creating file record:", fileRecordError);
//           return NextResponse.json(
//             { error: `Failed to create file record: ${fileRecordError.message}` },
//             { status: 400 }
//           );
//         }
//       }
//     }

//     return NextResponse.json({
//       message: 'Project created successfully',
//       projectId,
//     });

//   } catch (error: any) {
//     console.error('Project creation error:', error);
//     return NextResponse.json(
//       { error: error.message || 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
