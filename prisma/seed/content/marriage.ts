import type { CourseSeed } from "../types";

export const christCenteredMarriage: CourseSeed = {
  slug: "building-a-christ-centered-marriage",
  title: "Building a Christ-Centered Marriage",
  subtitle: "Covenant love, everyday oneness and a shared mission, for engaged and married couples.",
  description: `
<p>Marriage is one of God's greatest gifts, and one of life's greatest challenges. Whether you're preparing for your wedding day or celebrating thirty years together, <strong>Building a Christ-Centered Marriage</strong> offers biblical wisdom and practical tools for loving each other well.</p>
<p>Esther Whitfield, who leads our Marriage &amp; Family ministry with her husband James, draws on Scripture and two decades of walking with couples through joy, conflict, parenting and loss. Each session is designed to be watched together and followed by a short conversation.</p>
<h3>What we'll cover</h3>
<ul>
<li>Marriage as covenant, not contract, from Genesis 2 to Ephesians 5</li>
<li>Communication that builds up rather than tears down</li>
<li>Fighting fair and forgiving quickly</li>
<li>Praying together and discovering your shared mission</li>
</ul>
<p>A downloadable conversation guide helps you keep talking long after each lesson ends. Couples in our premarital program complete this course before meeting with a mentor couple.</p>
<blockquote>“Love is patient and kind; love does not envy or boast; it is not arrogant or rude.” (1 Corinthians 13:4–5)</blockquote>`,
  category: "marriage-and-family",
  level: "ALL_LEVELS",
  tags: ["Marriage", "Communication", "Forgiveness", "Couples"],
  objectives: [
    "Understand marriage as a covenant reflecting Christ and the church",
    "Practice communication habits that build trust",
    "Resolve conflict in a way that honors God and each other",
    "Establish a rhythm of praying together as a couple",
    "Write a shared marriage mission statement",
  ],
  requirements: ["Ideally taken together as a couple", "An hour a week for lessons and conversation"],
  audience: ["Engaged couples in premarital preparation", "Married couples at any stage", "Mentor couples and marriage ministry volunteers"],
  owner: "esther",
  status: "PUBLISHED",
  publishedDaysAgo: 112,
  popularity: 0.55,
  completionRate: 0.45,
  thumbnail: "rings",
  sections: [
    {
      title: "God's Design for Marriage",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "In the Beginning: Covenant, Not Contract",
          summary: "Why the difference between covenant and contract changes everything.",
        },
        {
          type: "TEXT",
          title: "Two Become One: Genesis 2 and Ephesians 5",
          summary: "How the first marriage points to the greatest love story.",
          content: `
<h2>Where marriage begins</h2>
<p>The Bible's first wedding takes place in a garden. God sees that it is “not good” for the man to be alone, forms the woman, and brings her to him. The man responds with the first recorded poetry in Scripture, and then the narrator adds a sentence that Jesus and Paul will both quote:</p>
<blockquote>“Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh.” (Genesis 2:24)</blockquote>
<h3>Leave, cleave, become one</h3>
<ul>
<li><strong>Leave:</strong> a new family is formed; the marriage takes priority over every other human relationship.</li>
<li><strong>Hold fast:</strong> a covenant commitment, faithful and permanent.</li>
<li><strong>One flesh:</strong> a union of whole lives (body, soul, plans, resources and future).</li>
</ul>
<h3>The mystery revealed</h3>
<p>Centuries later, Paul quotes Genesis 2:24 and then says something astonishing: “This mystery is profound, and I am saying that it refers to Christ and the church” (Ephesians 5:32). Marriage was always meant to be a living picture of the gospel.</p>
<p>Husbands are called to love their wives “as Christ loved the church and gave himself up for her.” Wives and husbands are both called to “submit to one another out of reverence for Christ” (Ephesians 5:21). Every instruction in the passage is shaped by the self-giving love of Jesus.</p>
<h3>Why this matters on a Tuesday night</h3>
<p>When marriage is a contract, we ask, “Am I getting what I signed up for?” When marriage is a covenant, we ask, “How can I love you the way Christ has loved me?” The first question leads to scorekeeping. The second leads to grace.</p>
<h2>Talk about it</h2>
<ol>
<li>What did you learn about marriage from the homes you grew up in?</li>
<li>Where do you most need to “leave” in order to “hold fast”?</li>
<li>What is one way your spouse has shown you Christ-like love this month?</li>
</ol>`,
        },
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Love That Serves",
          summary: "Putting each other first in the ordinary moments.",
        },
      ],
    },
    {
      title: "Everyday Oneness",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Communication That Builds Up",
          summary: "Ephesians 4:29 for husbands and wives.",
        },
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Fighting Fair and Forgiving Fast",
          summary: "Practical ground rules for conflict, and what to do when you blow it.",
          comments: [
            {
              question: "What do you do when one spouse needs to talk it out right away and the other needs time to process?",
              reply:
                "This is one of the most common differences James and I see, and we have it ourselves! What's helped us: the one who needs space names a specific time to come back (“Can we talk after dinner?”) so it doesn't feel like avoidance, and the one who wants to talk now honors that request. Ephesians 4:26 says don't let the sun go down on your anger, which is about not letting resentment settle in. It doesn't mean you must resolve everything in one sitting.",
              followUp: "Naming a time to come back is so simple but I think it will help us a lot. Thank you!",
            },
          ],
        },
        {
          type: "PDF",
          title: "Couple's Conversation Guide",
          summary: "Twelve weeks of conversation prompts to keep you talking.",
          guide: {
            file: "couples-conversation-guide",
            title: "The Couple's Conversation Guide",
            subtitle: "Building a Christ-Centered Marriage · Companion Guide",
            scripture: { text: "Above all, keep loving one another earnestly, since love covers a multitude of sins.", reference: "1 Peter 4:8" },
            sections: [
              {
                heading: "How to use this guide",
                paragraphs: [
                  "Set aside thirty minutes each week, without phones or children, for one conversation. Take turns reading the prompts aloud. The goal isn't to solve everything but to know and be known. Listen more than you speak, and ask follow-up questions before offering your own view.",
                ],
              },
              {
                heading: "Weeks 1–4: Knowing each other",
                paragraphs: ["Begin with gratitude and memory. These conversations build a foundation of warmth for harder topics later."],
                bullets: [
                  "What first drew you to me? What do you appreciate now that you didn't then?",
                  "What is a high point and a low point from the past month?",
                  "When do you feel most loved by me?",
                  "What dreams do you have that you haven't told me about?",
                ],
              },
              {
                heading: "Weeks 5–8: Navigating differences",
                paragraphs: ["Approach these with curiosity. Differences aren't problems to fix; they're part of how God makes two people stronger together."],
                bullets: [
                  "How did your family handle money, conflict and celebrations?",
                  "What tends to escalate our disagreements? What helps calm them?",
                  "Is there anything you need to forgive me for that we haven't talked about?",
                  "How can we protect our rest and our time together?",
                ],
              },
              {
                heading: "Weeks 9–12: Faith and mission",
                paragraphs: ["Close by looking outward together. A marriage on mission grows stronger as it serves."],
                bullets: [
                  "How can I support your walk with God?",
                  "When could we pray together most naturally?",
                  "Who could we encourage or welcome into our home this season?",
                  "What do we want people to say about our marriage in twenty years?",
                ],
              },
            ],
            questions: [
              "Which conversation surprised you most?",
              "What habit from this guide do you want to keep?",
              "Who is a couple you could invite to try this guide with you?",
            ],
            closing: "Lord, make our home a place where your love is seen and your peace is felt. Amen.",
          },
        },
        {
          type: "QUIZ",
          title: "Checkpoint: Covenant Love",
          summary: "Review God's design for marriage and healthy communication.",
          passingScore: 70,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "Which verse is quoted by both Jesus and Paul about a man and woman becoming “one flesh”?",
              explanation: "Genesis 2:24 is quoted in Matthew 19:5 and Ephesians 5:31.",
              options: [{ text: "Genesis 1:1" }, { text: "Genesis 2:24", correct: true }, { text: "Proverbs 31:10" }, { text: "Song of Songs 8:6" }],
            },
            {
              type: "TRUE_FALSE",
              prompt: "Paul says that marriage is a picture of Christ and the church.",
              explanation: "Ephesians 5:32: “This mystery is profound, and I am saying that it refers to Christ and the church.”",
              answer: true,
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which of these are healthy ground rules for conflict discussed in the course? (Select all that apply.)",
              explanation: "Address the issue rather than attacking the person, take breaks with a set time to return, and seek forgiveness quickly.",
              options: [
                { text: "Attack the problem, not the person", correct: true },
                { text: "Take a break if needed, but name a time to come back", correct: true },
                { text: "Bring up past mistakes to win the argument" },
                { text: "Ask for and offer forgiveness quickly", correct: true },
              ],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "What is the key difference between a covenant and a contract?",
              explanation: "A contract protects self-interest and is conditional; a covenant is a self-giving promise of faithfulness.",
              options: [
                { text: "A covenant is only for religious people" },
                { text: "A covenant is a self-giving promise; a contract protects self-interest", correct: true },
                { text: "There is no real difference" },
                { text: "A contract lasts longer than a covenant" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "A Marriage on Mission",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Praying Together",
          summary: "Starting small when praying together feels awkward.",
        },
        {
          type: "AUDIO",
          title: "Devotional for Couples: Love Is Patient",
          summary: "A short audio devotional on 1 Corinthians 13 to listen to together.",
        },
        {
          type: "ASSIGNMENT",
          title: "Our Marriage Mission Statement",
          summary: "Write a shared statement of what your marriage is for.",
          instructions: `
<p>Together with your spouse or fiancé(e), write a marriage mission statement of 2–4 sentences. Then add a short paragraph (150–300 words) explaining:</p>
<ul>
<li>Which Scriptures shaped your statement</li>
<li>One habit you'll start to live it out</li>
<li>One way your marriage can serve others in this season</li>
</ul>
<p>Submit one response per couple, or each of you may submit your own reflections.</p>`,
          allowText: true,
          allowFile: true,
          sampleResponses: [
            "Our mission: “To love God first, to love each other faithfully, and to open our home as a place of rest and welcome.” Ephesians 5 and Romans 12:13 shaped this a lot. Our habit is a Sunday evening check-in with prayer. In this season, we want to host international students from the university for dinner once a month.",
            "Mission statement: “Our marriage exists to reflect Christ's patient love, to raise our children to know him, and to be a safe harbor for friends in hard seasons.” We were drawn to 1 Corinthians 13 and Psalm 127. We'll start praying together for five minutes before bed. We'd like to become a mentor couple for engaged couples in a couple of years.",
            "We wrote: “Two imperfect people, held together by a perfect Savior, serving our neighbors side by side.” We have very different personalities, and Ecclesiastes 4:9–12 reminded us that's a strength. Our habit will be a monthly date where we talk through the conversation guide. We are going to serve together on the welcome team.",
          ],
        },
      ],
    },
  ],
  reviews: [
    "We took this during our engagement and it gave us so many good conversations.",
    "Esther is wise, warm and real. The fighting fair session saved us a few arguments already!",
    "Twenty-two years married and we still learned new things. The conversation guide is fantastic.",
    "Wonderful. Would love a follow-up course on parenting.",
    "Practical and biblical without being preachy.",
  ],
};
