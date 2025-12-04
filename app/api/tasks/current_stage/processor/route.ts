import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("task_iterations")
        .select(
          `
          id, 
          current_stage, 
          status, 
          task_id, 
          iteration_number, 
          tasks_test ( task_name, task_id, project_id )
        `
        )
        .eq("current_stage", "Processor");

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    return NextResponse.json(data); 
}   