import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id parameter is required' },
        { status: 400 }
      );
    }

    console.log("Fetching comments for task:", taskId);

    // Fetch comments for the specific task, ordered by creation date
    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        comment_id,
        comment,
        task_id,
        user_id,
        created_at,
        updated_at,
        parent_comment_id
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.log(`Found ${comments?.length || 0} comments for task ${taskId}`);

    return NextResponse.json({ 
      comments: comments || [],
      taskId: taskId
    });
  } catch (error: unknown) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { comment, user_id, task_id, parent_comment_id } = await request.json();

    // Validate required fields
    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    if (!task_id) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    console.log("Attempting to save comment:", { 
      comment: comment.trim(), 
      user_id, 
      task_id, 
      parent_comment_id 
    });

    // Insert new comment
    const { data, error } = await supabase
      .from("comments")
      .insert({
        comment: comment.trim(),
        user_id: user_id,
        task_id: task_id,
        parent_comment_id: parent_comment_id || null,
      })
      .select(`
        comment_id,
        comment,
        task_id,
        user_id,
        created_at,
        updated_at,
        parent_comment_id
      `)
      .single();

    if (error) {
      console.error("Database error:", error);
      
      // Handle specific error cases
      if (error.message?.includes('row-level security')) {
        return NextResponse.json(
          { 
            error: "Database security policy prevents this operation. Please contact administrator to configure Row Level Security policies for the comments table.",
            code: error.code,
            suggestion: "Disable RLS temporarily or create proper policies"
          },
          { status: 403 }
        );
      }

      if (error.message?.includes('foreign key')) {
        return NextResponse.json(
          { 
            error: "Invalid task_id or user_id provided",
            code: error.code
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.log("Comment saved successfully:", data);
    return NextResponse.json({ comment: data });
  } catch (error: unknown) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { comment_id, comment, user_id } = await request.json();

    // Validate required fields
    if (!comment_id) {
      return NextResponse.json(
        { error: 'comment_id is required' },
        { status: 400 }
      );
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    console.log("Attempting to update comment:", { 
      comment_id, 
      comment: comment.trim(), 
      user_id 
    });

    // First, verify that the user owns this comment
    const { data: existingComment, error: fetchError } = await supabase
      .from("comments")
      .select("user_id")
      .eq('comment_id', comment_id)
      .single();

    if (fetchError) {
      console.error("Error fetching comment:", fetchError);
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.user_id !== user_id) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Update the comment
    const { data, error } = await supabase
      .from("comments")
      .update({
        comment: comment.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('comment_id', comment_id)
      .eq('user_id', user_id)
      .select(`
        comment_id,
        comment,
        task_id,
        user_id,
        created_at,
        updated_at,
        parent_comment_id
      `)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.log("Comment updated successfully:", data);
    return NextResponse.json({ comment: data });
  } catch (error: unknown) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { comment_id, user_id } = await request.json();

    // Validate required fields
    if (!comment_id) {
      return NextResponse.json(
        { error: 'comment_id is required' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    console.log("Attempting to delete comment:", { comment_id, user_id });

    // First, verify that the user owns this comment
    const { data: existingComment, error: fetchError } = await supabase
      .from("comments")
      .select("user_id")
      .eq('comment_id', comment_id)
      .single();

    if (fetchError) {
      console.error("Error fetching comment:", fetchError);
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.user_id !== user_id) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete the comment
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq('comment_id', comment_id)
      .eq('user_id', user_id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.log("Comment deleted successfully");
    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error: unknown) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
