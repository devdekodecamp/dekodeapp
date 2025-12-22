import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[ADMIN DELETE USER] Supabase URL or service role key is not set in environment variables"
  );
}

const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

export async function DELETE(request, { params }) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase admin client is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
      );
    }

    // Delete any app-side data first (best effort)
    try {
      await supabaseAdmin.from("user_progress").delete().eq("user_id", id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        "[ADMIN DELETE USER] Failed to delete from user_progress (table may not exist):",
        err
      );
    }

    try {
      await supabaseAdmin.from("profiles").delete().eq("id", id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        "[ADMIN DELETE USER] Failed to delete from profiles (table may not exist):",
        err
      );
    }

    // Finally delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      id
    );

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error("[ADMIN DELETE USER] Error deleting auth user:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete user" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[ADMIN DELETE USER] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while deleting user" },
      { status: 500 }
    );
  }
}


