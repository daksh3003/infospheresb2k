import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "@/utils/supabase";

export async function POST(request: NextRequest) {

    const {storage_name, folder_path, fileName} = await request.json();

    const {data, error} = await supabase.storage
    .from(storage_name)
    .download(`${folder_path}/${fileName}`);

    if(error){
        return NextResponse.json({error: error.message}, {status: 400});
    }

    return NextResponse.json({data});
}   