import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { user_id, task_id, action_type, metadata } = body;
    
    if (!user_id || !task_id || !action_type) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          details: "user_id, task_id, and action_type are required" 
        },
        { status: 400 }
      );
    }

    // Validate action_type against allowed values
    const allowedActions = [
      'start', 'pause', 'resume', 'complete', 
      'send_to', 'download', 'upload', 'taken_by', 'assigned_to'
    ];
    
    if (!allowedActions.includes(action_type)) {
      return NextResponse.json(
        { 
          error: "Invalid action_type", 
          details: `action_type must be one of: ${allowedActions.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Insert task action into database
    const { data, error } = await supabase
      .from('task_actions')
      .insert({
        user_id,
        task_id,
        action_type,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          error: "Failed to log task action", 
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data,
        message: "Task action logged successfully" 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve task actions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const userId = searchParams.get('user_id');
    const actionType = searchParams.get('action_type');
    const limit = searchParams.get('limit') || '50';

    let query = supabase
      .from('task_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Apply filters
    if (taskId) {
      query = query.eq('task_id', taskId);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (actionType) {
      // Support comma-separated action types
      const actionTypes = actionType.split(',').map(type => type.trim());
      if (actionTypes.length === 1) {
        query = query.eq('action_type', actionTypes[0]);
      } else {
        query = query.in('action_type', actionTypes);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          error: "Failed to fetch task actions", 
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data,
        count: data.length 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
