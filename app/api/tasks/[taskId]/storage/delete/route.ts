import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const { storage_name, file_path, file_name, user_id, user_name, user_email, user_role } = await request.json();

    console.log("DELETE API - Received params:", {
      taskId,
      storage_name,
      file_path,
      file_name,
    });

    // Delete from storage bucket
    const { error: storageError } = await supabase.storage
      .from(storage_name)
      .remove([file_path]);

    if (storageError) {
      console.error("DELETE API - Storage error:", storageError);
      return NextResponse.json(
        { error: storageError.message },
        { status: 400 }
      );
    }

    console.log("DELETE API - File deleted from storage successfully");

    // Delete from files_test table
    const { error: dbError } = await supabase
      .from("files_test")
      .delete()
      .eq("task_id", taskId)
      .eq("file_path", file_path);

    if (dbError) {
      console.error("DELETE API - Database error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    console.log("DELETE API - File record deleted from database successfully");

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
      console.error("Error logging file deletion:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Error in delete route:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
