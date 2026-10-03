import type { CourseSeed } from "../types";

export const prayerThatShapesUs: CourseSeed = {
  slug: "prayer-that-shapes-us",
  title: "Prayer That Shapes Us",
  subtitle: "Learn to pray with honesty, confidence and joy, in every season of life.",
  description: `
<p>Most Christians wish they prayed more. Fewer know how to start, or how to keep going when prayer feels dry, distracted or unanswered. <strong>Prayer That Shapes Us</strong> is a practical, gentle course that meets you where you are.</p>
<p>We'll learn from Jesus' own model in the Lord's Prayer, borrow the vocabulary of the Psalms, and practice simple patterns like ACTS (adoration, confession, thanksgiving and supplication). We'll also face the hard questions honestly: What about prayers that seem to go unanswered? How do we pray when we're grieving or angry?</p>
<h3>Along the way</h3>
<ul>
<li>Guided audio prayers you can use on a walk or a commute</li>
<li>A printable prayer journal guide</li>
<li>A seven-day prayer practice with personal feedback</li>
</ul>
<p>Prayer is not a technique to master. It is a conversation with a Father who delights to hear his children. Our hope is that this course will help you enjoy that conversation more.</p>
<blockquote>“Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.” (Philippians 4:6)</blockquote>`,
  category: "discipleship",
  level: "ALL_LEVELS",
  tags: ["Prayer", "Psalms", "Spiritual Habits", "Devotional"],
  objectives: [
    "Use the Lord's Prayer as a pattern for your own prayers",
    "Pray the Psalms in seasons of joy and sorrow",
    "Practice the ACTS pattern of adoration, confession, thanksgiving and supplication",
    "Intercede faithfully for others",
    "Bring lament and unanswered prayer honestly before God",
  ],
  requirements: ["A Bible and a journal or notebook", "Willingness to practice, not just learn about, prayer"],
  audience: [
    "Anyone who wants a more consistent prayer life",
    "Believers in a dry or difficult season",
    "Prayer team members and intercessors",
  ],
  owner: "daniel",
  coInstructors: ["esther"],
  status: "PUBLISHED",
  publishedDaysAgo: 88,
  popularity: 0.75,
  completionRate: 0.4,
  thumbnail: "ripples",
  sections: [
    {
      title: "Learning to Pray",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Lord, Teach Us to Pray",
          summary: "The disciples' request, and why it's ours too.",
          notes: `<p>Luke 11:1: “Lord, teach us to pray.” The disciples had watched Jesus pray. They didn't ask him to teach them to preach or heal; they asked to learn to pray.</p>`,
        },
        {
          type: "TEXT",
          title: "The Lord's Prayer as a Pattern",
          summary: "Six petitions that train our desires.",
          content: `
<h2>More than words to recite</h2>
<p>When Jesus gave his disciples the Lord's Prayer, he said, “Pray then <em>like this</em>” (Matthew 6:9). It is certainly a prayer to pray word for word, and the church has done so for centuries. But it is also a pattern that shapes every other prayer we pray.</p>
<blockquote>“Our Father in heaven, hallowed be your name. Your kingdom come, your will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our debts, as we also have forgiven our debtors. And lead us not into temptation, but deliver us from evil.” (Matthew 6:9–13)</blockquote>
<h3>Begin with who God is</h3>
<p><strong>“Our Father in heaven.”</strong> We come as children to a Father who is both near (“Father”) and mighty (“in heaven”). The word “our” reminds us we never pray alone.</p>
<h3>God's priorities first</h3>
<ul>
<li><strong>Hallowed be your name</strong>: may God be honored as holy, in my life and in the world.</li>
<li><strong>Your kingdom come</strong>: may his loving rule spread and one day be complete.</li>
<li><strong>Your will be done</strong>: may my desires bend toward his.</li>
</ul>
<h3>Then our needs</h3>
<ul>
<li><strong>Daily bread</strong>: God cares about ordinary provision. Ask for today.</li>
<li><strong>Forgiveness</strong>: we need it daily, and receiving it makes us forgiving.</li>
<li><strong>Protection</strong>: we are weak and the enemy is real; we ask God to keep us.</li>
</ul>
<h2>Praying the pattern</h2>
<p>Try praying through each line slowly, pausing to put it into your own words. For example, after “your kingdom come,” you might pray for your neighbor who doesn't yet know Jesus, or for justice in a situation in the news. After “daily bread,” name the specific needs in front of you today.</p>
<p>Over time this pattern reorders our hearts. We start with God's glory and find that our own needs fall into their proper place, held in the hands of a good Father.</p>`,
        },
        {
          type: "AUDIO",
          title: "Guided Prayer: Be Still",
          summary: "A short guided prayer from Psalm 46 to quiet your heart.",
          notes: `<p>“Be still, and know that I am God.” (Psalm 46:10). Use this audio at the start of your prayer time, or whenever you need to pause.</p>`,
        },
      ],
    },
    {
      title: "Rhythms of Prayer",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Praying the Psalms",
          summary: "God's own prayer book for every emotion.",
        },
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Intercession: Standing in the Gap",
          summary: "Why and how we pray for others.",
          notes: `<p>Practical idea: keep a simple list with a different focus each day: family on Monday, church on Tuesday, neighbors on Wednesday, the world on Thursday, and so on.</p>`,
        },
        {
          type: "PDF",
          title: "Prayer Journal Guide",
          summary: "A printable guide to the ACTS pattern with prompts for each day of the week.",
          guide: {
            file: "prayer-journal-guide",
            title: "The ACTS Prayer Journal",
            subtitle: "Prayer That Shapes Us · Companion Guide",
            scripture: { text: "Rejoice always, pray without ceasing, give thanks in all circumstances.", reference: "1 Thessalonians 5:16–18" },
            sections: [
              {
                heading: "How to use this guide",
                paragraphs: [
                  "ACTS is a simple pattern that helps keep prayer balanced: Adoration, Confession, Thanksgiving and Supplication. It isn't a formula, just a trellis for a growing vine. Spend a few minutes on each part, writing a sentence or two if it helps you focus.",
                ],
              },
              {
                heading: "A: Adoration",
                paragraphs: [
                  "Begin by praising God for who he is, not just for what he gives. Choose one attribute each day: his faithfulness, holiness, mercy, wisdom, power or nearness. A psalm such as Psalm 103 or Psalm 145 is a wonderful starting point.",
                ],
              },
              {
                heading: "C: Confession",
                paragraphs: [
                  "Honestly name where you have fallen short in thought, word and deed. Be specific, then receive the promise of 1 John 1:9. Confession is not about wallowing; it clears the air between a child and a loving Father.",
                ],
              },
              {
                heading: "T: Thanksgiving",
                paragraphs: [
                  "Thank God for specific gifts from the past day: people, provisions, answered prayers and moments of grace. Gratitude trains our eyes to notice God's hand.",
                ],
              },
              {
                heading: "S: Supplication",
                paragraphs: ["Bring your requests for yourself and for others. Use the weekly rhythm below so that no one is forgotten."],
                bullets: [
                  "Monday: family and close friends",
                  "Tuesday: Grace Harbor Church, its pastors and ministries",
                  "Wednesday: neighbors, coworkers and classmates",
                  "Thursday: our city and its leaders",
                  "Friday: missionaries and the persecuted church",
                  "Saturday: those who are sick, grieving or struggling",
                  "Sunday: worship services and those hearing the gospel",
                ],
              },
            ],
            questions: [
              "Which part of ACTS comes most naturally to you? Which is hardest?",
              "What attribute of God did you dwell on most this week, and how did it shape your day?",
              "Who is one person you will commit to pray for daily for the next month?",
            ],
            closing: "Lord, teach us to pray, and make our prayers a delight to you. Amen.",
          },
        },
        {
          type: "QUIZ",
          title: "Checkpoint: Patterns of Prayer",
          summary: "Review the Lord's Prayer and the ACTS pattern.",
          passingScore: 75,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "What does the “C” in the ACTS prayer pattern stand for?",
              explanation: "ACTS stands for Adoration, Confession, Thanksgiving and Supplication.",
              options: [{ text: "Celebration" }, { text: "Confession", correct: true }, { text: "Commitment" }, { text: "Contemplation" }],
            },
            {
              type: "TRUE_FALSE",
              prompt: "In Matthew 6:9, Jesus introduces the Lord's Prayer with “Pray then like this,” suggesting it is also a pattern for prayer.",
              explanation: "The Lord's Prayer is both a prayer to pray and a model that shapes all our praying.",
              answer: true,
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which of these petitions are part of the Lord's Prayer? (Select all that apply.)",
              explanation: "The prayer includes God's name, kingdom and will, daily bread, forgiveness and deliverance from evil.",
              options: [
                { text: "Your kingdom come", correct: true },
                { text: "Give us this day our daily bread", correct: true },
                { text: "Grant us success in all we do" },
                { text: "Forgive us our debts", correct: true },
              ],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "Why are the Psalms especially helpful for prayer?",
              explanation: "The Psalms give us God-inspired words for every human emotion: praise, lament, confession, thanksgiving and trust.",
              options: [
                { text: "They are the shortest books in the Bible" },
                { text: "They give us words for every emotion and season", correct: true },
                { text: "They only contain songs of praise" },
                { text: "They replace the need for personal prayer" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "When Prayer Is Hard",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Unanswered Prayer and the Goodness of God",
          summary: "Holding on to God's character when the answer is “wait” or “no.”",
          comments: [
            {
              question:
                "We prayed for two years for my brother's healing and he passed away in March. I want to keep praying but some days I honestly don't see the point. How do you keep going?",
              reply:
                "I'm so sorry for the loss of your brother. Thank you for trusting us with something so tender. I don't think there's a tidy answer, and I'd be wary of anyone who offers one. What has helped many in our church is the honesty of the lament psalms, like Psalm 13 and Psalm 88. God gave us words for exactly these days. Prayer in grief may look like sitting in silence, or simply saying “I'm still here.” That counts. Esther and I would be honored to meet with you if you'd like; our care team also has a grief group starting this fall.",
              followUp: "Thank you, Pastor Daniel. I'll reach out about the grief group.",
            },
          ],
        },
        {
          type: "TEXT",
          title: "Lament: Honest Prayer in Hard Seasons",
          summary: "The biblical permission to complain to God, and the path it takes.",
          content: `
<h2>A third of the Psalms</h2>
<p>Roughly a third of the Psalms are laments: prayers of complaint, sorrow and protest addressed to God. That alone should tell us something. God has not only given us permission to bring our pain to him; he has given us the words.</p>
<blockquote>“How long, O Lord? Will you forget me forever? How long will you hide your face from me?” (Psalm 13:1)</blockquote>
<h3>The shape of lament</h3>
<p>Most laments follow a recognizable path. Learning it can help us pray when our own words run out.</p>
<ol>
<li><strong>Turn to God.</strong> Lament is addressed <em>to</em> God, not just about him. That itself is an act of faith.</li>
<li><strong>Bring your complaint.</strong> Name what hurts, honestly and specifically.</li>
<li><strong>Ask boldly.</strong> “Consider and answer me, O Lord my God” (Psalm 13:3).</li>
<li><strong>Choose to trust.</strong> “But I have trusted in your steadfast love” (Psalm 13:5).</li>
</ol>
<h3>Lament is not unbelief</h3>
<p>Some of us were taught that strong Christians don't complain. But lament is the opposite of giving up on God. Bitterness turns away from God; lament turns toward him. Jesus himself prayed a lament from the cross: “My God, my God, why have you forsaken me?” (Psalm 22:1, Matthew 27:46).</p>
<h3>Write your own</h3>
<p>Try writing a lament using the four movements above. Don't rush to the trust part. Sometimes it takes days or weeks to get there, and that is okay. Psalm 88 ends in darkness, and it is still in the Bible.</p>
<ul>
<li>Who or what are you grieving right now?</li>
<li>What do you want to ask God directly?</li>
<li>What do you know to be true about his character, even when you can't feel it?</li>
</ul>
<p>If you are carrying deep grief, please don't carry it alone. Our pastoral care team would love to walk with you.</p>`,
        },
        {
          type: "ASSIGNMENT",
          title: "Seven Days of the ACTS Pattern",
          summary: "Pray using ACTS for a week and share what you learned.",
          instructions: `
<p>Using the Prayer Journal Guide, pray through the ACTS pattern for seven consecutive days. Follow the weekly supplication rhythm so you pray for a different focus each day.</p>
<p>Then write a short reflection (200–350 words) on these questions:</p>
<ul>
<li>Which part of ACTS was most meaningful? Which was most difficult?</li>
<li>Did anything change in how you see God, yourself or others?</li>
<li>What rhythm of prayer do you want to keep going?</li>
</ul>
<p>You may also upload a photo or scan of a journal page instead of typing.</p>`,
          allowText: true,
          allowFile: true,
          dueDaysAfterEnrollment: 35,
          sampleResponses: [
            "Adoration was the hardest part for me. I'm used to jumping straight into requests. By day four, starting with Psalm 145 made my requests feel smaller and God feel bigger, in a good way. Confession was humbling; I realized how often I'm impatient with my husband. The weekly rhythm helped me pray for missionaries for the first time in years. I want to keep the Tuesday prayer for our church going.",
            "I did the seven days on my morning train commute with the guide on my phone. Thanksgiving was the surprise. Writing three specific things each day made me notice so much more. I've decided to keep a gratitude list going even after the course ends.",
            "Honestly I only made it five days in a row, then restarted. The supplication rhythm is brilliant. Praying for our city's leaders on Thursday felt strange at first, but I found myself less cynical about local news. I'm going to keep a small card in my wallet with the weekly focus list.",
          ],
        },
      ],
    },
  ],
  reviews: [
    "I've struggled with prayer my whole Christian life. This course gave me simple, practical handles.",
    "The lament lesson was exactly what I needed after a very hard year.",
    "Love the guided audio prayers. I use “Be Still” almost every morning.",
    "The ACTS journal guide is now taped inside my Bible.",
    "Good, gentle and honest. Would recommend for anyone feeling stuck.",
  ],
};
