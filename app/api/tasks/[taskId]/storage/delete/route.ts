import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';

export async function DELETE(
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
    const { storage_name, file_path, file_name, user_id, user_name, user_email, user_role } = await request.json();

    if (!storage_name || !file_path) {
      return NextResponse.json(
        { error: 'Storage name and file path are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Delete from storage bucket
    const { error: storageError } = await supabase.storage
      .from(storage_name)
      .remove([file_path]);

    if (storageError) {
      return NextResponse.json(
        { error: "Failed to delete file from storage" },
        { status: 400 }
      );
    }

    // Delete from files_test table
    const { error: dbError } = await supabase
      .from("files_test")
      .delete()
      .eq("task_id", taskId)
      .eq("file_path", file_path);

    if (dbError) {
      return NextResponse.json({ error: "Failed to delete file record" }, { status: 400 });
    }

    // Log the delete action in task_actions table
    const { error: logError } = await supabase.from("task_actions").insert({
      user_id: user_id,
      task_id: taskId,
      action_type: "file_deleted",
      metadata: {
        file_name: file_name,
        file_path: file_path,
        storage_name: storage_name,
        deleted_by: user_name,
        deleted_by_email: user_email,
        deleted_by_role: user_role,
        deleted_at: new Date().toISOString(),
      },
    });

    if (logError) {
      // Error logging file deletion - non-critical
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
