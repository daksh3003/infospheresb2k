import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    const { data, error } = await supabase
        .from("task_iterations")
        .select(
          `
          id, 
          current_stage, 
          status_flag, 
          task_id, 
          iteration_number, 
          tasks_test ( task_name, task_id, project_id )
        `
        )
        .eq("current_stage", "QA");

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    return NextResponse.json(data); 
}   