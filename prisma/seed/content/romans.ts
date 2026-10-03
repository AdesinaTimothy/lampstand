import type { CourseSeed } from "../types";

export const walkingThroughRomans: CourseSeed = {
  slug: "walking-through-romans",
  title: "Walking Through Romans",
  subtitle: "A guided journey through Paul's greatest letter: sin, grace, the Spirit, and a life of worship.",
  description: `
<p>Martin Luther called Romans “the purest gospel.” For two thousand years this letter has rekindled faith, sparked revivals and given ordinary believers solid ground to stand on. In <strong>Walking Through Romans</strong>, Dr. Miriam Chen guides you through the whole letter, section by section, in a way that is both careful and deeply personal.</p>
<p>We will trace Paul's argument from the universal problem of sin, to the astonishing gift of righteousness by faith, to the Spirit-filled life of Romans 8, and finally to the practical, everyday worship of Romans 12–16. Along the way we'll stop to ask what it all means for Monday morning.</p>
<h3>How the course is built</h3>
<ul>
<li>Teaching videos on each major movement of the letter</li>
<li>Readings that explain the historical setting and key words like <em>justification</em> and <em>propitiation</em></li>
<li>A printable study guide for Romans 1–4 to use alone or with your group</li>
<li>Checkpoint quizzes and a practical assignment on Romans 12</li>
</ul>
<p>This course works well on its own, and even better alongside a friend or small group. Many of our groups are working through it together this season.</p>
<blockquote>“For I am not ashamed of the gospel, for it is the power of God for salvation to everyone who believes.” (Romans 1:16)</blockquote>`,
  category: "bible-study",
  level: "INTERMEDIATE",
  tags: ["Romans", "Paul", "Grace", "Bible Study", "New Testament"],
  objectives: [
    "Trace the flow of Paul's argument across all sixteen chapters of Romans",
    "Define justification, sanctification and adoption from the text",
    "Understand why Abraham is central to Paul's case for faith",
    "Find lasting hope in the promises of Romans 8",
    "Apply the call of Romans 12 to relationships at home, work and church",
  ],
  requirements: [
    "Comfort reading longer Bible passages",
    "Foundations of Faith (or similar) is helpful but not required",
    "A Bible you can write in, or a notebook",
  ],
  audience: [
    "Believers who want to go deeper in Scripture",
    "Small groups looking for a guided book study",
    "Anyone who has started Romans before and stalled",
  ],
  owner: "miriam",
  status: "PUBLISHED",
  featured: true,
  publishedDaysAgo: 124,
  popularity: 0.85,
  completionRate: 0.3,
  thumbnail: "open-book",
  sections: [
    {
      title: "Introduction to Romans",
      description: "Who wrote it, who received it, and why it still matters.",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Paul, Rome, and Why This Letter Matters",
          summary: "The story behind the letter and the big question Romans answers.",
          notes: `<p>Paul wrote Romans around AD 57 from Corinth, to a church he had never visited, made up of both Jewish and Gentile believers. His goal: to set out the gospel clearly and unite the church around it.</p>`,
        },
        {
          type: "TEXT",
          title: "Reading Romans Well: Context and Structure",
          summary: "A map of the letter so you never lose your place.",
          content: `
<h2>A letter, not a textbook</h2>
<p>It's easy to treat Romans like a systematic theology manual, but it is first a <em>letter</em>: written by a real apostle to real people facing real tensions. The church in Rome included Jewish believers who had returned after being expelled under Emperor Claudius, and Gentile believers who had led the church in their absence. Questions about the Law, food and holy days were not abstract to them.</p>
<h3>The theme</h3>
<p>Paul states his theme near the start:</p>
<blockquote>“For in it the righteousness of God is revealed from faith for faith, as it is written, ‘The righteous shall live by faith.’” (Romans 1:17)</blockquote>
<p>Everything that follows unpacks this sentence: how a holy God can declare sinners righteous, and how those declared righteous then live.</p>
<h3>A map of the letter</h3>
<ol>
<li><strong>1:1–17</strong> Greeting and theme</li>
<li><strong>1:18–3:20</strong> The problem: all humanity under sin</li>
<li><strong>3:21–5:21</strong> The solution: righteousness through faith in Christ</li>
<li><strong>6:1–8:39</strong> The new life: freedom from sin and life in the Spirit</li>
<li><strong>9:1–11:36</strong> God's faithfulness to Israel and the nations</li>
<li><strong>12:1–15:13</strong> The response: living sacrifices in community</li>
<li><strong>15:14–16:27</strong> Travel plans, greetings and doxology</li>
</ol>
<h3>Three tips as you read</h3>
<ul>
<li><strong>Watch for “therefore.”</strong> Paul builds arguments; ask what each “therefore” is there for.</li>
<li><strong>Read aloud.</strong> Romans was written to be heard in a gathered church.</li>
<li><strong>Don't skip chapter 16.</strong> Its long list of names reminds us that doctrine always lives in people.</li>
</ul>
<p>Keep this map nearby as we go. When a passage feels dense, find where it sits in the larger flow and the meaning often comes into focus.</p>`,
        },
        {
          type: "PDF",
          title: "Study Guide: Romans 1–4",
          summary: "A printable guide with background notes and discussion questions for the opening chapters.",
          guide: {
            file: "romans-1-4-study-guide",
            title: "Romans 1–4: The Problem and the Promise",
            subtitle: "Walking Through Romans · Study Guide",
            scripture: { text: "For all have sinned and fall short of the glory of God, and are justified by his grace as a gift.", reference: "Romans 3:23–24" },
            sections: [
              {
                heading: "Background",
                paragraphs: [
                  "Paul opens his letter by introducing himself as a servant of Christ Jesus, called to be an apostle. He longs to visit Rome and to strengthen the believers there. Before he arrives, he sets out the gospel he preaches so that Jewish and Gentile Christians can stand together on the same foundation.",
                  "Chapters 1–3 can feel heavy, because Paul spends a long time describing human sin. But he does this for the same reason a doctor explains a diagnosis: the cure only makes sense once we understand the disease.",
                ],
              },
              {
                heading: "Key words",
                paragraphs: ["Watch for these words as you read. Circle them in your Bible and note how Paul uses each one."],
                bullets: [
                  "Righteousness: right standing with God, and the right character that flows from it",
                  "Justify: to declare righteous, a legal verdict rather than a moral improvement",
                  "Propitiation: a sacrifice that turns away God's just wrath (Romans 3:25)",
                  "Faith: trusting reliance on God and his promise, not a work we perform",
                ],
              },
              {
                heading: "The turning point: Romans 3:21",
                paragraphs: [
                  "“But now” are two of the most hopeful words in the Bible. After showing that no one is righteous, Paul announces that God's righteousness has been revealed apart from the Law, through faith in Jesus Christ, for all who believe. God remains just, and he justifies the one who has faith in Jesus.",
                  "In chapter 4, Paul shows that this is not a new idea. Abraham was counted righteous by believing God's promise, before he was circumcised and long before the Law was given. He is the father of all who believe.",
                ],
              },
            ],
            questions: [
              "Romans 1:16 says the gospel is “the power of God.” Where do you need that power in your life right now?",
              "Why do you think Paul spends so long describing sin before describing grace?",
              "How would you explain “justified by faith” to a friend who has never heard the phrase?",
              "What does Abraham's story in Romans 4 teach about trusting God when circumstances look impossible?",
              "Which verse from these chapters will you memorize this week?",
            ],
            closing: "Father, thank you that while we were still sinners, Christ died for us. Help us to live by faith in your Son. Amen.",
          },
        },
      ],
    },
    {
      title: "The Problem and the Remedy (Romans 1–5)",
      description: "From universal guilt to peace with God.",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "All Have Sinned (Romans 1:18–3:20)",
          summary: "Why both the irreligious and the religious need the gospel.",
          notes: `<p>Paul addresses three groups in turn: the openly ungodly (1:18–32), the morally respectable (2:1–16) and the religiously privileged (2:17–3:8). His conclusion: “None is righteous, no, not one.”</p>`,
        },
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Justified by Faith (Romans 3:21–26)",
          summary: "The heart of the letter: how God is both just and the justifier.",
          notes: `<p>Read Romans 3:21–26 three times this week. Notice how often Paul mentions God's righteousness and how often he mentions faith.</p>`,
          comments: [
            {
              question: "Can you explain the difference between justification and sanctification? I keep mixing them up.",
              reply:
                "Happy to! Justification is God's once-for-all verdict: because of Christ, you are declared righteous. It's complete the moment you trust him (Romans 5:1). Sanctification is the lifelong process of becoming more like Christ by the Spirit (Romans 6 and 8). One way to remember it: justification is about your standing; sanctification is about your growing. We never grow in order to be justified; we grow because we already are.",
              followUp: "Standing vs. growing, that's going in my notes. Thank you!",
              askedByDemoLearner: true,
            },
            {
              question: "What does “propitiation” in verse 25 actually mean? My translation says “sacrifice of atonement.”",
              reply:
                "Both translations point to the same reality. Propitiation means a sacrifice that satisfies justice and turns away wrath. The astonishing thing in Romans 3 is that God himself provides the sacrifice. He doesn't wait for us to appease him; in love he gives his Son. That's why the cross shows both his justice and his mercy at the same time.",
            },
          ],
        },
        {
          type: "TEXT",
          title: "Abraham, Our Father in Faith (Romans 4)",
          summary: "Why Paul reaches back two thousand years to make his case.",
          content: `
<h2>Why Abraham?</h2>
<p>For Paul's Jewish readers, Abraham was the father of the nation and the model of faithfulness. If someone could show that Abraham himself was made right with God by works, Paul's argument would collapse. So Paul goes straight to Genesis.</p>
<blockquote>“For what does the Scripture say? ‘Abraham believed God, and it was counted to him as righteousness.’” (Romans 4:3, quoting Genesis 15:6)</blockquote>
<h3>Counted, not earned</h3>
<p>Paul draws a sharp contrast between wages and gifts. When a worker is paid, the money is owed. But righteousness was <em>counted</em> to Abraham as a gift. God credited to his account what he had not earned.</p>
<h3>Before the sign</h3>
<p>Abraham was declared righteous in Genesis 15. He received circumcision in Genesis 17, years later. The order matters: the sign confirmed a righteousness he already had by faith. That makes Abraham the father of uncircumcised Gentile believers as well as Jewish ones.</p>
<h3>Faith that hopes against hope</h3>
<p>Paul's description of Abraham's faith is one of the most beautiful in Scripture:</p>
<blockquote>“In hope he believed against hope… He did not weaken in faith when he considered his own body, which was as good as dead… but he grew strong in his faith as he gave glory to God, fully convinced that God was able to do what he had promised.” (Romans 4:18–21)</blockquote>
<p>Notice what Abraham did <em>not</em> do. He didn't pretend the facts were different. He considered his age honestly. But he looked past the facts to the God who “gives life to the dead and calls into existence the things that do not exist.”</p>
<h2>For us also</h2>
<p>Paul ends the chapter by bringing the story home: righteousness will be counted to us also, “who believe in him who raised from the dead Jesus our Lord.” The same God, the same promise, the same faith.</p>
<ul>
<li>Where are you tempted to earn what God freely gives?</li>
<li>What promise of God are you finding hard to believe right now?</li>
</ul>`,
        },
        {
          type: "QUIZ",
          title: "Romans 1–5 Checkpoint",
          summary: "Test your grasp of Paul's opening argument.",
          passingScore: 75,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "Which verse does Paul use to state the theme of Romans?",
              explanation: "Romans 1:16–17 announces the gospel as God's power for salvation and reveals the righteousness of God by faith.",
              options: [
                { text: "Romans 1:16–17", correct: true },
                { text: "Romans 8:28" },
                { text: "Romans 12:1–2" },
                { text: "Romans 16:27" },
              ],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "In Romans, what does it mean to be “justified”?",
              explanation: "Justification is God's legal declaration that a person is righteous on the basis of Christ's work, received by faith.",
              options: [
                { text: "To gradually become a better person" },
                { text: "To be declared righteous by God", correct: true },
                { text: "To keep the Law perfectly" },
                { text: "To be baptized into the church" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "Abraham was counted righteous before he was circumcised.",
              explanation: "Genesis 15 (righteousness counted) comes before Genesis 17 (circumcision), which is central to Paul's argument in Romans 4:9–12.",
              answer: true,
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "According to Romans 5:1–5, which of these are results of being justified by faith? (Select all that apply.)",
              explanation: "Paul lists peace with God, access into grace, and hope that does not put us to shame, even rejoicing in suffering.",
              options: [
                { text: "Peace with God", correct: true },
                { text: "Access into grace in which we stand", correct: true },
                { text: "A life free from all suffering" },
                { text: "Hope that does not put us to shame", correct: true },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "Paul argues that religious people are less in need of the gospel than the openly ungodly.",
              explanation: "Romans 2–3 shows that the religious and the irreligious alike are under sin and in need of grace (Romans 3:9, 3:23).",
              answer: false,
            },
          ],
        },
      ],
    },
    {
      title: "Life in the Spirit (Romans 6–8)",
      description: "Freedom from sin and the security of God's love.",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Dead to Sin, Alive to God (Romans 6)",
          summary: "What union with Christ means for the battle with sin.",
          notes: `<p>Romans 6:11: “So you also must consider yourselves dead to sin and alive to God in Christ Jesus.” Paul calls us to believe what is already true and to live from it.</p>`,
        },
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "No Condemnation (Romans 8:1–17)",
          summary: "The Spirit's work in us and our adoption as God's children.",
          notes: `<blockquote>“There is therefore now no condemnation for those who are in Christ Jesus.” (Romans 8:1)</blockquote><p>Notice the movement in this chapter from no condemnation (v. 1) to no separation (v. 39).</p>`,
        },
        {
          type: "AUDIO",
          title: "Reflection: Nothing Can Separate Us",
          summary: "A quiet meditation on Romans 8:31–39.",
          notes: `<p>Listen once straight through. Then read Romans 8:31–39 aloud and pause after each question Paul asks.</p>`,
        },
      ],
    },
    {
      title: "God's Faithfulness and Our Response (Romans 9–16)",
      description: "Mercy for Israel and the nations, and a life of worship.",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Israel and the Mercy of God (Romans 9–11)",
          summary: "Has God's word failed? Paul's answer ends in worship.",
          notes: `<p>These chapters are some of the most debated in Scripture. Keep your eyes on where Paul lands: “Oh, the depth of the riches and wisdom and knowledge of God!” (Romans 11:33).</p>`,
        },
        {
          type: "TEXT",
          title: "Living Sacrifices (Romans 12)",
          summary: "How eleven chapters of doctrine turn into everyday life.",
          content: `
<h2>“I appeal to you therefore…”</h2>
<p>After eleven chapters celebrating the mercy of God, Paul turns with one word: <em>therefore</em>. Everything he now asks of us flows from everything God has done for us.</p>
<blockquote>“I appeal to you therefore, brothers, by the mercies of God, to present your bodies as a living sacrifice, holy and acceptable to God, which is your spiritual worship. Do not be conformed to this world, but be transformed by the renewal of your mind.” (Romans 12:1–2)</blockquote>
<h3>Worship with a body</h3>
<p>Paul says “bodies,” not just hearts. Worship includes what we do with our hands, our schedules, our words and our money. A living sacrifice is one that keeps climbing back onto the altar, every day.</p>
<h3>Renewed minds</h3>
<p>Transformation happens from the inside out. As Scripture reshapes the way we think, we begin to discern God's will, what is “good and acceptable and perfect.” This is why reading Romans slowly matters: it is part of the renewing.</p>
<h3>Gifts for the body</h3>
<p>In verses 3–8 Paul reminds us that we belong to one another. No one has every gift, and every gift is needed: serving, teaching, encouraging, giving, leading, showing mercy.</p>
<h3>Love in action</h3>
<p>Verses 9–21 read like a portrait of Jesus himself:</p>
<ul>
<li>Let love be genuine. Abhor what is evil; hold fast to what is good.</li>
<li>Outdo one another in showing honor.</li>
<li>Rejoice in hope, be patient in tribulation, be constant in prayer.</li>
<li>Rejoice with those who rejoice, weep with those who weep.</li>
<li>Never avenge yourselves. Overcome evil with good.</li>
</ul>
<h2>Try this</h2>
<p>Read Romans 12:9–21 once a day for a week. Each day, choose one phrase and look for a concrete way to live it out before bedtime. You'll put this into practice in the next assignment.</p>`,
        },
        {
          type: "ASSIGNMENT",
          title: "Romans 12 in Real Life",
          summary: "Put one command from Romans 12:9–21 into practice and reflect on what happened.",
          instructions: `
<p>Choose <strong>one</strong> phrase from Romans 12:9–21 that challenges you. For one week, look for a concrete way to live it out each day.</p>
<p>Then write a reflection of 250–400 words:</p>
<ul>
<li>Which phrase did you choose, and why?</li>
<li>What did you actually do? Be specific.</li>
<li>What was hard? Where did you see God's grace at work?</li>
<li>How does Romans 1–11 (God's mercy to you) change your motivation for obedience?</li>
</ul>
<p>Dr. Chen reads every reflection and will respond with feedback.</p>`,
          allowText: true,
          allowFile: true,
          dueDaysAfterEnrollment: 56,
          sampleResponses: [
            "I chose “Rejoice with those who rejoice, weep with those who weep.” I realized I'm good at the weeping part, but rejoicing with others is hard when I'm jealous. This week a colleague got the promotion I applied for. Instead of avoiding her, I took her to lunch and asked her to tell me the whole story. It was humbling, but honestly it was freeing too. Remembering how much mercy God has shown me in Romans 5 made it easier to be generous.",
            "My phrase was “Never avenge yourselves.” There is an ongoing conflict with a neighbor over our fence line, and I had been rehearsing what I would say to him. Each day I prayed for him by name instead. On Thursday I brought over some tomatoes from the garden. We didn't solve everything, but the tone completely changed. Romans 12:21 hit me hard: overcome evil with good. God overcame my hostility with his kindness first.",
            "I picked “Be constant in prayer.” I set three alarms on my phone (morning, lunch and evening) and prayed for two minutes each time. Some days I forgot, and Tuesday was a disaster. But by the end of the week I noticed I was less anxious and more aware of God throughout the day. It made me realize prayer isn't a box to check; it's how a living sacrifice stays on the altar.",
            "“Outdo one another in showing honor.” I tried this at home with my teenagers, which is where I struggle most. I looked for one thing each day to honor them for out loud. My son actually asked if I was okay! It was a small thing, but it reminded me that my family should be the first place my faith shows up.",
          ],
        },
        {
          type: "QUIZ",
          title: "Final Review: The Letter to the Romans",
          summary: "Bring the whole letter together.",
          passingScore: 70,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "Which chapter begins with “There is therefore now no condemnation for those who are in Christ Jesus”?",
              explanation: "Romans 8:1 opens the great chapter on life in the Spirit.",
              options: [{ text: "Romans 3" }, { text: "Romans 6" }, { text: "Romans 8", correct: true }, { text: "Romans 12" }],
            },
            {
              type: "TRUE_FALSE",
              prompt: "In Romans 12:1, Paul grounds his call to obedience in “the mercies of God.”",
              explanation: "The “therefore” of Romans 12:1 points back to the mercy of God described in chapters 1–11.",
              answer: true,
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which of these does Paul list among the gifts in Romans 12:6–8? (Select all that apply.)",
              explanation: "Paul names prophecy, service, teaching, exhortation, giving, leading and mercy.",
              options: [
                { text: "Teaching", correct: true },
                { text: "Showing mercy", correct: true },
                { text: "Giving", correct: true },
                { text: "Architecture" },
              ],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "How does Paul respond at the end of his discussion of Israel in Romans 9–11?",
              explanation: "Romans 11:33–36 is a doxology: “Oh, the depth of the riches and wisdom and knowledge of God!”",
              options: [
                { text: "With a warning to the Jewish believers" },
                { text: "With a song of praise to God's wisdom", correct: true },
                { text: "With travel plans to Spain" },
                { text: "With instructions on food laws" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "Romans 16 is mostly a list of names and can be safely ignored.",
              explanation: "Romans 16 shows the gospel lived out in a real, diverse community, including many women and men who served alongside Paul.",
              answer: false,
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "In Romans 6, what does Paul say believers should “consider” themselves?",
              explanation: "Romans 6:11: “consider yourselves dead to sin and alive to God in Christ Jesus.”",
              options: [
                { text: "Free to keep sinning so grace may abound" },
                { text: "Dead to sin and alive to God in Christ Jesus", correct: true },
                { text: "Under the Law until they mature" },
                { text: "Unable to change" },
              ],
            },
          ],
        },
      ],
    },
  ],
  reviews: [
    "Dr. Chen makes Romans feel both deep and accessible. The map of the letter alone was worth it.",
    "Our small group did this together over ten weeks. Best study we've done.",
    "The lesson on Abraham changed how I think about faith. Hope against hope!",
    "Challenging in the best way. I had to slow down and actually read the text.",
    "Romans 8 reflection audio had me in tears. Thank you.",
    "Wish there were even more videos on chapters 9–11, but the teaching was excellent.",
  ],
};
