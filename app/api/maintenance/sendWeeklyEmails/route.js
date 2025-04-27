import { createClient } from "@supabase/supabase-js";
import sendBulkEmails from "../../../../utils/sendBulkEmails";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const getUpcomingSaturday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = 6 - dayOfWeek;
  const upcomingSaturday = new Date(today);
  upcomingSaturday.setDate(today.getDate() + daysUntilSaturday);
  return upcomingSaturday.toLocaleDateString('en-GB', {
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

    // Get the upcoming Saturday's date
    const upcomingSaturday = getUpcomingSaturday();

    // Prepare email data for non-registered attendees
    const emailsForNonRegisteredAttendees = nonRegisteredAttendees.map((person) => ({
      email: person.email,
      name: person.name,
      subject: `Reminder: Sound Meditation Event on ${upcomingSaturday}`,
      text: `Hello ${person.name},\n\nThis is a reminder about the upcoming sound meditation event this Saturday, ${upcomingSaturday}.\n\nIf you'd like to attend, please register here https://soundmeditation.vercel.app/ to reserve your spot.\n\nPeace out,\nTom`,
    }));

    // Prepare email data for registered attendees
    const emailsForRegisteredAttendees = attendees.map((person) => ({
      email: person.email,
      name: person.name,
      subject: `Reminder: sound bath on ${upcomingSaturday}`,
      text: `Hello ${person.name},\n\nThis is a reminder that you are registered for the sound bath this Saturday, ${upcomingSaturday}.\n\nLooking forward to seeing you there!\n\nPeace out,\nTom`,
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


