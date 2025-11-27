import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
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

    console.log("REPLACE API - Received params:", {
      taskId,
      storage_name,
      old_file_path,
      old_file_name,
      new_file_name: file?.name,
    });

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get the old file record to preserve uploaded_by info
    const { data: oldFileData } = await supabase
      .from("files_test")
      .select("uploaded_by")
      .eq("task_id", taskId)
      .eq("file_path", old_file_path)
      .single();

    console.log("REPLACE API - Old file data:", oldFileData);

    // Delete old file from storage
    console.log("REPLACE API - Deleting old file from storage:", old_file_path);
    const { error: deleteError } = await supabase.storage
      .from(storage_name)
      .remove([old_file_path]);

    if (deleteError) {
      console.error("REPLACE API - Error deleting old file:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete old file: " + deleteError.message },
        { status: 400 }
      );
    }

    console.log("REPLACE API - Old file deleted from storage");

    // Generate new file path with timestamp to ensure uniqueness
    const date = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }).replaceAll("/", "-");

    // Extract folder path from old file path
    const folderPath = old_file_path.substring(0, old_file_path.lastIndexOf("/"));
    const new_file_path = `${folderPath}/${date}_${file.name}`;

    console.log("REPLACE API - Uploading new file to:", new_file_path);

    // Upload new file
    const { error: uploadError } = await supabase.storage
      .from(storage_name)
      .upload(new_file_path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("REPLACE API - Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 400 }
      );
    }

    console.log("REPLACE API - New file uploaded successfully");

    // Delete old file record from files_test
    const { error: dbDeleteError } = await supabase
      .from("files_test")
      .delete()
      .eq("task_id", taskId)
      .eq("file_path", old_file_path);

    if (dbDeleteError) {
      console.error("REPLACE API - Error deleting old file record:", dbDeleteError);
    }

    // Insert new file record in files_test
    const { error: insertError } = await supabase.from("files_test").insert({
      task_id: taskId,
      file_name: `${date}_${file.name}`,
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
      console.error("REPLACE API - Database insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    console.log("REPLACE API - New file record inserted in database");

    // Log the replace action in task_actions table
    const { error: logError } = await supabase.from("task_actions").insert({
      user_id: user_id,
      task_id: taskId,
      action_type: "file_replaced",
      metadata: {
        old_file_name: old_file_name,
        old_file_path: old_file_path,
        new_file_name: `${date}_${file.name}`,
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
      console.error("Error logging file replacement:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "File replaced successfully",
      new_file_path: new_file_path,
      new_file_name: `${date}_${file.name}`,
    });
  } catch (error) {
    console.error("Error in replace route:", error);
    return NextResponse.json(
      { error: "Failed to replace file" },
      { status: 500 }
    );
  }
}
