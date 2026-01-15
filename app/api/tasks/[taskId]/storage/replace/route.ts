import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';
import { generateSafeStorageFileName } from '@/lib/file-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { taskId } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const storage_name = formData.get("storage_name") as string;
    const old_file_path = formData.get("old_file_path") as string;
    const old_file_name = formData.get("old_file_name") as string;
    const page_count = formData.get("page_count") as string;
    const user_id = formData.get("user_id") as string;
    const user_name = formData.get("user_name") as string;
    const user_email = formData.get("user_email") as string;
    const user_role = formData.get("user_role") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the old file record to preserve uploaded_by info
    const { data: oldFileData } = await supabase
      .from("files_test")
      .select("uploaded_by")
      .eq("task_id", taskId)
      .eq("file_path", old_file_path)
      .single();

    // Delete old file from storage
    const { error: deleteError } = await supabase.storage
      .from(storage_name)
      .remove([old_file_path]);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete old file" },
        { status: 400 }
      );
    }

    // Generate new file path with safe naming
    const safeStorageFileName = generateSafeStorageFileName(file.name);
    const date = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }).replaceAll("/", "-");

    // Extract folder path from old file path
    const folderPath = old_file_path.substring(0, old_file_path.lastIndexOf("/"));
    const new_file_path = `${folderPath}/${safeStorageFileName}`;

    // Upload new file
    const { error: uploadError } = await supabase.storage
      .from(storage_name)
      .upload(new_file_path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload new file" },
        { status: 400 }
      );
    }

    // Delete old file record from files_test
    const { error: dbDeleteError } = await supabase
      .from("files_test")
      .delete()
      .eq("task_id", taskId)
      .eq("file_path", old_file_path);

    if (dbDeleteError) {
      // Error deleting old file record - non-critical
    }

    // Insert new file record in files_test
    const { error: insertError } = await supabase.from("files_test").insert({
      task_id: taskId,
      file_name: file.name, // Keep original name for display
      page_count: parseInt(page_count) || null,
      assigned_to: [],
      storage_name: storage_name,
      file_path: new_file_path,
      uploaded_by: oldFileData?.uploaded_by || {
        id: user_id,
        name: user_name,
        email: user_email,
        role: user_role,
      },
      uploaded_at: new Date(),
    });

    if (insertError) {
      return NextResponse.json({ error: "Failed to create file record" }, { status: 400 });
    }

    // Log the replace action in task_actions table
    const { error: logError } = await supabase.from("task_actions").insert({
      user_id: user_id,
      task_id: taskId,
      action_type: "file_replaced",
      metadata: {
        old_file_name: old_file_name,
        old_file_path: old_file_path,
        new_file_name: file.name,
        new_file_path: new_file_path,
        storage_name: storage_name,
        page_count: parseInt(page_count) || null,
        replaced_by: user_name,
        replaced_by_email: user_email,
        replaced_by_role: user_role,
        replaced_at: new Date().toISOString(),
      },
    });

    if (logError) {
      // Error logging file replacement - non-critical
    }

    return NextResponse.json({
      success: true,
      message: "File replaced successfully",
      new_file_path: new_file_path,
      new_file_name: file.name,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to replace file" },
      { status: 500 }
    );
  }
}
