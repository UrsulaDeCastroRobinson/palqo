// app/api/attendees/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Fetch attendees from the Supabase table
    const { data: attendees, error } = await supabase
      .from("attendees")
      .select("id, name, instrument"); 

    if (error) {
      console.error("Error fetching attendees:", error.message);
      return NextResponse.json({ error: "Failed to fetch attendees." }, { status: 500 });
    }

    // Return the attendees or an empty array if none exist
    return NextResponse.json(attendees || []);
  } catch (err) {
    console.error("Error fetching attendees:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}