import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sendEmail from "../../../utils/sendEmail";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, instrument } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name, email, and instrument are required." },
        { status: 400 }
      );
    }

    // Fetch attendees to check for duplicates
    const { data: attendees, error: fetchError } = await supabase
      .from("attendees")
      .select("name, email, instrument");

    if (fetchError) {
      console.error("Error fetching attendees:", fetchError);
      return NextResponse.json({ error: "Error fetching attendees." }, { status: 500 });
    }

    // Check if the user is already registered
    const isRegistered = attendees.some(
      (attendee) => attendee.email === email
    );

    if (isRegistered) {
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 400 }
      );
    }

    // Insert the new attendee
    const { data: attendeeData, error: insertError } = await supabase
      .from("attendees")
      .insert([{ name, email, instrument }]);

    if (insertError) {
      console.error("Error inserting attendee:", insertError);
      return NextResponse.json({ error: "Error registering the attendee." }, { status: 500 });
    }

    // Fetch event details
    const { data: eventDetails, error: fetchEventError } = await supabase
      .from("event_details")
      .select("*")
      .single();

    if (fetchEventError) {
      console.error("Error fetching event details:", fetchEventError);
      return NextResponse.json({ error: "Error fetching event details." }, { status: 500 });
    }

    const updatedSpotsTaken = eventDetails.spots_taken + 1;

    if (updatedSpotsTaken > eventDetails.max_spots) {
      return NextResponse.json(
        { error: "The event is full." },
        { status: 400 }
      );
    }

    // Update the event details with the new spots taken
    const { error: updateEventError } = await supabase
      .from("event_details")
      .update({ spots_taken: updatedSpotsTaken })
      .eq("id", eventDetails.id);

    if (updateEventError) {
      console.error("Error updating event details:", updateEventError);
      return NextResponse.json({ error: "Error updating event details." }, { status: 500 });
    }

    // Send confirmation email and schedule reminder email
    await sendEmail(email, name);

    return NextResponse.json(
      {
        message: "Registration successful!",
        success: true,
        attendeeData,
        updatedEventDetails: {
          max_spots: eventDetails.max_spots,
          spots_taken: updatedSpotsTaken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


