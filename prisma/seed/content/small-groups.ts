import type { CourseSeed } from "../types";

export const leadingASmallGroup: CourseSeed = {
  slug: "leading-a-small-group",
  title: "Leading a Small Group",
  subtitle: "Practical training for hosts and facilitators who want their group to grow in Christ together.",
  description: `
<p>Small groups are the heartbeat of Grace Harbor. Around living-room couches and kitchen tables, people study Scripture, pray for one another and carry each other's burdens. <strong>Leading a Small Group</strong> is our essential training for anyone hosting, facilitating or apprenticing in a group.</p>
<p>You don't need to be a Bible scholar or a natural extrovert to lead well. You need a heart for people, a willingness to prepare, and a few simple skills, which this course will give you.</p>
<h3>What you'll learn</h3>
<ul>
<li>The biblical vision for small groups from Acts 2</li>
<li>How to ask questions that lead to real conversation</li>
<li>How to handle silence, tangents and the person who talks too much</li>
<li>Caring for members between meetings, and raising up new leaders</li>
</ul>
<p>Pastor Daniel and Pastor Samuel share what they've learned from leading groups for over twenty years combined, including plenty of stories about evenings that didn't go to plan.</p>
<blockquote>“And they devoted themselves to the apostles' teaching and the fellowship, to the breaking of bread and the prayers.” (Acts 2:42)</blockquote>`,
  category: "leadership",
  level: "ALL_LEVELS",
  tags: ["Small Groups", "Facilitation", "Leadership", "Community"],
  objectives: [
    "Articulate the biblical purpose of small groups",
    "Prepare and lead a discussion around a Bible passage",
    "Ask open, observation and application questions that spark conversation",
    "Gently handle common group dynamics",
    "Care for members and develop an apprentice leader",
  ],
  requirements: ["Current or prospective small group leader, host or apprentice", "Membership at Grace Harbor (or in process)"],
  audience: ["New small group leaders", "Experienced leaders wanting a refresh", "Hosts and apprentices"],
  owner: "daniel",
  coInstructors: ["samuel"],
  status: "PUBLISHED",
  featured: true,
  publishedDaysAgo: 32,
  popularity: 0.6,
  completionRate: 0.3,
  thumbnail: "circle-table",
  sections: [
    {
      title: "The Heart of Small Groups",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Why We Gather in Homes",
          summary: "From the early church to your living room.",
        },
        {
          type: "TEXT",
          title: "Acts 2:42 and the Early Church",
          summary: "Four devotions that still shape healthy groups today.",
          content: `
<h2>A snapshot of the first church</h2>
<p>After Peter's sermon at Pentecost, about three thousand people believed and were baptized. What did they do next? Luke gives us a snapshot that has shaped Christian community ever since:</p>
<blockquote>“And they devoted themselves to the apostles' teaching and the fellowship, to the breaking of bread and the prayers.” (Acts 2:42)</blockquote>
<p>Notice the word <em>devoted</em>. These weren't occasional activities; they were the steady rhythms of a new family.</p>
<h3>1. The apostles' teaching</h3>
<p>Healthy groups are anchored in God's Word. Your job isn't to deliver a lecture, but to help people encounter Scripture together and respond to it.</p>
<h3>2. The fellowship</h3>
<p>The Greek word <em>koinonia</em> means sharing life in common. In Acts 2, believers shared possessions and met needs (vv. 44–45). Fellowship is more than friendliness; it's mutual commitment.</p>
<h3>3. The breaking of bread</h3>
<p>The early Christians ate together, both ordinary meals and the Lord's Supper. There's something about a shared table that opens hearts. Even simple snacks communicate welcome.</p>
<h3>4. The prayers</h3>
<p>Prayer was central, not an afterthought squeezed into the last five minutes. Groups that pray together grow together.</p>
<h2>The result</h2>
<p>Luke tells us the believers had “glad and generous hearts,” enjoyed “favor with all the people,” and “the Lord added to their number day by day” (Acts 2:46–47). Healthy community is attractive, and it multiplies.</p>
<h3>Evaluate your group</h3>
<ul>
<li>Which of the four devotions is strongest in your group?</li>
<li>Which one needs more attention this season?</li>
<li>What is one change you could make at your next meeting?</li>
</ul>
<p>Your group doesn't need to be perfect. It needs to be devoted, steadily returning to these four rhythms week after week.</p>`,
        },
      ],
    },
    {
      title: "Facilitating Great Discussions",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Asking Good Questions",
          summary: "Observation, interpretation and application questions that open people up.",
        },
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Handling Silence, Tangents, and Talkers",
          summary: "Gentle tools for the most common group challenges.",
          comments: [
            {
              question: "We have one member who dominates every discussion. I don't want to embarrass him. Any advice?",
              reply:
                "Very common, and usually the dominant talker has no idea! A few things that help: sit next to him rather than across (less eye contact means fewer prompts), use phrases like “Let's hear from someone who hasn't shared yet,” and try going around the circle for some questions. If it continues, have a warm one-on-one conversation over coffee: affirm how much he contributes and ask him to help you draw quieter people out. Most people respond really well to being given that role.",
              followUp: "Asking him to help draw others out is genius. Trying that this week.",
            },
          ],
        },
        {
          type: "PDF",
          title: "Facilitator's Toolkit",
          summary: "Question templates, a meeting outline and tips for difficult moments.",
          guide: {
            file: "small-group-facilitators-toolkit",
            title: "The Small Group Facilitator's Toolkit",
            subtitle: "Leading a Small Group · Leader Resource",
            scripture: { text: "Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom.", reference: "Colossians 3:16" },
            sections: [
              {
                heading: "A simple meeting outline (90 minutes)",
                paragraphs: ["Adjust times for your group, but protect the time for prayer."],
                bullets: [
                  "Welcome and food (15 min)",
                  "Opening question to get everyone talking (10 min)",
                  "Read the passage aloud (5 min)",
                  "Discussion: observe, interpret, apply (35 min)",
                  "Prayer in pairs or as a group (20 min)",
                  "Announcements and goodbye (5 min)",
                ],
              },
              {
                heading: "Three kinds of questions",
                paragraphs: [
                  "Observation questions help people see what the text says: “What words or ideas are repeated?” Interpretation questions help them understand what it means: “Why do you think Jesus responded that way?” Application questions help them respond: “What would it look like to live this out this week?”",
                  "Avoid yes or no questions and questions with an obvious “Sunday school” answer. If the answer is always “Jesus,” rephrase the question.",
                ],
              },
              {
                heading: "When the room goes quiet",
                paragraphs: [
                  "Silence is not failure; people are often thinking. Count slowly to ten before rephrasing. If the silence continues, ask people to turn to a neighbor for two minutes, then share with the group.",
                ],
              },
              {
                heading: "When a hard question comes up",
                paragraphs: [
                  "It's fine to say “I don't know, let's look into it together.” Write the question down and follow up the next week. Avoid debates on secondary issues that divide; steer back to the passage. If someone shares something painful, pause the discussion and pray for them right then.",
                  "If someone discloses abuse, self-harm or a crisis, contact a pastor that day. Never promise confidentiality when someone's safety is at risk.",
                ],
              },
            ],
            questions: [
              "Which part of the meeting outline does your group tend to rush?",
              "Write one observation, one interpretation and one application question for Luke 10:38–42.",
              "Who in your group might be ready to become an apprentice leader?",
            ],
            closing: "Lord, make our group a place where your Word dwells richly and your love is real. Amen.",
          },
        },
        {
          type: "QUIZ",
          title: "Checkpoint: Facilitation",
          summary: "Review the essential skills of a discussion leader.",
          passingScore: 75,
          questions: [
            {
              type: "MULTIPLE_CHOICE",
              prompt: "According to Acts 2:42, which of these did the early church devote themselves to? (Select all that apply.)",
              explanation: "The apostles' teaching, the fellowship, the breaking of bread and the prayers.",
              options: [
                { text: "The apostles' teaching", correct: true },
                { text: "The fellowship", correct: true },
                { text: "The breaking of bread", correct: true },
                { text: "Building programs" },
              ],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "Which of these is an application question?",
              explanation: "Application questions help people respond personally to the passage.",
              options: [
                { text: "What words are repeated in this passage?" },
                { text: "Who was Jesus speaking to?" },
                { text: "What would it look like to live this out this week?", correct: true },
                { text: "Where did this take place?" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "Silence after a question usually means the question failed and you should answer it yourself.",
              explanation: "People are often thinking. Wait, then rephrase or have people discuss in pairs.",
              answer: false,
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "What is a helpful way to respond when you don't know the answer to a question in your group?",
              explanation: "Honesty builds trust. Say you'll look into it together and follow up.",
              options: [
                { text: "Make your best guess so you seem prepared" },
                { text: "Say “I don't know, let's look into it together” and follow up", correct: true },
                { text: "Change the subject quickly" },
                { text: "Tell them to ask the pastor" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "If someone discloses a crisis or a safety concern, you should contact a pastor that day.",
              explanation: "Safety concerns require prompt pastoral involvement; never promise confidentiality when safety is at risk.",
              answer: true,
            },
          ],
        },
      ],
    },
    {
      title: "Caring for Your Group",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Prayer and Care Between Meetings",
          summary: "The ministry that happens on Tuesday afternoons.",
        },
        {
          type: "TEXT",
          title: "Multiplying Leaders",
          summary: "2 Timothy 2:2 and the joy of raising up apprentices.",
          content: `
<h2>Four generations in one verse</h2>
<p>Paul's final letter to Timothy contains a verse that has shaped leadership development for centuries:</p>
<blockquote>“And what you have heard from me in the presence of many witnesses entrust to faithful men, who will be able to teach others also.” (2 Timothy 2:2)</blockquote>
<p>Count the generations: Paul, Timothy, faithful people, and others also. The gospel spreads through people who invest in people.</p>
<h3>Why apprentices matter</h3>
<ul>
<li><strong>Sustainability:</strong> you won't burn out if you're not doing everything alone.</li>
<li><strong>Growth:</strong> healthy groups grow, and growing groups eventually need to multiply.</li>
<li><strong>Discipleship:</strong> leading is one of the fastest ways people grow in faith.</li>
</ul>
<h3>What to look for</h3>
<p>Look for someone who is <strong>faithful</strong> (shows up and follows through), <strong>available</strong> (has the capacity in this season) and <strong>teachable</strong> (eager to learn and receive feedback). They don't need to be polished.</p>
<h3>The apprenticeship path</h3>
<ol>
<li><strong>I do, you watch.</strong> Invite them to observe how you prepare and lead.</li>
<li><strong>I do, you help.</strong> Let them lead the opening question or prayer time.</li>
<li><strong>You do, I help.</strong> They lead the discussion; you debrief afterward.</li>
<li><strong>You do, I watch.</strong> They lead the whole evening; you cheer them on.</li>
<li><strong>You do, someone else watches.</strong> They begin the cycle with someone new.</li>
</ol>
<p>Most apprentices need six to twelve months. Celebrate each step. And when the day comes to launch a new group, grieve a little and then rejoice: that's what success looks like.</p>`,
        },
        {
          type: "ASSIGNMENT",
          title: "Plan Your First Meeting",
          summary: "Plan a complete small group meeting using the toolkit.",
          instructions: `
<p>Using the Facilitator's Toolkit, plan a full 90-minute small group meeting on a passage of your choice. Include:</p>
<ul>
<li>Your passage and its main idea in one sentence</li>
<li>An opening question</li>
<li>At least two observation, two interpretation and two application questions</li>
<li>How you'll structure prayer time</li>
<li>One person you'll follow up with during the week</li>
</ul>
<p>Type your plan below or upload a document.</p>`,
          allowText: true,
          allowFile: true,
          sampleResponses: [
            "Passage: Luke 10:38–42 (Mary and Martha). Main idea: Jesus invites us to sit at his feet before we serve. Opening: What does a typical busy week look like for you? Observation: What is Martha doing? What is Mary doing? Interpretation: Why does Jesus say Mary chose the good portion? Is Jesus criticizing service? Application: What distracts you from sitting with Jesus? What is one practical change this week? Prayer: in pairs, praying for each other's “one change.” Follow-up: text Jenna on Thursday to see how her new job is going.",
            "Passage: Psalm 23. Main idea: The Lord is a shepherd who provides, guides and stays with us even in dark valleys. Opening: Share a place where you feel most at rest. Observation: What does the shepherd do in each verse? Where does the setting change? Interpretation: Why might David switch from “he” to “you” in verse 4? What is the “table in the presence of my enemies”? Application: Which “valley” are you walking through? How would trusting the shepherd change how you walk through it? Prayer: popcorn prayer, then I'll close. Follow-up: call Robert about his surgery.",
            "Passage: John 21:15–19. Main idea: Jesus restores Peter after failure and recommissions him. Opening: Tell us about a time someone gave you a second chance. Observation: How many times does Jesus ask Peter if he loves him? Interpretation: Why three times? Why does Jesus talk about sheep? Application: Is there a failure you need to bring to Jesus? Who could you “feed” this week? Prayer: men and women split into two groups. Follow-up: coffee with Dave, who has been missing for a few weeks.",
          ],
        },
      ],
    },
  ],
  reviews: [
    "Exactly what I needed as a first-time leader. The toolkit is fantastic.",
    "The tips on handling a dominant talker saved my group, honestly.",
    "Short, practical, biblical. Every group leader should take it.",
    "I loved the apprenticeship steps in the last reading. Already talking to someone about it.",
  ],
};
