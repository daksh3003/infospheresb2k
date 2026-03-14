import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
    const supabase = await createClient();
    const { data: iterationsData, error: iterationsError } = await supabase
        .from("task_iterations")
        .select("task_id, current_stage, stages");

    if (iterationsError) throw iterationsError;

    const withPreviousStage = (iterationsData || []).map((row: { task_id: string; current_stage: string; stages?: string[] }) => {
        const stages = row.stages;
        const curr = row.current_stage;
        const previous_stage = stages && stages.length >= 1
            ? (curr === "Delivery" && stages.length >= 2 ? stages[stages.length - 2] : stages[stages.length - 1])
            : null;
        return { task_id: row.task_id, current_stage: row.current_stage, previous_stage };
    });

    return NextResponse.json(withPreviousStage);
}

