// import { supabase } from "@/utils/supabase";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";
import { createClient } from "@supabase/supabase-js";


export async function POST(request: NextRequest) {

    const body = await request.json();

    const {storage_name, taskId, action} = body;

    // // const supabase = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    // // Grab JWT from headers
    // const authHeader = request.headers.get("authorization");
    // const token = authHeader?.replace("Bearer ", "");

    // // Create a Supabase client with user’s access token
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    //   { global: { headers: { Authorization: `Bearer ${token}` } } } 
    // );

    if(action === "list"){

    const {data, error} = await supabase.storage.from(storage_name).list(`${taskId}/`);

    if(error){
            return NextResponse.json({error: error.message}, {status: 400});
        }
        console.log("Storage Name:", storage_name);
        console.log("Task ID:", taskId);
        console.log("Action:", action);
        console.log("Data:", data);

        return NextResponse.json({data});
    }

    else if(action === "upload"){

        const {file, file_path} = body;

        const { data, error } = await supabase.storage
        .from(storage_name)
        .upload(file_path, file, {
            contentType: file.type,
            upsert: true,
        });

        if(error){
            return NextResponse.json({error: error.message}, {status: 400});
        }

        return NextResponse.json({data: "File uploaded successfully"});
    }

    // return NextResponse.json({data});
}