import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const schema=z.object({expiresAt:z.string().datetime().optional()});
export async function POST(request:NextRequest,context:{params:Promise<{groupId:string}>}){const {groupId}=await context.params;const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"วันหมดอายุไม่ถูกต้อง"},{status:400});const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"กรุณาเข้าสู่ระบบ"},{status:401});const {data,error}=await supabase.rpc("create_group_invite",{p_group_id:groupId,p_expires_at:parsed.data.expiresAt??undefined});return error?NextResponse.json({error:error.message},{status:error.code==="42501"?403:422}):NextResponse.json({token:data},{status:201});}
