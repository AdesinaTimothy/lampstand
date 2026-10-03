import type { CourseSeed } from "../types";

export const foundationsOfFaith: CourseSeed = {
  slug: "foundations-of-faith",
  title: "Foundations of Faith: A New Believer's Journey",
  subtitle: "Six weeks to understand the gospel, find assurance, and build daily habits that last.",
  description: `
<p>Whether you prayed to receive Christ last week or have been around church for years without ever settling the basics, this course is for you. <strong>Foundations of Faith</strong> walks through the heart of the Christian message in plain language, one short session at a time.</p>
<p>We begin with the good news itself: who Jesus is, why he came, and what his death and resurrection mean for ordinary people like us. From there we explore grace, assurance, and the quiet confidence that comes from knowing you belong to God, not because of your performance, but because of his promise.</p>
<h3>What makes this course different</h3>
<ul>
<li>Short video teachings you can finish on a lunch break</li>
<li>Readings that open the Bible with you, not just about it</li>
<li>A printable study guide for your first steps in prayer and Scripture</li>
<li>A chance to write your own story of grace and share it with a pastor</li>
</ul>
<p>You don't need any background knowledge. Bring your questions, your doubts, and a Bible if you have one. If you don't, we'd love to give you one at the Welcome Center.</p>
<blockquote>“Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.” (2 Corinthians 5:17)</blockquote>`,
  category: "new-believers",
  level: "BEGINNER",
  tags: ["Gospel", "New Believers", "Assurance", "Spiritual Habits"],
  objectives: [
    "Explain the gospel in your own words using the story of creation, fall, redemption and restoration",
    "Describe who Jesus is and why his death and resurrection matter",
    "Understand grace and rest in the assurance of salvation",
    "Begin simple daily rhythms of Bible reading and prayer",
    "Know what baptism and communion mean and why the church practices them",
    "Write and share your personal story of grace",
  ],
  requirements: [
    "No prior Bible knowledge needed",
    "A Bible in any modern translation (printed or app)",
    "About 20 minutes, two or three times a week",
  ],
  audience: [
    "New Christians taking their first steps of faith",
    "Anyone exploring what Christians believe",
    "Longtime churchgoers who want to revisit the basics",
  ],
  owner: "daniel",
  coInstructors: ["miriam"],
  status: "PUBLISHED",
  featured: true,
  publishedDaysAgo: 138,
  popularity: 1.6,
  completionRate: 0.5,
  thumbnail: "sunrise",
  sections: [
    {
      title: "Beginning with Jesus",
      description: "The good news at the center of everything.",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Welcome: Why This Journey Matters",
          summary: "Pastor Daniel welcomes you and explains how the course works and what to expect.",
          notes: `<p>Faith is not a one-time decision we file away; it is a relationship that grows. In this course we'll take small, steady steps together.</p><ul><li>Watch each session when you can give it your full attention.</li><li>Keep a notebook or use the notes tab to record questions.</li><li>Don't rush. Growth in Christ is a walk, not a sprint.</li></ul>`,
        },
        {
          type: "TEXT",
          title: "The Gospel in Four Movements",
          summary: "Creation, fall, redemption and restoration: the whole story of the Bible in one view.",
          content: `
<h2>The story we find ourselves in</h2>
<p>The word <em>gospel</em> simply means “good news.” But good news only makes sense when we know the story it belongs to. The Bible tells one great story in four movements.</p>
<h3>1. Creation: made for God</h3>
<p>God created everything, and it was good. He made human beings in his own image to know him, love him and care for his world. We were made for relationship with our Creator.</p>
<blockquote>“So God created man in his own image, in the image of God he created him; male and female he created them.” (Genesis 1:27)</blockquote>
<h3>2. Fall: separated from God</h3>
<p>Rather than trusting God, the first people chose their own way. Sin entered the world, and with it brokenness, shame and death. Every one of us has followed that same path. Sin is not only the wrong things we do; it is a heart turned away from God.</p>
<blockquote>“For all have sinned and fall short of the glory of God.” (Romans 3:23)</blockquote>
<h3>3. Redemption: rescued by God</h3>
<p>God did not leave us in our sin. He sent his Son, Jesus, who lived the perfect life we could not live and died on the cross in our place. Three days later he rose from the dead, defeating sin and death. Everyone who turns from sin and trusts in Jesus is forgiven and made new.</p>
<blockquote>“But God shows his love for us in that while we were still sinners, Christ died for us.” (Romans 5:8)</blockquote>
<h3>4. Restoration: made new with God</h3>
<p>The story is not finished. Jesus will return to make all things new, wiping away every tear. Until then, his people live as a preview of that coming kingdom, loving God and loving our neighbors.</p>
<h2>Putting it together</h2>
<ul>
<li><strong>Creation</strong> tells us who we are.</li>
<li><strong>Fall</strong> tells us what went wrong.</li>
<li><strong>Redemption</strong> tells us what God has done.</li>
<li><strong>Restoration</strong> tells us where history is heading.</li>
</ul>
<p>Try telling this story to yourself in two minutes. If you can, you're ready to share it with someone else.</p>`,
        },
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Who Is Jesus?",
          summary: "Fully God and fully man: why the identity of Jesus changes everything.",
          notes: `<p>Key passages: John 1:1–14, Colossians 1:15–20, Philippians 2:5–11.</p><p>Jesus is not merely a good teacher or a moral example. He is the eternal Son of God who became one of us so that we could be brought back to God.</p>`,
        },
      ],
    },
    {
      title: "Grace and Assurance",
      description: "Resting in what God has done rather than what we can do.",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Saved by Grace Through Faith",
          summary: "Ephesians 2 and the difference between earning and receiving.",
          notes: `<blockquote>“For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.” (Ephesians 2:8–9)</blockquote><p>Grace is God's undeserved kindness. Faith is the empty hand that receives it.</p>`,
          comments: [
            {
              question:
                "If we're saved by grace and not by works, why does James say faith without works is dead? I've always found those two passages confusing.",
              reply:
                "Great question, and you're in good company asking it! Paul and James aren't contradicting each other; they're answering different questions. Paul tells us how we are made right with God: by grace through faith alone. James tells us what real faith looks like once it's alive: it always bears fruit. Look at Ephesians 2:10, right after verses 8–9: we are created in Christ Jesus “for good works.” Works are the fruit of salvation, never the root.",
              followUp: "“Fruit, not root.” That really helps. Thank you, Pastor Daniel!",
            },
            {
              question: "Is it normal to still feel guilty about things from before I became a Christian?",
              reply:
                "Very normal, and you're not alone. Feelings often take time to catch up with the truth. When guilt resurfaces, bring it straight back to the cross and read 1 John 1:9 and Romans 8:1 out loud. If something specific keeps weighing on you, I'd love to talk and pray with you. Just reply here or catch me after a Sunday service.",
            },
          ],
        },
        {
          type: "TEXT",
          title: "Assurance: Can I Know I Belong to God?",
          summary: "Three anchors for a confident faith when feelings come and go.",
          content: `
<h2>When doubts come knocking</h2>
<p>Many new believers wonder, “Did it really take? Am I really a Christian?” Those questions are not a sign of weak faith. Often they are a sign that you care deeply about God. The good news is that Scripture wants you to <em>know</em>, not just hope.</p>
<blockquote>“I write these things to you who believe in the name of the Son of God, that you may know that you have eternal life.” (1 John 5:13)</blockquote>
<h3>Anchor 1: the promise of God</h3>
<p>Our confidence rests first on what God has said. Jesus promised that whoever comes to him he will never cast out (John 6:37). Your salvation is as secure as the One who promised it.</p>
<h3>Anchor 2: the work of Christ</h3>
<p>When Jesus said “It is finished” on the cross, he meant it. We do not add to his work; we receive it. Assurance grows as we look less at the strength of our faith and more at the strength of our Savior.</p>
<h3>Anchor 3: the witness of the Spirit</h3>
<p>The Holy Spirit lives in every believer and gently assures us that we are God's children (Romans 8:16). Over time you will notice signs of his work:</p>
<ul>
<li>A new love for God and a desire to know him</li>
<li>A growing sensitivity to sin and a longing to turn from it</li>
<li>Love for other believers</li>
<li>A hunger for God's Word, even when it's hard</li>
</ul>
<h2>What to do with doubt</h2>
<ol>
<li><strong>Name it honestly.</strong> God is not threatened by your questions.</li>
<li><strong>Return to the promises.</strong> Read John 10:27–29 slowly.</li>
<li><strong>Talk with someone.</strong> Doubt grows in isolation and shrinks in community.</li>
</ol>
<p>Feelings rise and fall like the tide. God's promises are the harbor wall that does not move.</p>`,
        },
        {
          type: "AUDIO",
          title: "Morning Devotional: Resting in His Love",
          summary: "A short guided reflection on Zephaniah 3:17 to begin your day.",
          notes: `<p>Find a quiet place, take a slow breath, and listen. You may want to read Zephaniah 3:17 before or after.</p>`,
        },
        {
          type: "QUIZ",
          title: "Checkpoint: The Gospel and Grace",
          summary: "A quick review of the first two sections.",
          passingScore: 70,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "Which of these best describes the four movements of the Bible's story, in order?",
              explanation: "The Bible's story moves from Creation to Fall to Redemption to Restoration.",
              options: [
                { text: "Creation, Fall, Redemption, Restoration", correct: true },
                { text: "Law, Prophets, Gospels, Letters" },
                { text: "Fall, Creation, Restoration, Redemption" },
                { text: "Promise, Exile, Return, Kingdom" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "According to Ephesians 2:8–9, we are saved by grace through faith, not as a result of works.",
              explanation: "Salvation is God's gift, received by faith. Good works follow as fruit (Ephesians 2:10).",
              answer: true,
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which of these are anchors of assurance described in the lesson? (Select all that apply.)",
              explanation: "Assurance rests on God's promise, Christ's finished work and the Spirit's witness, not on how strong our feelings are on a given day.",
              options: [
                { text: "The promise of God", correct: true },
                { text: "The finished work of Christ", correct: true },
                { text: "The witness of the Holy Spirit", correct: true },
                { text: "How emotional I felt when I first believed" },
              ],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "What does the word “gospel” mean?",
              explanation: "Gospel comes from a word meaning “good news”: the announcement of what God has done in Jesus.",
              options: [
                { text: "A set of rules for living" },
                { text: "Good news", correct: true },
                { text: "A type of church music" },
                { text: "The first four books of the Old Testament" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "Having doubts means a person cannot be a genuine Christian.",
              explanation: "Many faithful believers wrestle with doubt. Scripture invites us to bring our questions to God and rest on his promises (Mark 9:24).",
              answer: false,
            },
          ],
        },
      ],
    },
    {
      title: "Growing Daily",
      description: "Simple habits that help faith take root.",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Reading the Bible for Yourself",
          summary: "Where to start, what to look for, and how to keep going when it's hard.",
          notes: `<p>Suggested starting point: the Gospel of Mark, one chapter a day. Ask three questions of every passage: What does this show me about God? About people? How should I respond?</p>`,
          resources: [{ title: "Read Mark online at Bible Gateway", url: "https://www.biblegateway.com/passage/?search=Mark+1&version=ESV" }],
        },
        {
          type: "PDF",
          title: "Study Guide: First Steps in Prayer and Scripture",
          summary: "A printable guide with a two-week reading plan and simple prayer prompts.",
          guide: {
            file: "first-steps-prayer-and-scripture",
            title: "First Steps in Prayer and Scripture",
            subtitle: "Foundations of Faith · Study Guide",
            scripture: { text: "Your word is a lamp to my feet and a light to my path.", reference: "Psalm 119:105" },
            sections: [
              {
                heading: "Why daily rhythms matter",
                paragraphs: [
                  "Just as our bodies need regular meals, our souls need regular nourishment. Reading Scripture and praying are not ways to earn God's love; they are ways to enjoy it. A few minutes each day, kept faithfully, will shape you more than an occasional marathon.",
                  "Start small. Choose a time you can protect, such as before work, at lunch, or before bed, and a place where you can be quiet. Keep your Bible, a pen and this guide there.",
                ],
              },
              {
                heading: "A simple pattern for reading",
                paragraphs: [
                  "Read a short passage slowly, perhaps twice. Then ask three questions and write a sentence for each. You do not need to understand everything. Underline what stands out and bring your questions to your small group or to a pastor.",
                ],
                bullets: [
                  "What does this passage show me about God?",
                  "What does it show me about people, and about me?",
                  "How will I respond today in trust or obedience?",
                ],
              },
              {
                heading: "A simple pattern for prayer",
                paragraphs: [
                  "Prayer is talking with God as a beloved child. Use the reading you have just finished as a springboard: thank God for what you saw of him, confess where you fall short, and ask for his help to respond. Then pray for one or two people by name.",
                  "If your mind wanders, that is normal. Gently come back. Short honest prayers are better than long distracted ones.",
                ],
              },
              {
                heading: "Two-week reading plan",
                paragraphs: [
                  "Days 1–7: Mark 1 through Mark 7, one chapter a day. Days 8–14: Mark 8 through Mark 14. On the last day, read Mark 15 and 16 together and spend extra time thanking God for the cross and the empty tomb.",
                ],
              },
            ],
            questions: [
              "What time and place will you set apart for reading and prayer this week?",
              "Which passage from Mark surprised you most, and why?",
              "What did you learn about Jesus that you want to remember?",
              "Who is one person you will pray for every day this week?",
            ],
            closing: "Lord, open my eyes to see wonderful things in your Word, and teach me to walk with you each day. Amen.",
          },
        },
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Baptism, Communion, and the Church Family",
          summary: "Two gifts Jesus gave his church, and why you were never meant to follow him alone.",
          notes: `<p>Interested in being baptized? Our next baptism Sunday is announced in the weekly bulletin. Talk with any pastor or stop by the Welcome Center.</p>`,
        },
        {
          type: "ASSIGNMENT",
          title: "My Story of Grace",
          summary: "Write a short testimony of how God has been at work in your life.",
          instructions: `
<p>Every believer has a story worth telling. In 250–400 words, write your story of grace using three simple parts:</p>
<ol>
<li><strong>Before:</strong> What was your life like, and what were you looking to for meaning or security?</li>
<li><strong>Turning point:</strong> How did you come to understand and trust the gospel?</li>
<li><strong>Since:</strong> What has begun to change, and what are you still trusting God for?</li>
</ol>
<p>Keep Jesus at the center. You don't need a dramatic story; God's faithfulness in an ordinary life is a powerful witness. Pastor Daniel or Dr. Chen will read every submission personally.</p>`,
          allowText: true,
          allowFile: true,
          dueDaysAfterEnrollment: 42,
          sampleResponses: [
            "Before: I grew up going to church at Christmas and Easter, but faith felt like something for my grandmother, not me. In my twenties I poured everything into my career and told myself that if I just achieved enough, I would finally feel settled. Turning point: After my father's heart surgery last year, a coworker invited me to Grace Harbor. Pastor Daniel preached on the prodigal son and I realized I had been the older brother, trying to earn something the Father was offering freely. I prayed that night in my car in the parking lot. Since: I'm reading Mark with my wife in the mornings. I still get anxious about work, but I'm learning to bring that to God instead of carrying it alone.",
            "Before: I was raised in a Christian home and could quote verses, but honestly I think I believed in being good more than I believed in Jesus. Turning point: During a hard season of depression, the only thing that made sense was Romans 8. A friend from my small group sat with me and kept reminding me that nothing could separate me from God's love. Somewhere in those months I stopped performing and started trusting. Since: I'm more honest with God in prayer. I'm still on the journey, but I know now that his grip on me is stronger than my grip on him.",
            "Before: I didn't grow up with any faith at all and thought Christians were mostly judgmental. Turning point: My neighbors brought us meals for a month when our son was born early. When I asked why, they said they had been loved first. That stuck with me. I started reading the Gospel of John on my phone during night feedings and I couldn't get away from Jesus. I was baptized in June. Since: I'm learning to pray, joining a small group, and trying to love my own neighbors the way I was loved.",
            "Before: I knew a lot about God but kept him at arm's length because of the mistakes I'd made in college. Turning point: Reading Ephesians 2 in this course, I finally understood that grace is a gift, not a reward. I cried at my kitchen table. Since: I've started meeting with an older woman from church once a month, and I'm praying about being baptized.",
          ],
        },
      ],
    },
  ],
  reviews: [
    "Clear, warm and never condescending. I finally understand what grace actually means.",
    "I've been a Christian for years and still got so much out of this. The assurance lesson was exactly what I needed.",
    "Perfect length. I did one lesson a night after the kids went to bed.",
    "The study guide and the Gospel of Mark plan got me reading my Bible every day for the first time.",
    "Writing my story of grace was harder than I expected and so worth it. Pastor Daniel's reply was really encouraging.",
    "Great course for anyone new to faith. Would love a follow-up on the Holy Spirit.",
  ],
};
