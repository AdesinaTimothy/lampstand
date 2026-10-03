import type { CourseSeed } from "../types";

export const bibleInAYear: CourseSeed = {
  slug: "reading-the-bible-in-a-year",
  title: "Reading the Bible in a Year: Getting Started",
  subtitle: "A plan, the tools, and the encouragement to read the whole story of Scripture.",
  description: `
<p>Have you ever started reading through the Bible on January 1st and found yourself stuck in Leviticus by February? You're not alone, and this course is for you. <strong>Reading the Bible in a Year</strong> gives you a realistic plan, a map of the whole story, and simple tools to keep going when it gets hard.</p>
<p>Dr. Miriam Chen shows how the sixty-six books of the Bible fit together into one unfolding story of redemption, and how to read different kinds of writing (narrative, law, poetry, prophecy, gospel and letter) with confidence.</p>
<h3>Included</h3>
<ul>
<li>A printable one-year reading plan with catch-up days built in</li>
<li>The SOAP method for personal Bible study</li>
<li>Encouragement for when you fall behind (because you will!)</li>
</ul>
<p>Hundreds of people at Grace Harbor are reading together this year. Join in at any time; the plan works whenever you start.</p>
<blockquote>“Man shall not live by bread alone, but by every word that comes from the mouth of God.” (Matthew 4:4)</blockquote>`,
  category: "bible-study",
  level: "BEGINNER",
  tags: ["Bible Reading", "Spiritual Habits", "Old Testament", "New Testament"],
  objectives: [
    "See the Bible as one story centered on Jesus",
    "Read different genres of Scripture with understanding",
    "Use the SOAP method to reflect on what you read",
    "Follow a sustainable one-year reading plan",
    "Recover gracefully when you fall behind",
  ],
  requirements: ["A Bible or Bible app", "Ten to fifteen minutes a day"],
  audience: ["Anyone who has never read the whole Bible", "Those who have tried before and stalled", "Families and groups reading together"],
  owner: "miriam",
  status: "PUBLISHED",
  publishedDaysAgo: 46,
  popularity: 0.65,
  completionRate: 0.5,
  thumbnail: "path",
  sections: [
    {
      title: "Before You Begin",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Why Read the Whole Bible?",
          summary: "What we miss when we only read our favorite parts.",
        },
        {
          type: "TEXT",
          title: "The Big Story in Six Acts",
          summary: "A bird's-eye view of Scripture from Genesis to Revelation.",
          content: `
<h2>One story, many books</h2>
<p>The Bible is a library of sixty-six books written over more than a thousand years by dozens of authors. Yet it tells one unified story. Knowing the shape of that story will help you find your place on any page.</p>
<h3>Act 1: Creation</h3>
<p>God creates a good world and places human beings in it as his image-bearers (Genesis 1–2).</p>
<h3>Act 2: Rebellion</h3>
<p>Humanity rejects God's rule, and sin and death enter the world (Genesis 3–11).</p>
<h3>Act 3: Israel</h3>
<p>God calls Abraham and promises to bless all nations through his family. Through Israel's story (the exodus, the Law, the kings, the prophets and the exile) God reveals his holiness and faithfulness, and the hope of a coming King grows (Genesis 12 to Malachi).</p>
<blockquote>“In you all the families of the earth shall be blessed.” (Genesis 12:3)</blockquote>
<h3>Act 4: Jesus</h3>
<p>The promised King arrives. Jesus lives, dies, and rises again, fulfilling the Law and the Prophets and defeating sin and death (Matthew to John).</p>
<h3>Act 5: The Church</h3>
<p>The risen Jesus pours out his Spirit, and the good news spreads from Jerusalem to the ends of the earth (Acts to Jude). We live in this act today.</p>
<h3>Act 6: New Creation</h3>
<p>Jesus will return to make all things new, and God will dwell with his people forever (Revelation 21–22).</p>
<blockquote>“Behold, I am making all things new.” (Revelation 21:5)</blockquote>
<h2>Using the map</h2>
<ul>
<li>When you're reading Leviticus, remember you're in Act 3, learning how a holy God can live among his people. It points ahead to Jesus, our great High Priest.</li>
<li>When you're in the Psalms, you're hearing Israel's prayers, which became Jesus' prayers and now ours.</li>
<li>When you reach the letters, you're reading mail written to churches in Act 5, just like ours.</li>
</ul>
<p>Every book has its place. Keep the six acts in mind and the whole Bible will start to feel like home.</p>`,
        },
        {
          type: "PDF",
          title: "Your One-Year Reading Plan",
          summary: "A printable reading plan with weekly catch-up days.",
          guide: {
            file: "one-year-reading-plan",
            title: "One-Year Bible Reading Plan",
            subtitle: "Reading the Bible in a Year · Reading Plan",
            scripture: { text: "Blessed is the man whose delight is in the law of the Lord, and on his law he meditates day and night.", reference: "Psalm 1:1–2" },
            sections: [
              {
                heading: "How the plan works",
                paragraphs: [
                  "This plan takes you through the whole Bible in fifty-two weeks with five readings per week, leaving two days free to catch up, rest or read more slowly. Each day includes an Old Testament reading and either a Psalm or a New Testament passage, so you always have something familiar alongside something new.",
                  "Most days take twelve to fifteen minutes. Reading aloud or listening to an audio Bible can help when you're tired.",
                ],
              },
              {
                heading: "Quarter by quarter",
                paragraphs: ["Here is the overall shape of the year, so you can see where you're heading."],
                bullets: [
                  "Weeks 1–13: Genesis to Deuteronomy, with Matthew and Mark",
                  "Weeks 14–26: Joshua to Esther, with Luke, John and Psalms 1–50",
                  "Weeks 27–39: Job to Song of Songs and the major prophets, with Acts and Romans",
                  "Weeks 40–52: the minor prophets, with the letters, Psalms 51–150 and Revelation",
                ],
              },
              {
                heading: "When you fall behind",
                paragraphs: [
                  "You will miss days. Everyone does. Don't try to read three weeks of passages in one sitting. Simply pick up with today's reading and use catch-up days to fill gaps, or skip ahead and come back to missed sections next year. The goal is not to finish a checklist but to meet God in his Word.",
                ],
              },
              {
                heading: "Reading together",
                paragraphs: [
                  "Invite a friend, spouse or small group to read along. A short weekly text (“What stood out to you this week?”) is one of the best ways to keep going.",
                ],
              },
            ],
            questions: [
              "What time of day will you read? What might get in the way?",
              "Who will you invite to read along with you?",
              "Which book of the Bible are you most looking forward to reading? Which feels most intimidating?",
            ],
            closing: "Open my eyes, that I may behold wondrous things out of your law. (Psalm 119:18)",
          },
          resources: [{ title: "Bible Gateway: reading plans and audio Bibles", url: "https://www.biblegateway.com/reading-plans/" }],
        },
      ],
    },
    {
      title: "Tools for the Journey",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Reading the Old Testament with Confidence",
          summary: "Law, history, poetry and prophecy, and how each points to Christ.",
        },
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "How to Read the Gospels and Letters",
          summary: "Four portraits of Jesus and the mail of the early church.",
        },
        {
          type: "TEXT",
          title: "The SOAP Method",
          summary: "Scripture, Observation, Application, Prayer: a simple way to reflect.",
          content: `
<h2>From reading to reflecting</h2>
<p>Reading through the Bible gives you the big picture. But sometimes you'll want to slow down and dig into a single verse or passage. The SOAP method is a simple, memorable way to do that in about ten minutes.</p>
<h3>S: Scripture</h3>
<p>Write out a verse or two that stood out to you in today's reading. Writing slows you down and helps you notice details you'd otherwise miss.</p>
<h3>O: Observation</h3>
<p>What do you see? Ask questions of the text:</p>
<ul>
<li>Who is speaking, and to whom?</li>
<li>What words are repeated or emphasized?</li>
<li>What does this show about God's character?</li>
<li>How does it fit in the bigger story?</li>
</ul>
<h3>A: Application</h3>
<p>How does this truth meet your life today? Be specific. Rather than “I should trust God more,” try “I'll stop checking my bank balance every hour and pray when I feel anxious about money.”</p>
<h3>P: Prayer</h3>
<p>Turn what you've learned into a short prayer. Thank God, confess, ask for help to apply it.</p>
<h2>An example</h2>
<p><strong>Scripture:</strong></p>
<blockquote>“The Lord is my shepherd; I shall not want.” (Psalm 23:1)</blockquote>
<p><strong>Observation:</strong> David, a former shepherd, calls God <em>his</em> shepherd. It's personal. Because God shepherds him, he lacks nothing he truly needs.</p>
<p><strong>Application:</strong> I've been anxious about my job interview on Thursday. God is my shepherd in that too. I will prepare well and trust him with the outcome.</p>
<p><strong>Prayer:</strong> Lord, thank you for shepherding me. Help me rest in your care this week instead of worrying. Amen.</p>
<p>Try SOAP once or twice a week alongside your reading plan. Over a year, those journal pages will become a record of God's faithfulness to you.</p>`,
        },
        {
          type: "QUIZ",
          title: "Checkpoint: Ready to Read",
          summary: "Make sure you've got the map and the tools.",
          passingScore: 70,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "In the “six acts” overview, which act are we living in today?",
              explanation: "We live in Act 5, the age of the church, between Jesus' resurrection and his return.",
              options: [{ text: "Act 3: Israel" }, { text: "Act 4: Jesus" }, { text: "Act 5: The Church", correct: true }, { text: "Act 6: New Creation" }],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "What does the “O” in SOAP stand for?",
              explanation: "SOAP is Scripture, Observation, Application and Prayer.",
              options: [{ text: "Obedience" }, { text: "Observation", correct: true }, { text: "Outline" }, { text: "Offering" }],
            },
            {
              type: "TRUE_FALSE",
              prompt: "If you fall behind on a reading plan, the best approach is to read all the missed passages in one sitting.",
              explanation: "Pick up with today's reading and use catch-up days. The goal is meeting God, not finishing a checklist.",
              answer: false,
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which of these are genres (types of writing) found in the Bible? (Select all that apply.)",
              explanation: "Scripture includes narrative, law, poetry, prophecy, gospel, letters and apocalyptic writing.",
              options: [
                { text: "Poetry", correct: true },
                { text: "Prophecy", correct: true },
                { text: "Letters", correct: true },
                { text: "Science fiction" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "God's promise to Abraham in Genesis 12:3 included blessing for all the families of the earth.",
              explanation: "“In you all the families of the earth shall be blessed”, a promise fulfilled in Christ (Galatians 3:8).",
              answer: true,
            },
          ],
        },
      ],
    },
    {
      title: "Keep Going",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "When You Fall Behind",
          summary: "Grace for the days you miss, and practical ways to restart.",
        },
        {
          type: "ASSIGNMENT",
          title: "My First Week of SOAP",
          summary: "Share one SOAP journal entry from your first week of reading.",
          instructions: `
<p>After your first week on the reading plan, share one SOAP entry (Scripture, Observation, Application, Prayer) from a passage you read. Type it below or upload a photo of your journal page.</p>
<p>Add one or two sentences about how the first week went: what helped and what was hard.</p>`,
          allowText: true,
          allowFile: true,
          sampleResponses: [
            "S: Genesis 3:9, “But the Lord God called to the man and said to him, ‘Where are you?’” O: God comes looking for Adam after he sins. God isn't confused about where he is; he's inviting him out of hiding. A: I tend to hide from God when I've messed up, especially by skipping prayer. I want to come out of hiding instead. P: Father, thank you for seeking me. Help me run to you, not away. First week: reading at lunch worked better than mornings.",
            "S: Matthew 4:4, “Man shall not live by bread alone.” O: Jesus quotes Deuteronomy while he is starving in the wilderness. Scripture was his food. A: I scroll my phone for twenty minutes every morning. I'm swapping that for the reading plan. P: Lord, make me hungry for your Word. The first week went great until Saturday, when I skipped. Back on track today!",
            "S: Genesis 15:6, “And he believed the Lord, and he counted it to him as righteousness.” O: Abraham simply believed, and God counted it as righteousness. This connects to Romans 4! A: I'm trying to trust God about our adoption process, which has been slow. P: Lord, help me believe your promises like Abraham. The audio Bible on my commute has been a game-changer.",
          ],
        },
      ],
    },
  ],
  reviews: [
    "The six acts overview was a lightbulb moment. I finally see how it all fits together.",
    "I'm on week five of the reading plan, the furthest I've ever made it!",
    "SOAP is so simple and so helpful. My husband and I compare notes on Sunday nights.",
    "Encouraging, practical and short enough to actually finish.",
    "Good intro. Already recommended it to my whole small group.",
  ],
};
