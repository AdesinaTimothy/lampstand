import type { CourseSeed } from "../types";

export const servantLeadership: CourseSeed = {
  slug: "servant-leadership-in-the-local-church",
  title: "Servant Leadership in the Local Church",
  subtitle: "Lead like Jesus: character, care for people, and a sustainable pace.",
  description: `
<p>Every ministry at Grace Harbor runs on volunteer leaders: small group hosts, team captains, deacons, youth leaders and greeters. <strong>Servant Leadership in the Local Church</strong> is our core training for anyone who leads others, whether you oversee three people or thirty.</p>
<p>Jesus redefined greatness with a towel and a basin. In this course we'll look closely at how he led, what Scripture requires of those who lead God's people, and how to shepherd people through change, conflict and seasons of growth.</p>
<h3>Topics include</h3>
<ul>
<li>Character before gifting: the qualifications in 1 Timothy 3 and Titus 1</li>
<li>Shepherding people rather than managing tasks</li>
<li>Navigating conflict biblically using Matthew 18</li>
<li>Rest, limits and leading for the long haul</li>
</ul>
<p>Pastor Samuel Adeyemi and Pastor Daniel Okafor bring years of experience leading teams in the local church, including the mistakes they wish they could undo.</p>
<blockquote>“For even the Son of Man came not to be served but to serve, and to give his life as a ransom for many.” (Mark 10:45)</blockquote>`,
  category: "leadership",
  level: "INTERMEDIATE",
  tags: ["Leadership", "Character", "Conflict", "Volunteers"],
  objectives: [
    "Describe how Jesus modeled servant leadership in John 13",
    "Evaluate leadership by the character qualities of 1 Timothy 3",
    "Shepherd the people on your team, not just the tasks",
    "Navigate conflict using the pattern of Matthew 18:15–17",
    "Build a personal rule of life that sustains healthy leadership",
  ],
  requirements: [
    "Currently serving or preparing to serve as a ministry leader",
    "Completion of Foundations of Faith or the Membership Class recommended",
  ],
  audience: ["Small group and ministry team leaders", "Deacons and elder candidates", "Staff and interns"],
  owner: "samuel",
  coInstructors: ["daniel"],
  status: "PUBLISHED",
  publishedDaysAgo: 74,
  popularity: 0.45,
  completionRate: 0.35,
  thumbnail: "basin",
  sections: [
    {
      title: "The Towel and the Basin",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Leadership Begins at the Feet of Jesus",
          summary: "Why Christian leadership is first about following.",
        },
        {
          type: "TEXT",
          title: "What Jesus Modeled in John 13",
          summary: "Four marks of servant leadership from the upper room.",
          content: `
<h2>The night before the cross</h2>
<p>John tells us that Jesus knew “that the Father had given all things into his hands, and that he had come from God and was going back to God” (John 13:3). What did he do with that knowledge of supreme authority? He took off his outer garment, tied a towel around his waist and washed his disciples' feet.</p>
<blockquote>“If I then, your Lord and Teacher, have washed your feet, you also ought to wash one another's feet. For I have given you an example.” (John 13:14–15)</blockquote>
<h3>1. Security, not insecurity</h3>
<p>Jesus served <em>because</em> he knew who he was. Insecure leaders protect their status; secure leaders can stoop. Our identity as beloved children of God frees us to take the lowest place.</p>
<h3>2. Initiative</h3>
<p>No one asked Jesus to wash feet. Servant leaders notice needs others overlook and move toward them without waiting for recognition.</p>
<h3>3. Love for the difficult</h3>
<p>Jesus washed the feet of Peter, who would deny him, and of Judas, who would betray him. Servant leadership is not reserved for the people who make us look good.</p>
<h3>4. Teaching by example</h3>
<p>Jesus explained what he had done, but only after he had done it. People follow what we model far more than what we say.</p>
<h2>Leadership questions</h2>
<ul>
<li>Where in your ministry is there a “towel” no one wants to pick up?</li>
<li>Who on your team is hardest for you to serve? What would it look like to wash their feet this month?</li>
<li>Is there any place where you are leading from insecurity rather than identity?</li>
</ul>
<p>In the kingdom of God, the way up is down. That is not a leadership technique; it is the shape of the gospel.</p>`,
        },
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Character Before Gifting (1 Timothy 3)",
          summary: "Why Scripture's leadership list is mostly about who we are.",
        },
      ],
    },
    {
      title: "Leading People Well",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Shepherding, Not Managing",
          summary: "Knowing, feeding, leading and protecting the people in your care.",
        },
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Healthy Conflict and Reconciliation",
          summary: "Matthew 18 and the courage to have hard conversations.",
        },
        {
          type: "PDF",
          title: "Leader's Guide: Hard Conversations",
          summary: "A step-by-step guide to biblical conflict resolution for ministry teams.",
          guide: {
            file: "leaders-guide-hard-conversations",
            title: "Hard Conversations: A Leader's Guide",
            subtitle: "Servant Leadership in the Local Church · Leader's Guide",
            scripture: { text: "If possible, so far as it depends on you, live peaceably with all.", reference: "Romans 12:18" },
            sections: [
              {
                heading: "Why conflict is normal",
                paragraphs: [
                  "Wherever people work closely together, conflict will come. The early church argued about food distribution (Acts 6), mission strategy (Acts 15) and personalities (Philippians 4:2). Conflict is not a sign that a team has failed; avoiding it usually is.",
                  "As a leader, your goal is not to eliminate disagreement but to help it become an occasion for growth, humility and reconciliation.",
                ],
              },
              {
                heading: "Before the conversation",
                paragraphs: ["Prepare your own heart first. Jesus tells us to deal with the log in our own eye before addressing the speck in another's."],
                bullets: [
                  "Pray for the other person by name, and for yourself",
                  "Identify what you contributed to the problem",
                  "Separate facts from assumptions about motives",
                  "Choose a private setting and an unhurried time",
                ],
              },
              {
                heading: "During the conversation",
                paragraphs: [
                  "Begin by affirming the relationship and your shared mission. Describe the specific behavior and its impact using “I” statements rather than accusations. Then listen, really listen, and ask questions until you can summarize their perspective in a way they would agree with.",
                  "Aim for a clear next step: an apology given or received, an agreement about the future, or a plan to talk again. Close by praying together if appropriate.",
                ],
              },
              {
                heading: "When it doesn't resolve",
                paragraphs: [
                  "Matthew 18:15–17 gives a path when a private conversation doesn't bring resolution: involve one or two others, and if necessary bring it to church leadership. At Grace Harbor, please contact your ministry staff member before moving beyond step one. Never address a conflict by email or group text.",
                  "Note: this guide addresses ordinary interpersonal conflict. Any situation involving abuse, a threat of harm or the safety of a child must be reported immediately according to our safeguarding policy.",
                ],
              },
            ],
            questions: [
              "Think of a conflict you avoided. What did avoiding it cost?",
              "What does it look like to “go and tell him his fault, between you and him alone” in a digital age?",
              "How can you create a team culture where honest disagreement is safe?",
            ],
            closing: "Blessed are the peacemakers, for they shall be called sons of God. (Matthew 5:9)",
          },
        },
        {
          type: "QUIZ",
          title: "Checkpoint: Servant Leadership",
          summary: "Review the key ideas from the course so far.",
          passingScore: 80,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "In John 13:3, what did Jesus know just before he washed the disciples' feet?",
              explanation: "Jesus served from security: he knew the Father had given all things into his hands.",
              options: [
                { text: "That the disciples had asked him to" },
                { text: "That the Father had given all things into his hands", correct: true },
                { text: "That the servants were unavailable" },
                { text: "That it was required by the Law" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "Most of the qualifications for leaders in 1 Timothy 3 concern character rather than skill.",
              explanation: "Only “able to teach” is a skill; the rest describe character and reputation.",
              answer: true,
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "According to Matthew 18:15, what is the first step when someone sins against you?",
              explanation: "Jesus says to go and tell him his fault “between you and him alone.”",
              options: [
                { text: "Tell the church leadership" },
                { text: "Talk to them privately", correct: true },
                { text: "Ask others what they think first" },
                { text: "Wait for them to come to you" },
              ],
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which of these are part of a shepherd's work with people? (Select all that apply.)",
              explanation: "Shepherds know, feed, lead and protect the flock (John 10, Acts 20:28, 1 Peter 5:2–3).",
              options: [
                { text: "Knowing them", correct: true },
                { text: "Feeding them with God's Word", correct: true },
                { text: "Protecting them", correct: true },
                { text: "Using them to accomplish tasks" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "A situation involving the safety of a child should be handled privately using Matthew 18 before being reported.",
              explanation: "Any concern about abuse or a child's safety must be reported immediately under the safeguarding policy.",
              answer: false,
            },
          ],
        },
      ],
    },
    {
      title: "Sustaining the Leader",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Sabbath, Limits, and Longevity",
          summary: "Leading from a full cup, not an empty one.",
        },
        {
          type: "ASSIGNMENT",
          title: "My Leadership Rule of Life",
          summary: "Write a simple rule of life to keep your leadership healthy.",
          instructions: `
<p>A rule of life is a simple set of rhythms that keep us connected to God and others. Write yours in 250–400 words, addressing:</p>
<ul>
<li><strong>Up:</strong> your rhythms of Scripture, prayer and Sabbath</li>
<li><strong>In:</strong> who knows you well and holds you accountable</li>
<li><strong>Out:</strong> how you will serve and develop the people you lead</li>
<li><strong>Limits:</strong> what you will say no to in this season</li>
</ul>
<p>Share it with your ministry staff member after you submit it here.</p>`,
          allowText: true,
          allowFile: true,
          dueDaysAfterEnrollment: 45,
          sampleResponses: [
            "Up: I will read Scripture before checking my phone, Monday to Friday, and take Saturdays as a Sabbath from email and ministry planning. In: I'm asking Marcus from my men's group to meet monthly and ask me the hard questions. Out: I'll have coffee with one person from my greeting team each month and ask how they are, not just whether they can serve. Limits: I'm saying no to joining the facilities committee this year, even though I'd enjoy it.",
            "Up: Morning prayer walk three days a week using the ACTS pattern. In: My wife and I will do a weekly check-in on Sunday evenings about schedule and spiritual health. Out: I want to identify and begin training an apprentice leader for my small group by January. Limits: No ministry meetings more than two evenings a week.",
            "Up: Psalm a day and a Sabbath afternoon on Sundays. In: Monthly lunch with Pastor Samuel. Out: Send a personal text to every youth volunteer on their birthday and pray for them weekly. Limits: I'm stepping back from leading worship on Wednesdays so I can focus on the youth team.",
          ],
        },
      ],
    },
  ],
  reviews: [
    "Honest and practical. The section on hard conversations is gold.",
    "Every ministry leader at our church should take this.",
    "Pastor Samuel's stories about his own mistakes made this feel real, not theoretical.",
    "Writing a rule of life was a turning point for me as a volunteer leader.",
    "Solid content. Could use a session on recruiting volunteers.",
  ],
};
