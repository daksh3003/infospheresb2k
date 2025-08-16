import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("track_downloads")
      .select(
        `
        id,
        task_id,
        file_id,
        file_name,
        storage_name,
        folder_path,
        downloaded_details
      `
      )
      .eq("task_id", taskId)
      .order("file_name", { ascending: true });

    if (error) {
      console.error("Error fetching download history:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Sort downloaded_details by time (latest first) for each record
    const sortedData = data.map((record) => ({
      ...record,
      downloaded_details:
        record.downloaded_details?.sort(
          (a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime()
        ) || [],
    }));

    // Sort files by their latest download time (most recent first)
    const filesSortedByLatestDownload = sortedData.sort((a, b) => {
      const aLatestTime = a.downloaded_details?.[0]?.time || "1970-01-01";
      const bLatestTime = b.downloaded_details?.[0]?.time || "1970-01-01";
      return (
        new Date(bLatestTime).getTime() - new Date(aLatestTime).getTime()
      );
    });

    return NextResponse.json({
      downloadHistory: filesSortedByLatestDownload,
    });

  } catch (error: any) {
    console.error('Download history error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { taskId, fileId, fileName, storageName, folderPath, downloadDetails } = await request.json();

    if (!taskId || !fileId || !fileName || !storageName || !folderPath || !downloadDetails) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from("track_downloads")
      .select("downloaded_details")
      .eq("task_id", taskId)
      .eq("file_id", fileId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingRecord) {
      // Update existing record
      const updatedDetails = [
        ...(existingRecord.downloaded_details || []),
        downloadDetails,
      ];

      const { error: updateError } = await supabase
        .from("track_downloads")
        .update({ downloaded_details: updatedDetails })
        .eq("task_id", taskId)
        .eq("file_id", fileId);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("track_downloads")
        .insert([
          {
            task_id: taskId,
            file_id: fileId,
            file_name: fileName,
            storage_name: storageName,
            folder_path: folderPath,
            downloaded_details: [downloadDetails],
          },
        ]);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ message: 'Download tracked successfully' });

  } catch (error: any) {
    console.error('Download tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
