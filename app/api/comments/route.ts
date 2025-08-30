import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    // First, let's discover the actual table structure
    const { data: sampleData, error: sampleError } = await supabase
      .from("comments")
      .select("*")
      .limit(10);

    if (sampleError) {
      console.error("Database error:", sampleError);
      return NextResponse.json(
        { error: sampleError.message, code: sampleError.code },
        { status: 400 }
      );
    }

    const columns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
    console.log("Comments table actual columns:", columns);

    // Return the table structure info and all comments for now
    return NextResponse.json({ 
      comments: sampleData || [],
      tableInfo: {
        availableColumns: columns,
        sampleCount: sampleData?.length || 0,
        requestedTaskId: taskId
      }
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { comment, user_id, task_id } = await request.json();

    if (!comment) {
      return NextResponse.json(
        { error: 'comment is required' },
        { status: 400 }
      );
    }

    console.log("Attempting to save comment with data:", { comment: comment.trim(), user_id, task_id });

    // First, let's check what columns exist by trying different combinations
    let data, error;

    // Try with all fields
    ({ data, error } = await supabase
      .from("comments")
      .insert({
        comment: comment.trim(),
        user_id: user_id || "anonymous",
        task_id: task_id,
      })
      .select("*")
      .single());

    if (error && error.code === 'PGRST204') {
      console.log("Trying with different column names...");
      
      // Try with different column names
      ({ data, error } = await supabase
        .from("comments")
        .insert({
          text: comment.trim(),
          userId: user_id || "anonymous",
          taskId: task_id,
        })
        .select("*")
        .single());
    }

    if (error && error.code === 'PGRST204') {
      // Try with just comment and user_id
      ({ data, error } = await supabase
        .from("comments")
        .insert({
          comment: comment.trim(),
          user_id: user_id || "anonymous",
        })
        .select("*")
        .single());
    }

    if (error && error.code === 'PGRST204') {
      // Try with just comment field
      ({ data, error } = await supabase
        .from("comments")
        .insert({
          comment: comment.trim(),
        })
        .select("*")
        .single());
    }

    if (error) {
      console.error("Database error:", error);
      
      // Handle RLS policy violation - suggest disabling RLS temporarily
      if (error.message?.includes('row-level security')) {
        return NextResponse.json(
          { 
            error: "Database security policy prevents this operation. Please contact administrator to configure Row Level Security policies for the comments table.",
            code: error.code,
            details: "Row Level Security (RLS) is enabled but no policies allow this operation"
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.log("Comment saved successfully:", data);
    return NextResponse.json({ comment: data });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
