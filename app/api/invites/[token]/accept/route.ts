import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const schema=z.object({pin:z.string().regex(/^\d{4,12}$/)});
export async function POST(request:NextRequest,context:{params:Promise<{token:string}>}){const {token}=await context.params;const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"PIN ต้องเป็นตัวเลข 4–12 หลัก"},{status:400});const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"กรุณาเข้าสู่ระบบ"},{status:401});const {data,error}=await supabase.rpc("accept_group_invite",{p_token:token,p_pin:parsed.data.pin});return error?NextResponse.json({error:"ไม่สามารถเข้าร่วมห้อง",detail:error.message},{status:error.code==="42501"?403:422}):NextResponse.json({groupId:data},{status:200});}
