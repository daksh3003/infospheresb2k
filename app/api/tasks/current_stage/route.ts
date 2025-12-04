import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
    const supabase = await createClient();
    const { data: iterationsData, error: iterationsError } = await supabase
    .from("task_iterations")
    .select("task_id, current_stage");

    if (iterationsError) throw iterationsError;

    return NextResponse.json(iterationsData);
}

