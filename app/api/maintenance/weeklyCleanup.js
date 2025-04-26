import { createClient } from "@supabase/supabase-js";
import schedule from "node-schedule";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to transfer attendees and reset registers
async function weeklyCleanup() {
  try {
    console.log("Starting cleanup...");

    // Step 1: Transfer attendees to master_attendees
    const { data: attendees, error: fetchError } = await supabase
      .from("attendees")
      .select("*");

    if (fetchError) throw new Error(`Error fetching attendees: ${fetchError.message}`);

    for (const attendee of attendees) {
      const { error: insertError } = await supabase
        .from("master_attendees")
        .upsert({
          name: attendee.name,
          email: attendee.email,
          event_date: attendee.event_date, // Ensure this column exists in your master_attendees table
        });

      if (insertError) console.error(`Failed to insert attendee: ${insertError.message}`);
    }

    console.log("Attendees transferred to master_attendees.");

    // Step 2: Clear the attendees table
    const { error: deleteError } = await supabase.from("attendees").delete().neq("id", 0); // Deletes all rows
    if (deleteError) throw new Error(`Error clearing attendees: ${deleteError.message}`);

    console.log("Attendees table cleared.");

    // Step 3: Reset spots_taken in event_details
    const { error: resetError } = await supabase
      .from("event_details")
      .update({ spots_taken: 0 });

    if (resetError) throw new Error(`Error resetting spots_taken: ${resetError.message}`);

    console.log("Event details reset successfully.");
  } catch (err) {
    console.error(`Error during cleanup: ${err.message}`);
  }
}

// Schedule the function to run every 5 minutes
schedule.scheduleJob("*/5 * * * *", weeklyCleanup);

console.log("Cleanup scheduled: Running every 5 minutes.");