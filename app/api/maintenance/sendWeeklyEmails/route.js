import { createClient } from "@supabase/supabase-js";
import sendBulkEmails from "../../../../utils/sendBulkEmails";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const getupcomingSunday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSunday = 7 - dayOfWeek;
  const upcomingSunday = new Date(today);
  upcomingSunday.setDate(today.getDate() + daysUntilSunday);
  return upcomingSunday.toLocaleDateString('en-GB', {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export async function GET() {
  try {
    console.log("Weekly email job started...");

    // Fetch attendees
    const { data: attendees, error: attendeesError } = await supabase
      .from("attendees")
      .select("email, name");

    if (attendeesError) {
      throw new Error(`Error fetching attendees: ${attendeesError.message}`);
    }

    // Fetch master attendees
    const { data: masterAttendees, error: masterError } = await supabase
      .from("master_attendees")
      .select("email, name");

    if (masterError) {
      throw new Error(`Error fetching master attendees: ${masterError.message}`);
    }

    // Get emails in the attendees table
    const attendeeEmails = new Set(attendees.map((attendee) => attendee.email));

    // Identify people in masterAttendees but not in attendees
    const nonRegisteredAttendees = masterAttendees.filter(
      (masterAttendee) => !attendeeEmails.has(masterAttendee.email)
    );

    // Get the upcoming Sunday's date
    const upcomingSunday = getupcomingSunday();

    // Prepare email data for non-registered attendees
    const emailsForNonRegisteredAttendees = nonRegisteredAttendees.map((person) => ({
      email: person.email,
      name: person.name,
      subject: `Reminder: Chamber Music Event on ${upcomingSunday}`,
      text: `Hello ${person.name},\n\nThis is a reminder about the chamber event this Sunday, ${upcomingSunday}.\n\nIf you'd like to attend, please register here https://palqo.vercel.app/ to reserve your spot.\n\nPeace out,\nTom`,
    }));

    // Prepare email data for registered attendees
    const emailsForRegisteredAttendees = attendees.map((person) => ({
      email: person.email,
      name: person.name,
      subject: `Reminder: chamber music on ${upcomingSunday}`,
      text: `Hello ${person.name},\n\nThis is a reminder that you are registered for the chamber music this Sunday, ${upcomingSunday}.\n\nLooking forward to seeing you there!\n\nPeace out,\nTom`,
    }));

    // Combine both groups into one email list
    const allEmails = [
      ...emailsForNonRegisteredAttendees,
      ...emailsForRegisteredAttendees,
    ];

    // Send emails in bulk
    await sendBulkEmails(allEmails);

    console.log("Weekly emails sent successfully!");
    return new Response(
      JSON.stringify({ message: "Weekly emails sent successfully!" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in weekly email job:", error.message);
    return new Response(
      JSON.stringify({ error: "An error occurred while sending emails." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}


