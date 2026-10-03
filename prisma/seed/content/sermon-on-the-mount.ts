import type { CourseSeed } from "../types";

export const sermonOnTheMount: CourseSeed = {
  slug: "the-sermon-on-the-mount",
  title: "The Sermon on the Mount",
  subtitle: "Jesus' vision of life in the kingdom of God, from Matthew 5–7.",
  description: `
<p>The Sermon on the Mount is the most famous sermon ever preached, and perhaps the most misunderstood. Some treat it as an impossible ideal; others reduce it to good advice. Jesus meant it as something far richer: a portrait of life under the loving rule of God, offered to ordinary disciples.</p>
<p>In this course Dr. Miriam Chen walks with you up the mountainside, through the Beatitudes, the call to be salt and light, Jesus' teaching on anger and enemies, the Lord's Prayer, worry and treasure, and finally the choice between two foundations.</p>
<h3>You will</h3>
<ul>
<li>Read Matthew 5–7 slowly, in context, with notes on the original setting</li>
<li>Discover why the Beatitudes are blessings, not entrance requirements</li>
<li>Practice a week of trusting God with your worries</li>
</ul>
<p>Come ready to be comforted and unsettled in equal measure. That is what happens when we listen closely to Jesus.</p>
<blockquote>“Everyone then who hears these words of mine and does them will be like a wise man who built his house on the rock.” (Matthew 7:24)</blockquote>`,
  category: "bible-study",
  level: "ALL_LEVELS",
  tags: ["Matthew", "Kingdom of God", "Discipleship", "Bible Study"],
  objectives: [
    "Read Matthew 5–7 as a unified sermon with a clear structure",
    "Explain the Beatitudes as gifts of grace to the poor in spirit",
    "Understand how Jesus fulfills the Law and calls for righteousness of the heart",
    "Practice secret giving, prayer and fasting before the Father",
    "Replace anxious patterns with trust in God's care",
  ],
  requirements: ["A Bible and a willingness to read Matthew 5–7 several times", "No prior study needed"],
  audience: [
    "Anyone who wants to hear Jesus' teaching in his own words",
    "Believers looking to deepen everyday discipleship",
    "Groups wanting a short, focused study",
  ],
  owner: "miriam",
  status: "PUBLISHED",
  publishedDaysAgo: 101,
  popularity: 0.6,
  completionRate: 0.4,
  thumbnail: "mountain",
  sections: [
    {
      title: "The Kingdom Turned Upside Down",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Setting the Scene on the Mountain",
          summary: "Who was listening, and why Matthew frames Jesus as a new Moses.",
          notes: `<p>Read Matthew 4:23–5:2 before watching. Notice who gathers around Jesus: the sick, the oppressed, and the curious from every region.</p>`,
        },
        {
          type: "TEXT",
          title: "The Beatitudes: Blessed Are…",
          summary: "Eight blessings that overturn the world's idea of the good life.",
          content: `
<h2>Blessing before command</h2>
<p>Jesus does not begin his sermon with demands. He begins with blessing. Before he tells his disciples how to live, he tells them who they are in the kingdom of God. That order is the gospel in miniature.</p>
<blockquote>“Blessed are the poor in spirit, for theirs is the kingdom of heaven.” (Matthew 5:3)</blockquote>
<h3>What “blessed” means</h3>
<p>The word is not simply “happy.” It describes the deep flourishing of someone who stands in God's favor. Jesus pronounces that favor over people the world would overlook: the spiritually bankrupt, the grieving, the meek and the hungry for justice.</p>
<h3>The eight blessings</h3>
<ol>
<li><strong>The poor in spirit</strong> receive the kingdom; it begins with admitting our need.</li>
<li><strong>Those who mourn</strong> will be comforted, both over sin and over a broken world.</li>
<li><strong>The meek</strong> will inherit the earth; strength under God's control, not weakness.</li>
<li><strong>Those who hunger and thirst for righteousness</strong> will be satisfied.</li>
<li><strong>The merciful</strong> will receive mercy.</li>
<li><strong>The pure in heart</strong> will see God.</li>
<li><strong>The peacemakers</strong> will be called sons of God.</li>
<li><strong>The persecuted</strong> for righteousness' sake own the kingdom.</li>
</ol>
<h3>Not a ladder, a portrait</h3>
<p>It's tempting to read the Beatitudes as eight achievements to unlock. But Jesus is describing a single character, his own, which the Spirit forms in his people. Notice that the first and last blessings share the same promise: “theirs is the kingdom of heaven.” Everything in between belongs inside that gift.</p>
<h2>For reflection</h2>
<ul>
<li>Which beatitude feels most like good news to you today?</li>
<li>Which one feels most foreign to your instincts?</li>
<li>Where do you see this character in Jesus himself during his passion week?</li>
</ul>
<p>Read the Beatitudes aloud each morning this week. Let them shape your expectations before the day does.</p>`,
        },
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Salt and Light",
          summary: "A distinctive people for the sake of the world (Matthew 5:13–16).",
        },
      ],
    },
    {
      title: "A Righteousness That Goes Deeper",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Anger, Lust, and the Heart (Matthew 5:21–30)",
          summary: "Jesus takes the commandments to the root of our desires.",
        },
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Love Your Enemies (Matthew 5:38–48)",
          summary: "The most radical command and the Father who makes it possible.",
          notes: `<blockquote>“But I say to you, Love your enemies and pray for those who persecute you, so that you may be sons of your Father who is in heaven.” (Matthew 5:44–45)</blockquote>`,
        },
        {
          type: "QUIZ",
          title: "Checkpoint: Matthew 5",
          summary: "Review the Beatitudes and Jesus' teaching on the Law.",
          passingScore: 70,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "What promise is attached to the first Beatitude, “Blessed are the poor in spirit”?",
              explanation: "Matthew 5:3: “for theirs is the kingdom of heaven.” The same promise closes the list in 5:10.",
              options: [
                { text: "They shall be comforted" },
                { text: "Theirs is the kingdom of heaven", correct: true },
                { text: "They shall inherit the earth" },
                { text: "They shall see God" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "Jesus said he came to abolish the Law and the Prophets.",
              explanation: "Matthew 5:17: “I have not come to abolish them but to fulfill them.”",
              answer: false,
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which images does Jesus use to describe his disciples in Matthew 5:13–16? (Select all that apply.)",
              explanation: "Disciples are the salt of the earth and the light of the world, like a city on a hill.",
              options: [
                { text: "Salt of the earth", correct: true },
                { text: "Light of the world", correct: true },
                { text: "A city set on a hill", correct: true },
                { text: "Branches of the vine" },
              ],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "According to Matthew 5:44, how should disciples treat their enemies?",
              explanation: "Jesus commands love and prayer for those who persecute us, reflecting the Father's kindness to all.",
              options: [
                { text: "Avoid them completely" },
                { text: "Love them and pray for them", correct: true },
                { text: "Tolerate them until they apologize" },
                { text: "Repay them in kind" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "In Matthew 5:21–22, Jesus teaches that anger in the heart matters to God, not only the act of murder.",
              explanation: "Jesus traces the command against murder back to the anger and contempt that give rise to it.",
              answer: true,
            },
          ],
        },
      ],
    },
    {
      title: "Life Before the Father",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Secret Giving, Prayer, and Fasting",
          summary: "Practicing righteousness for an audience of One (Matthew 6:1–18).",
        },
        {
          type: "TEXT",
          title: "Do Not Worry (Matthew 6:25–34)",
          summary: "Birds, lilies and the Father who knows what you need.",
          content: `
<h2>An invitation, not a scolding</h2>
<p>“Do not be anxious” can sound like one more burden: now I'm anxious about being anxious! But listen to how Jesus speaks. He doesn't shame us; he points us to the birds and the flowers and to a Father who cares for them.</p>
<blockquote>“Look at the birds of the air: they neither sow nor reap nor gather into barns, and yet your heavenly Father feeds them. Are you not of more value than they?” (Matthew 6:26)</blockquote>
<h3>Three reasons not to worry</h3>
<ol>
<li><strong>Your Father knows.</strong> “Your heavenly Father knows that you need them all” (6:32). Worry assumes God is unaware or uncaring.</li>
<li><strong>Worry doesn't work.</strong> “Which of you by being anxious can add a single hour to his span of life?” (6:27).</li>
<li><strong>Today has enough.</strong> “Sufficient for the day is its own trouble” (6:34). God gives grace for today, not for imagined tomorrows.</li>
</ol>
<h3>Seek first</h3>
<p>Jesus doesn't simply remove worry; he replaces it with a better pursuit:</p>
<blockquote>“But seek first the kingdom of God and his righteousness, and all these things will be added to you.” (Matthew 6:33)</blockquote>
<p>Worry shrinks our world down to our own needs. Seeking the kingdom enlarges it. When we pour our energy into loving God and neighbor, our anxieties take their proper, smaller place.</p>
<h3>Practical steps</h3>
<ul>
<li>When a worry surfaces, say it to God out loud or write it down.</li>
<li>Ask: “What is mine to do today?” Do that, and entrust the rest to him.</li>
<li>Thank God for one specific provision from yesterday.</li>
<li>Read Philippians 4:6–7 alongside this passage.</li>
</ul>
<p>Trust grows the way muscles do: through repeated, small exercises. This week's assignment will give you a chance to practice.</p>`,
        },
        {
          type: "PDF",
          title: "Study Guide: Matthew 6–7",
          summary: "Notes and questions on treasure, worry, judging and the two foundations.",
          guide: {
            file: "matthew-6-7-study-guide",
            title: "Matthew 6–7: Treasure, Trust and Two Foundations",
            subtitle: "The Sermon on the Mount · Study Guide",
            scripture: { text: "For where your treasure is, there your heart will be also.", reference: "Matthew 6:21" },
            sections: [
              {
                heading: "Overview",
                paragraphs: [
                  "In the second half of the sermon Jesus turns from public righteousness to private devotion and everyday trust. He addresses our giving, our praying, our money, our worries and the way we treat one another, and then he closes with a call to decision.",
                ],
              },
              {
                heading: "Treasure and the heart (6:19–24)",
                paragraphs: [
                  "Jesus does not say that our heart follows our treasure by accident. Where we invest our time and money shapes what we love. Treasure stored in heaven is anything given away in love for God and neighbor; it cannot be eaten by moths or stolen by thieves.",
                  "“No one can serve two masters.” Money makes a wonderful servant and a terrible master. Jesus invites us to hold possessions with an open hand.",
                ],
              },
              {
                heading: "Judging and asking (7:1–12)",
                paragraphs: [
                  "The warning against judging is not a ban on discernment; Jesus goes on to speak of false prophets. It is a warning against a fault-finding spirit that sees the speck in another's eye and ignores the log in our own.",
                  "Then comes a beautiful promise: ask, seek, knock. If earthly parents give good gifts, how much more will our Father in heaven give good things to those who ask him.",
                ],
              },
              {
                heading: "Two roads, two trees, two houses (7:13–27)",
                paragraphs: [
                  "The sermon ends with a series of contrasts. There is a narrow gate and a wide one, good fruit and bad, a house on the rock and a house on the sand. Both houses face the same storm. The difference is not whether trouble comes but whether we have built on hearing and doing the words of Jesus.",
                ],
              },
            ],
            questions: [
              "What would someone conclude about your treasure by looking at your calendar and bank statement?",
              "Which worry from Matthew 6:25–34 is most familiar to you?",
              "Why do you think Jesus places the Golden Rule (7:12) where he does?",
              "What is one specific way you can move from hearing Jesus' words to doing them this week?",
            ],
            closing: "Our Father in heaven, give us this day our daily bread, and help us to seek your kingdom first. Amen.",
          },
        },
        {
          type: "ASSIGNMENT",
          title: "A Week Without Worry",
          summary: "Practice Matthew 6:25–34 for seven days and reflect on what you learn.",
          instructions: `
<p>For seven days, practice the steps from <em>Do Not Worry</em>:</p>
<ol>
<li>Each morning, write down what you're anxious about and hand it to God in prayer.</li>
<li>Ask, “What is mine to do today?” and do it.</li>
<li>Each evening, note one way God provided.</li>
</ol>
<p>At the end of the week, write 200–350 words on what you noticed. What changed? What didn't? What did you learn about your heavenly Father?</p>`,
          allowText: true,
          allowFile: false,
          dueDaysAfterEnrollment: 30,
          sampleResponses: [
            "My biggest worry this week was my mom's biopsy results. Writing it down every morning felt silly at first, but it helped me see that I was rehearsing worst-case scenarios all day long. The question “What is mine to do today?” was a gift. Some days the answer was simply to call her and pray with her. The results came back benign on Friday. I know the answer won't always be what I want, but I learned that my Father knew and cared before I ever wrote it down.",
            "I worry about money constantly, and this week the car needed new brakes. Every evening I wrote down one provision: a friend who knew a cheaper mechanic, an unexpected refund, leftovers from small group. Seeing the list grow over seven days was humbling. I'm going to keep the evening part going.",
            "Honestly the week didn't go perfectly. I skipped the morning prayer three times. But I noticed that on the days I did it, I was kinder to my kids and less short with my coworkers. Matthew 6:34 is now on a sticky note on my bathroom mirror.",
          ],
        },
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "The Wise and Foolish Builders",
          summary: "Jesus' closing call: hear and do.",
        },
      ],
    },
  ],
  reviews: [
    "I've read Matthew 5–7 many times but never saw the structure until now. Beautifully taught.",
    "The worry assignment was surprisingly powerful. I'm still doing the evening gratitude list.",
    "Thoughtful and pastoral. Dr. Chen never lets the text become just an academic exercise.",
    "Good course, a bit short. Would have liked more on the Lord's Prayer.",
    "The Beatitudes reading changed how I pray in the mornings.",
  ],
};
