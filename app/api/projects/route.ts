import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { projectData, fileGroups, selectedFiles, currentUser } = await request.json();

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

      // Upload files to storage
      // for (const file of group.filesData) {

        const filePath = `${taskId}/${group.filesData[0].file_name}`;

        const { error: uploadError } = await supabase.storage
          .from("task-files")
          .upload(filePath, group.filesData[0].file_name);

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          return NextResponse.json(
            { error: `Failed to upload file ${group.filesData[0].file_name}: ${uploadError.message}` },
            { status: 400 }
          );
        }

        // Create file record
        // console.log(file)
        // console.log(file.filesData)
        const { error: fileRecordError } = await supabase
          .from("files_test")
          .insert([
            {
              task_id: taskId,
              file_name: group.filesData[0].file_name,
              storage_name: "task-files",
              assigned_to: group.filesData[0].assigned_to,
              file_path: `${taskId}/${group.filesData[0].file_name}`,
              page_count: group.filesData[0].page_count,
            },
          ]);

        if (fileRecordError) {
          console.error("Error creating file record:", fileRecordError);
          return NextResponse.json(
            { error: `Failed to create file record: ${fileRecordError.message}` },
            { status: 400 }
          );
        }
      // }
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
