import type { CourseSeed } from "../types";

export const membershipClass: CourseSeed = {
  slug: "welcome-to-grace-harbor",
  title: "Welcome to Grace Harbor: Membership Class",
  subtitle: "Our story, what we believe, and how to find your place in the family.",
  description: `
<p>We're so glad you're here. Whether you've been attending for a few weeks or a few years, the <strong>Membership Class</strong> is the best way to get to know Grace Harbor Church and take your next step into the life of our church family.</p>
<p>In a few short sessions you'll hear the story of how Grace Harbor began, what we believe and why, how our church is led, and what it means to commit to one another as members. You'll also discover practical ways to connect through small groups and serving teams.</p>
<h3>After the class</h3>
<p>When you complete the course, submit your Next Steps Card and one of our pastors will reach out to schedule a short membership conversation. New members are welcomed publicly on the first Sunday of each month.</p>
<p>Have questions along the way? Ask them in the lesson discussions or email Ruth Martinez in the church office.</p>
<blockquote>“So then you are no longer strangers and aliens, but you are fellow citizens with the saints and members of the household of God.” (Ephesians 2:19)</blockquote>`,
  category: "membership",
  level: "BEGINNER",
  tags: ["Membership", "Church Life", "Next Steps"],
  objectives: [
    "Know the story and mission of Grace Harbor Church",
    "Understand our core beliefs and statement of faith",
    "Understand how the church is led and cared for",
    "Know what we commit to one another as members",
    "Identify a small group and serving team to join",
  ],
  requirements: ["Regular attendance at Grace Harbor for at least a month is recommended"],
  audience: ["Regular attenders considering membership", "New believers ready to commit to a church family", "Anyone curious about Grace Harbor"],
  owner: "daniel",
  coInstructors: ["grace"],
  status: "PUBLISHED",
  certificateEnabled: false,
  publishedDaysAgo: 140,
  popularity: 1.1,
  completionRate: 0.65,
  thumbnail: "harbor",
  sections: [
    {
      title: "Our Story and Beliefs",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Welcome to the Family",
          summary: "Pastor Daniel shares why church membership matters.",
        },
        {
          type: "TEXT",
          title: "What We Believe: Our Statement of Faith in Brief",
          summary: "The essential convictions that unite us.",
          content: `
<h2>United around the gospel</h2>
<p>Grace Harbor Church joyfully affirms the historic Christian faith as summarized in the Apostles' and Nicene Creeds. Here is a brief summary of our statement of faith. The full version is available from the church office.</p>
<h3>God</h3>
<p>We believe in one God, eternally existing in three persons: Father, Son and Holy Spirit, each fully God, equal in power and glory.</p>
<h3>The Bible</h3>
<p>We believe the Bible is the inspired Word of God, true and trustworthy, and our final authority for faith and life.</p>
<blockquote>“All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness.” (2 Timothy 3:16)</blockquote>
<h3>Humanity and sin</h3>
<p>We believe all people are created in God's image with dignity and worth, and that all have sinned and are separated from God, unable to save themselves.</p>
<h3>Jesus Christ</h3>
<p>We believe Jesus Christ is fully God and fully man, born of the virgin Mary. He lived a sinless life, died on the cross as a substitute for sinners, rose bodily from the dead and ascended to the Father. He will return in glory.</p>
<h3>Salvation</h3>
<p>We believe salvation is by grace alone, through faith alone, in Christ alone. Everyone who repents and believes is forgiven, adopted into God's family and given eternal life.</p>
<h3>The Holy Spirit</h3>
<p>We believe the Holy Spirit lives in every believer, giving new life, producing fruit and equipping the church with gifts for service.</p>
<h3>The church</h3>
<p>We believe the church is the body of Christ, made up of all believers, gathered in local congregations to worship, grow, serve and make disciples. We practice baptism of believers and celebrate the Lord's Supper together.</p>
<h2>In essentials, unity</h2>
<p>On secondary matters, faithful Christians sometimes disagree. We aim to hold firm on the essentials and extend charity and humility on everything else.</p>`,
        },
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "The Story of Grace Harbor",
          summary: "From a living room Bible study in 1998 to the church we are today.",
        },
      ],
    },
    {
      title: "Life Together",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Worship, Groups, and Serving",
          summary: "The three rhythms of life at Grace Harbor.",
        },
        {
          type: "TEXT",
          title: "The Membership Covenant",
          summary: "What we promise to one another as members.",
          content: `
<h2>Why we make promises</h2>
<p>Membership isn't about getting a card or a vote. It is about belonging, about saying publicly, “These are my people, and I am committed to them.” In the New Testament, believers were known by name, cared for and accountable to one another. Membership is how we live that out today.</p>
<blockquote>“And let us consider how to stir up one another to love and good works, not neglecting to meet together… but encouraging one another.” (Hebrews 10:24–25)</blockquote>
<h3>As a member, I commit to:</h3>
<ol>
<li><strong>Worship</strong> regularly with the church family, gathering on the Lord's Day.</li>
<li><strong>Grow</strong> in my relationship with Jesus through Scripture, prayer and community, ideally in a small group.</li>
<li><strong>Serve</strong> using the gifts God has given me to build up the church and bless our city.</li>
<li><strong>Give</strong> generously, regularly and joyfully to support the ministry of the church.</li>
<li><strong>Protect the unity</strong> of the church by speaking truthfully and lovingly, and following Matthew 18 in conflict.</li>
<li><strong>Submit</strong> to the care and leadership of the elders as they follow Christ.</li>
</ol>
<h3>As your church, we commit to:</h3>
<ul>
<li>Teach the Bible faithfully and point you to Jesus.</li>
<li>Pray for you and care for you in every season.</li>
<li>Equip you to use your gifts and grow as a disciple.</li>
<li>Lead with integrity, transparency and humility.</li>
</ul>
<p>These promises are not a burden but a gift. Covenant love, like marriage, grows strongest in the places where we choose to stay.</p>`,
        },
        {
          type: "QUIZ",
          title: "Membership Class Review",
          summary: "A short review before your next steps.",
          passingScore: 70,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "According to our statement of faith, what is our final authority for faith and life?",
              explanation: "We believe the Bible is the inspired Word of God and our final authority.",
              options: [
                { text: "Church tradition" },
                { text: "The Bible", correct: true },
                { text: "Personal experience" },
                { text: "The pastors" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "We believe salvation is by grace alone, through faith alone, in Christ alone.",
              explanation: "This summarizes the gospel as taught in passages such as Ephesians 2:8–9.",
              answer: true,
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which of these are part of the membership covenant? (Select all that apply.)",
              explanation: "Members commit to worship, grow, serve, give, protect unity and receive the care of the elders.",
              options: [
                { text: "Worship regularly with the church family", correct: true },
                { text: "Serve using my gifts", correct: true },
                { text: "Attend every church event" },
                { text: "Protect the unity of the church", correct: true },
              ],
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "What are the three rhythms of life at Grace Harbor?",
              explanation: "We gather for worship, grow in groups and scatter to serve.",
              options: [
                { text: "Worship, groups and serving", correct: true },
                { text: "Sunday, Wednesday and Friday" },
                { text: "Reading, praying and fasting" },
                { text: "Giving, attending and volunteering" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Next Steps",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Finding Your Place to Serve",
          summary: "A tour of our ministry teams and how to get started.",
        },
        {
          type: "ASSIGNMENT",
          title: "Next Steps Card",
          summary: "Tell us about yourself and the next steps you'd like to take.",
          instructions: `
<p>Please share a few sentences on each of the following so a pastor can follow up with you:</p>
<ol>
<li>How you came to faith in Jesus (a short summary is fine)</li>
<li>Whether you have been baptized as a believer</li>
<li>Which small group or serving team you're interested in</li>
<li>Any questions you have about membership</li>
</ol>`,
          allowText: true,
          allowFile: false,
          sampleResponses: [
            "I came to faith at a summer camp when I was sixteen and was baptized at my previous church in Ohio. We moved here in the spring for my husband's job. I'm interested in the women's Tuesday morning group and possibly the welcome team. My question: can our teenage daughter become a member too?",
            "I trusted Christ about two years ago after a long season of searching. I have not been baptized yet and would like to talk about that. I'd love to join a young adults group and help with the coffee team on Sundays.",
            "I grew up in church and recommitted my life to Christ in college. Baptized as a teenager. I'm interested in serving with kids ministry (I'm a teacher) and joining a small group near the east side. No questions for now. Thank you for a great class!",
          ],
        },
      ],
    },
  ],
  reviews: [
    "Very welcoming and clear. I finally understand how the church is organized.",
    "Loved hearing the story of how Grace Harbor started in a living room.",
    "Short, helpful and a great first step. Ruth from the church office followed up within a week!",
    "The statement of faith summary was really helpful for my husband, who is new to church.",
  ],
};
