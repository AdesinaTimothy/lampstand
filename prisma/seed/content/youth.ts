import type { CourseSeed } from "../types";

export const faithThatHolds: CourseSeed = {
  slug: "faith-that-holds",
  title: "Faith That Holds: A Youth Series",
  subtitle: "Honest answers and real hope for students navigating doubt, identity and pressure.",
  description: `
<p>Being a teenager today means facing big questions, often alone and often online. Is the Bible trustworthy? Why does God allow suffering? Who am I when my phone is constantly telling me who to be? <strong>Faith That Holds</strong> takes those questions seriously.</p>
<p>Pastor Samuel Adeyemi leads this series designed for students in grades 8–12. Each session is short enough to watch before youth group and deep enough to talk about for hours afterward. Our hope is simple: that every student would discover that faith in Jesus is not fragile. It's an anchor that holds.</p>
<h3>Inside the series</h3>
<ul>
<li>Videos on trust, suffering, identity and friendship</li>
<li>A late-night audio devotional for when your mind won't switch off</li>
<li>A personal “anchor verse” project to carry with you</li>
</ul>
<p>Parents: you're warmly encouraged to take the course too, so you can keep the conversation going at home.</p>
<blockquote>“We have this as a sure and steadfast anchor of the soul.” (Hebrews 6:19)</blockquote>`,
  category: "youth",
  level: "BEGINNER",
  tags: ["Youth", "Apologetics", "Identity", "Hope"],
  objectives: [
    "Understand why hope in Christ is described as an anchor",
    "Respond thoughtfully to common questions about the Bible and suffering",
    "Root identity in being known and loved by God",
    "Build friendships that point each other to Jesus",
    "Choose and memorize a personal anchor verse",
  ],
  requirements: ["For students in grades 8–12 (parents welcome)", "A Bible or Bible app"],
  audience: ["Middle and high school students", "Parents of teenagers", "Youth small group leaders"],
  owner: "samuel",
  status: "PUBLISHED",
  publishedDaysAgo: 61,
  popularity: 0.45,
  completionRate: 0.35,
  thumbnail: "anchor",
  sections: [
    {
      title: "An Anchor for the Soul",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "When Everything Feels Uncertain",
          summary: "Pastor Samuel on anxiety, change and a hope that doesn't move.",
        },
        {
          type: "TEXT",
          title: "Hebrews 6: Hope as an Anchor",
          summary: "What an ancient image says about holding on in the storm.",
          content: `
<h2>Why an anchor?</h2>
<p>The writer of Hebrews was speaking to believers who were tired, pressured and tempted to give up. To encourage them, he reached for an image every sailor understood: an anchor.</p>
<blockquote>“We have this as a sure and steadfast anchor of the soul, a hope that enters into the inner place behind the curtain, where Jesus has gone as a forerunner on our behalf.” (Hebrews 6:19–20)</blockquote>
<h3>An anchor doesn't stop the storm</h3>
<p>An anchor doesn't calm the waves. The wind still howls and the boat still rocks. What an anchor does is keep you from drifting onto the rocks. Faith in Jesus doesn't promise that life will be easy, but it does promise you won't be lost.</p>
<h3>An anchor holds to something outside the boat</h3>
<p>Here's the key: an anchor works because it grips something solid <em>outside</em> the boat. If you threw an anchor into the boat, it would be useless. In the same way, our hope isn't anchored in how strong our feelings are, how well we're doing or what people think of us. It's anchored in Jesus, who has gone ahead of us into God's presence.</p>
<h3>Two unchangeable things</h3>
<p>Just before this verse, Hebrews says God gave us “two unchangeable things” so we could have strong encouragement: his promise and his oath (Hebrews 6:17–18). God can't lie. When he says he will never leave you, that's not wishful thinking; it's a fixed point.</p>
<h2>Check your anchor</h2>
<ul>
<li>What are you tempted to anchor your hope in: grades, friends, followers, sports, a relationship?</li>
<li>What happens to your mood when those things shift?</li>
<li>What would it look like to tie your hope to Jesus this week?</li>
</ul>
<p>Storms are coming for all of us. The question isn't whether the wind will blow. It's what you'll be anchored to when it does.</p>`,
        },
      ],
    },
    {
      title: "Questions Worth Asking",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Can I Trust the Bible?",
          summary: "Manuscripts, eyewitnesses and why the Bible holds up to hard questions.",
        },
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Why Does God Allow Suffering?",
          summary: "No easy answers, but a God who suffers with us.",
        },
        {
          type: "AUDIO",
          title: "Late-Night Devotional: You Are Known",
          summary: "A calm reflection on Psalm 139 for when you can't sleep.",
        },
        {
          type: "QUIZ",
          title: "Checkpoint: Faith That Holds",
          summary: "Quick check on the big ideas so far.",
          passingScore: 75,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "Where does Hebrews 6 say our hope is anchored?",
              explanation: "Our hope enters “behind the curtain,” where Jesus has gone ahead on our behalf. It's anchored in him, outside of us.",
              options: [
                { text: "In our own feelings" },
                { text: "In Jesus, who has gone before us into God's presence", correct: true },
                { text: "In our good behavior" },
                { text: "In our church attendance" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "According to the lesson, an anchor stops the storm from happening.",
              explanation: "An anchor doesn't stop the storm; it keeps the boat from drifting and being lost.",
              answer: false,
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which of these were discussed as reasons to trust the reliability of the Bible? (Select all that apply.)",
              explanation: "The session covered the large number of early manuscripts, eyewitness testimony and fulfilled prophecy.",
              options: [
                { text: "The number of early manuscripts", correct: true },
                { text: "Eyewitness testimony in the Gospels", correct: true },
                { text: "It has never been questioned by anyone" },
                { text: "Fulfilled prophecy", correct: true },
              ],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "Psalm 139 teaches that God…",
              explanation: "Psalm 139 celebrates that God knows us completely and is present with us everywhere.",
              options: [
                { text: "Only knows us when we pray" },
                { text: "Knows us completely and is with us everywhere", correct: true },
                { text: "Is far away and uninvolved" },
                { text: "Loves us only when we behave" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Faith in Real Life",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Identity, Phones, and Belonging",
          summary: "Who you are when no one is liking your posts.",
        },
        {
          type: "TEXT",
          title: "Friendship That Points to Jesus",
          summary: "What Jonathan and David teach us about real friendship.",
          content: `
<h2>Friends shape us</h2>
<p>Show me your friends, the old saying goes, and I'll show you your future. Scripture agrees: “Whoever walks with the wise becomes wise, but the companion of fools will suffer harm” (Proverbs 13:20). The people we spend time with shape what we love.</p>
<h3>Jonathan and David</h3>
<p>One of the greatest friendships in the Bible is between Jonathan, the son of King Saul, and David, the shepherd who would become king. Jonathan had every reason to see David as a rival. Instead:</p>
<blockquote>“The soul of Jonathan was knit to the soul of David, and Jonathan loved him as his own soul.” (1 Samuel 18:1)</blockquote>
<p>Later, when David was on the run, Jonathan “went to David at Horesh, and strengthened his hand in God” (1 Samuel 23:16). That's the goal of Christian friendship: not just having fun together, though that matters, but helping each other hold on to God.</p>
<h3>Marks of a friend who points to Jesus</h3>
<ul>
<li><strong>Loyal:</strong> they don't disappear when things get hard.</li>
<li><strong>Honest:</strong> “Faithful are the wounds of a friend” (Proverbs 27:6). They tell you the truth in love.</li>
<li><strong>Humble:</strong> they celebrate your wins without jealousy, like Jonathan did.</li>
<li><strong>Encouraging:</strong> they remind you of God's promises when you forget.</li>
</ul>
<h3>Be that friend</h3>
<p>It's easy to wish for friends like this. It's better to become one. Who in your life needs someone to “strengthen their hand in God” this week? A text, a prayer, a seat next to them at lunch could be exactly that.</p>
<p>And remember: Jesus calls you his friend (John 15:15). Every other friendship gets better when that one comes first.</p>`,
        },
        {
          type: "ASSIGNMENT",
          title: "My Anchor Verse",
          summary: "Choose a verse to hold on to and explain why.",
          instructions: `
<p>Choose one Bible verse to be your “anchor verse” this year. Then write 150–300 words (or upload a short video, art piece or photo of a journal page):</p>
<ul>
<li>What is your verse, and what does it mean in your own words?</li>
<li>Why did you choose it? What storm in your life does it speak to?</li>
<li>Where will you put it so you see it every day?</li>
</ul>
<p>Pastor Samuel and the youth leaders will read every one and pray for you.</p>`,
          allowText: true,
          allowFile: true,
          sampleResponses: [
            "My verse is Isaiah 41:10: “Fear not, for I am with you.” I get really bad anxiety before tests and sometimes I can't sleep. This verse reminds me that God is with me even in the exam room. I made it my phone lock screen so I see it like a hundred times a day.",
            "Joshua 1:9. We moved here this summer and starting a new school has been hard. I didn't know anyone. “Be strong and courageous... for the Lord your God is with you wherever you go.” Wherever includes a new school. I wrote it on a sticky note in my locker.",
            "Mine is Psalm 139:14, “I praise you, for I am fearfully and wonderfully made.” I compare myself to people online way too much. This verse says God made me on purpose. I painted it on a canvas for my room (photo attached).",
          ],
        },
      ],
    },
  ],
  reviews: [
    "Pastor Samuel actually gets what it's like to be in high school. The identity session was so good.",
    "My son and I did this together and it opened up conversations we've never had.",
    "The late-night devotional helps me when I can't sleep.",
    "Real answers to real questions. Wish it was longer!",
  ],
};
