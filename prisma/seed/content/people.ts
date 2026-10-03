import type { InstructorKey } from "../types";

type Staff = {
  key: InstructorKey | "ruth" | "support";
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "INSTRUCTOR";
  superAdmin?: boolean;
  headline?: string;
  bio?: string;
  /** Days before now the account was created. */
  joinedDaysAgo: number;
};

const staff: Staff[] = [
  {
    key: "support",
    name: "Lampstand Support",
    email: "support@lampstand.example",
    role: "OWNER",
    superAdmin: true,
    headline: "Platform support",
    joinedDaysAgo: 160,
  },
  {
    key: "daniel",
    name: "Pastor Daniel Okafor",
    email: "daniel@graceharbor.example",
    role: "OWNER",
    headline: "Lead Pastor",
    bio: "Daniel has served as Lead Pastor of Grace Harbor Church since 2011. He loves helping ordinary people discover the extraordinary grace of God, and he teaches our foundations, prayer and small group courses. Daniel and his wife Adaeze have three children and a very loud golden retriever.",
    joinedDaysAgo: 158,
  },
  {
    key: "ruth",
    name: "Ruth Martinez",
    email: "ruth@graceharbor.example",
    role: "ADMIN",
    headline: "Ministry Coordinator",
    bio: "Ruth keeps the ministries of Grace Harbor running smoothly, from membership to volunteer scheduling. If you have a question about the church, she's the best person to ask.",
    joinedDaysAgo: 157,
  },
  {
    key: "miriam",
    name: "Dr. Miriam Chen",
    email: "miriam@graceharbor.example",
    role: "INSTRUCTOR",
    headline: "Bible Teacher · Old & New Testament",
    bio: "Miriam holds a PhD in New Testament and taught biblical studies for a decade before joining the Grace Harbor teaching team. She is passionate about helping everyday believers read the whole Bible with confidence and joy. She leads our Romans, Sermon on the Mount and Bible-in-a-Year courses.",
    joinedDaysAgo: 150,
  },
  {
    key: "samuel",
    name: "Pastor Samuel Adeyemi",
    email: "samuel@graceharbor.example",
    role: "INSTRUCTOR",
    headline: "Youth & Next Gen Pastor",
    bio: "Samuel has worked with students for over twelve years and still thinks youth group is the best night of the week. He cares deeply about helping young people build a faith that holds through hard questions. He also trains our ministry leaders in servant leadership.",
    joinedDaysAgo: 148,
  },
  {
    key: "esther",
    name: "Esther Whitfield",
    email: "esther@graceharbor.example",
    role: "INSTRUCTOR",
    headline: "Marriage & Family Ministry Lead",
    bio: "Esther and her husband James have been married for twenty-four years and have led Grace Harbor's marriage ministry together for over a decade. A licensed family counselor, Esther brings biblical wisdom and practical warmth to couples at every stage. She and James have four children and two grandchildren.",
    joinedDaysAgo: 146,
  },
  {
    key: "grace",
    name: "Grace Thompson",
    email: "grace@graceharbor.example",
    role: "INSTRUCTOR",
    headline: "Kids & Volunteer Ministry Director",
    bio: "Grace oversees Grace Harbor Kids and our volunteer teams. A former elementary school teacher, she believes every child deserves a safe, joyful place to meet Jesus, and every volunteer deserves great training. She is currently building our spiritual gifts course.",
    joinedDaysAgo: 145,
  },
];

/** Learners, other than the scripted demo learner John Carter. */
const learnerNames = [
  "Sarah Mitchell",
  "Marcus Johnson",
  "Priya Raman",
  "David Kim",
  "Olivia Bennett",
  "Joshua Reyes",
  "Hannah Okonkwo",
  "Michael O'Brien",
  "Leah Goldberg",
  "Andre Washington",
  "Emily Nguyen",
  "Caleb Foster",
  "Abigail Turner",
  "Isaiah Brooks",
  "Natalie Sato",
  "Jonathan Pierce",
  "Rebecca Alvarez",
  "Elijah Coleman",
  "Vivian Liu",
  "Nathaniel Hughes",
  "Chloe Anderson",
  "Diego Ortiz",
  "Mei Lin Zhang",
  "Thomas Gallagher",
  "Joanna Abernathy",
  "Ama Mensah",
  "Lydia Hoffman",
  "Gabriel Santos",
  "Hyejin Park",
  "Benjamin Wright",
  "Naomi Adebayo",
  "Aaron Fischer",
  "Rachel Cohen",
  "Matthew Delgado",
  "Joy Opoku",
  "Peter Lindqvist",
  "Faith Robinson",
  "Luis Hernández",
  "Anna Kowalski",
  "Timothy Grant",
  "Deborah Ellis",
  "Kwame Asante",
  "Sophie Laurent",
  "Jacob Whitaker",
  "Maya Patel",
  "Ethan Morales",
];

const learnerHeadlines = [
  "Small group host on the east side",
  "Welcome team volunteer",
  "Kids ministry volunteer",
  "Nurse, mom of three, coffee enthusiast",
  "Graduate student and youth leader",
  "Worship team guitarist",
  "Retired teacher and prayer team member",
  "New to Grace Harbor",
  null,
  null,
  null,
];

function emailFor(name: string): string {
  const [first, ...rest] = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .split(/\s+/);
  return `${first}.${rest.join("")}@graceharbor.example`;
}

export const people = {
  staff,
  john: {
    name: "John Carter",
    email: "john@graceharbor.example",
    headline: "Welcome team volunteer · Learning every day",
    bio: "I came to faith at Grace Harbor two years ago and I'm still amazed by grace. I serve on the welcome team and love a good cup of coffee after the 9am service.",
    joinedDaysAgo: 120,
  },
  learners: learnerNames.map((name) => ({ name, email: emailFor(name) })),
  learnerHeadlines,
};

/** Warm, specific-sounding feedback instructors leave on approved work. */
export const approvalFeedback = [
  "Thank you for sharing this so honestly, {first}. I can see God at work in what you wrote. Keep going!",
  "This is thoughtful and well applied, {first}. I especially appreciated how specific you were. That's where real change happens.",
  "Beautifully done. I'll be praying for you as you keep putting this into practice this month.",
  "{first}, this encouraged me today. Thank you for taking the time to reflect so carefully.",
  "Great work. You've clearly understood the heart of the lesson. I'd love to hear how it goes in a few weeks.",
  "Approved, with gratitude! Your reflection is a great example of moving from hearing to doing.",
];

/** Gentle requests for a revision. */
export const revisionFeedback = [
  "Thanks, {first}! You've made a good start. Could you add a little more about how you'll apply this specifically this week? A sentence or two is plenty.",
  "I appreciate this, {first}. The assignment asks you to connect your reflection to a specific passage. Could you add which verse shaped your thinking and resubmit?",
  "Good thoughts here! Could you expand the application section? Try naming one concrete step and when you'll take it.",
];
