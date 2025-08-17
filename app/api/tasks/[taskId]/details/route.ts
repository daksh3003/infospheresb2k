import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';


export async function POST(request: NextRequest) {

  const {taskId, action} = await request.json();

  if(action === "sent_by"){

    const {data, error} = await supabase
    .from("task_iterations")
    .select("sent_by")
    .eq("task_id", taskId)
    .single();

    if(error){
      return NextResponse.json({error: error.message}, {status: 400});
    }

    return NextResponse.json({data});
  }

  else if(action === "stages"){

    const {data, error} = await supabase
    .from("task_iterations")
    .select("stages")
    .eq("task_id", taskId)
    .single();

    if(error){
      return NextResponse.json({error: error.message}, {status: 400});
    }

    return NextResponse.json({data});
  }

  else if(action === "current_stage_and_sent_by"){

    const {data, error} = await supabase
    .from("task_iterations")
    .select("current_stage, sent_by")
    .eq("task_id", taskId)
    .single();

    if(error){
      return NextResponse.json({error: error.message}, {status: 400});
    }

    return NextResponse.json({data});
  }

  else if(action === "assigned_to_processor_user_id"){

    const {data, error} = await supabase
    .from("task_iterations")
    .select("sent_by, current_stage, assigned_to_processor_user_id")
    .eq("task_id", taskId)
    .single();

    if(error){
      return NextResponse.json({error: error.message}, {status: 400});
    }

    return NextResponse.json({data});
  } 
}

export async function PATCH(request: NextRequest) {

  const {taskId, next_current_stage, next_sent_by, updatedStages} = await request.json();

  const { data, error } = await supabase
      .from("task_iterations")
      .update({
        current_stage: next_current_stage,
        sent_by: next_sent_by,
        stages: updatedStages,
      })
      .eq("task_id", taskId);

    if(error){
      return NextResponse.json({error: error.message}, {status: 400});
    }

    return NextResponse.json({data});
}