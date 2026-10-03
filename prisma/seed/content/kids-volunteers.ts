import type { CourseSeed } from "../types";

export const kidsVolunteerTraining: CourseSeed = {
  slug: "kids-ministry-volunteer-training",
  title: "Kids Ministry Volunteer Training",
  subtitle: "Everything you need to serve children safely, joyfully and faithfully.",
  description: `
<p>Thank you for saying yes to serving our kids! Every Sunday, Grace Harbor Kids welcomes children from nursery through fifth grade, and every one of them deserves a safe, loving place to meet Jesus. This training equips you to provide exactly that.</p>
<p><strong>This course is required for all kids ministry volunteers</strong> and must be completed, along with a background check, before serving in a classroom. It takes about an hour in total and can be completed over several sittings.</p>
<h3>You'll learn</h3>
<ul>
<li>Why children matter so much to Jesus and to our church</li>
<li>Our child safeguarding policy, including check-in, the two-adult rule, appropriate touch and how to report concerns</li>
<li>How to lead a small group of kids through a Bible story</li>
<li>Positive, grace-filled classroom management</li>
</ul>
<p>The safeguarding quiz requires a score of 80% or higher. You can retake it as many times as you need. Questions? Contact Grace Thompson, our Kids &amp; Volunteer Ministry Director.</p>
<blockquote>“Let the little children come to me and do not hinder them, for to such belongs the kingdom of heaven.” (Matthew 19:14)</blockquote>`,
  category: "ministry-training",
  level: "BEGINNER",
  tags: ["Kids Ministry", "Safeguarding", "Volunteers", "Teaching"],
  objectives: [
    "Explain why children's ministry matters in the life of the church",
    "Follow our check-in, check-out and two-adult procedures every time",
    "Recognize signs of abuse or neglect and know exactly how to report a concern",
    "Lead a simple, engaging Bible lesson for a small group of children",
    "Respond to challenging behavior with patience and grace",
  ],
  requirements: [
    "Completed volunteer application and background check (or in progress)",
    "At least 18 years old to lead a classroom (students 14+ may assist)",
  ],
  audience: ["New and returning kids ministry volunteers", "Parents interested in serving", "Student helpers (ages 14+)"],
  owner: "grace",
  status: "PUBLISHED",
  publishedDaysAgo: 96,
  popularity: 0.5,
  completionRate: 0.7,
  thumbnail: "seedlings",
  sections: [
    {
      title: "Why Kids Ministry Matters",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Let the Little Children Come",
          summary: "Jesus' heart for children and our vision for Grace Harbor Kids.",
        },
        {
          type: "TEXT",
          title: "Teaching the Bible to Children",
          summary: "Keeping Jesus at the center of every story.",
          content: `
<h2>Every story whispers his name</h2>
<p>Children are not too young to meet Jesus, and they are not too young to understand that the Bible is one big story about him. Our goal each Sunday is not simply to teach good behavior but to point children to a good Savior.</p>
<blockquote>“And beginning with Moses and all the Prophets, he interpreted to them in all the Scriptures the things concerning himself.” (Luke 24:27)</blockquote>
<h3>Avoiding the “be like” trap</h3>
<p>It's easy to turn every Bible story into a moral lesson: be brave like David, be kind like the Good Samaritan. Those lessons aren't wrong, but if that's all we teach, children learn that the Bible is about them trying harder. Instead, ask: <em>What does this story show us about God? How does it point to Jesus?</em></p>
<h3>Four keys for teaching kids</h3>
<ol>
<li><strong>Prepare your heart.</strong> Read the passage yourself during the week and pray for each child by name.</li>
<li><strong>Tell, don't read.</strong> Know the story well enough to tell it with eye contact and expression.</li>
<li><strong>Use their senses.</strong> Props, movement and simple visuals help children remember.</li>
<li><strong>Ask good questions.</strong> “What surprised you?” and “Why do you think Jesus did that?” invite real thinking.</li>
</ol>
<h3>Age matters</h3>
<ul>
<li><strong>Preschool:</strong> short, simple and repetitive. One big truth, said many times: “God made everything.”</li>
<li><strong>Early elementary:</strong> concrete stories and hands-on activities. Begin connecting stories to Jesus.</li>
<li><strong>Upper elementary:</strong> ready for bigger questions, Bible skills and honest discussion about faith.</li>
</ul>
<p>Above all, remember that children learn as much from <em>how</em> you treat them as from <em>what</em> you say. A warm welcome by name may be the sermon they remember most.</p>`,
        },
      ],
    },
    {
      title: "Keeping Children Safe",
      description: "Required safeguarding training for every volunteer.",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-3",
          title: "Our Child Safeguarding Policy",
          summary: "Why safeguarding is an act of love, and the policy every volunteer follows.",
          comments: [
            {
              question: "If a child tells me something concerning but asks me not to tell anyone, what should I say?",
              reply:
                "Thank you for asking. This is so important. Never promise to keep a secret. Gently say something like, “Thank you for telling me. You did the right thing. I can't keep this a secret, because my job is to help keep you safe, so I'm going to tell someone who can help.” Stay calm, don't ask leading questions, write down what the child said in their own words as soon as possible, and contact me or the on-duty safeguarding lead right away. If a child is in immediate danger, call 911 first.",
              followUp: "That's really helpful. I'm writing that phrasing down.",
            },
          ],
        },
        {
          type: "TEXT",
          title: "Check-In, Check-Out, and the Two-Adult Rule",
          summary: "The everyday procedures that protect children and volunteers.",
          content: `
<h2>Procedures are a form of love</h2>
<p>Our safety procedures aren't red tape. They protect children, reassure parents and protect volunteers from false accusations. Please follow them every time, even when it feels unnecessary. Consistency is what makes them work.</p>
<h3>Check-in</h3>
<ul>
<li>Every child is checked in at a kiosk or welcome desk and receives a printed name tag.</li>
<li>The parent or guardian receives a matching security tag with the same code.</li>
<li>Note any allergies or medical alerts printed on the tag before the child enters the room.</li>
</ul>
<h3>Check-out</h3>
<ul>
<li>Children are released <strong>only</strong> to an adult presenting the matching security tag.</li>
<li>If the tag is lost, do not release the child. Call the Kids Ministry Director or check-in lead to verify identity.</li>
<li>Elementary children never leave the room alone, including for the restroom, unless a hall monitor escorts them.</li>
</ul>
<h3>The two-adult rule</h3>
<p>At least two screened adults, who are not married to each other or related, must be present in every classroom at all times. No volunteer should ever be alone with a child out of sight of others.</p>
<ul>
<li>Doors stay open or have a window that is never covered.</li>
<li>If one adult needs to step out, the class joins another room until they return.</li>
<li>Student helpers (14+) do not count toward the two adults.</li>
</ul>
<h3>Appropriate interaction</h3>
<ul>
<li>Side hugs, high fives and a hand on the shoulder are appropriate. Avoid lap-sitting for children over three.</li>
<li>Diapering and restroom help follow the posted procedure, in view of another adult.</li>
<li>No private messaging, social media connection or gifts to individual children outside of ministry settings.</li>
</ul>
<blockquote>“Whoever receives one such child in my name receives me.” (Matthew 18:5)</blockquote>
<p>If you ever see a procedure not being followed, kindly speak up or tell a ministry leader. Everyone is responsible for keeping kids safe.</p>`,
        },
        {
          type: "PDF",
          title: "Safeguarding Quick Reference",
          summary: "A one-page summary to keep in your volunteer lanyard.",
          guide: {
            file: "safeguarding-quick-reference",
            title: "Child Safeguarding Quick Reference",
            subtitle: "Grace Harbor Kids · Volunteer Reference",
            scripture: { text: "Defend the weak and the fatherless; uphold the cause of the poor and the oppressed.", reference: "Psalm 82:3" },
            sections: [
              {
                heading: "Every Sunday",
                paragraphs: ["Keep these essentials in mind every time you serve."],
                bullets: [
                  "Wear your volunteer badge where it can be seen",
                  "Two screened, unrelated adults in every room, every time",
                  "Doors open or windows uncovered",
                  "Release children only to the matching security tag",
                  "Check name tags for allergy and medical alerts",
                ],
              },
              {
                heading: "If a child discloses abuse",
                paragraphs: [
                  "Stay calm and listen. Thank the child for telling you, and reassure them they did the right thing. Do not promise confidentiality and do not ask leading questions. Write down what was said in the child's own words, with the date and time, as soon as possible.",
                  "Report immediately to the Kids Ministry Director or on-duty safeguarding lead. Do not investigate yourself and do not contact the alleged abuser. If a child is in immediate danger, call 911.",
                ],
              },
              {
                heading: "Signs that may indicate concern",
                paragraphs: ["No single sign proves abuse, but patterns matter. Report concerns; you do not need to be certain."],
                bullets: [
                  "Unexplained injuries, or explanations that do not fit",
                  "Sudden changes in behavior, mood or school performance",
                  "Fear of a particular person or of going home",
                  "Age-inappropriate sexual knowledge or behavior",
                  "Persistent hunger, poor hygiene or inadequate clothing",
                ],
              },
              {
                heading: "Contacts",
                paragraphs: [
                  "Kids & Volunteer Ministry Director: Grace Thompson. Church office: Ruth Martinez. In an emergency, call 911 first, then notify ministry leadership. State law requires reports of suspected child abuse to be made to the appropriate authorities; church leaders will help you do so.",
                ],
              },
            ],
            questions: [
              "Where is the nearest first aid kit and emergency exit to your classroom?",
              "Who is the safeguarding lead on duty this Sunday?",
            ],
          },
        },
        {
          type: "QUIZ",
          title: "Safeguarding Certification Quiz",
          summary: "Required for all volunteers. Passing score: 80%.",
          passingScore: 80,
          questions: [
            {
              type: "SINGLE_CHOICE",
              prompt: "A parent arrives for pickup but has lost their security tag. What should you do?",
              explanation: "Never release a child without the matching tag. Contact the director or check-in lead to verify identity.",
              options: [
                { text: "Release the child if they seem to recognize the parent" },
                { text: "Keep the child in the room and contact the Kids Ministry Director or check-in lead", correct: true },
                { text: "Ask the parent to describe the child's clothing" },
                { text: "Let the child walk to the parent in the hallway" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "A married couple serving together satisfies the two-adult rule.",
              explanation: "The two adults must be screened and not married to each other or related.",
              answer: false,
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "A child tells you something concerning and asks you to keep it a secret. What is the right response?",
              explanation: "Never promise secrecy. Reassure the child, explain you need to tell someone who can help, and report immediately.",
              options: [
                { text: "Promise to keep it secret so they keep trusting you" },
                { text: "Ask detailed questions to find out exactly what happened" },
                { text: "Thank them, explain you can't keep it secret, and report it right away", correct: true },
                { text: "Wait to see if they mention it again next week" },
              ],
            },
            {
              type: "MULTIPLE_CHOICE",
              prompt: "Which of the following are appropriate ways to show care to a child? (Select all that apply.)",
              explanation: "High fives, side hugs and greeting children by name are appropriate. Private messaging with a child is not.",
              options: [
                { text: "A high five", correct: true },
                { text: "A side hug", correct: true },
                { text: "Greeting them warmly by name", correct: true },
                { text: "Sending them a private social media message" },
              ],
            },
            {
              type: "TRUE_FALSE",
              prompt: "You must be certain abuse has happened before you report a concern.",
              explanation: "You only need a reasonable concern. Leaders and authorities handle investigation.",
              answer: false,
            },
            {
              type: "SINGLE_CHOICE",
              prompt: "If one of the two adults in your classroom needs to step out, what should happen?",
              explanation: "No adult should be alone with children. The class joins another room until the second adult returns.",
              options: [
                { text: "The remaining adult continues alone for a few minutes" },
                { text: "A student helper counts as the second adult" },
                { text: "The class joins another room until they return", correct: true },
                { text: "Close the door to keep children from wandering" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "In the Classroom",
      lessons: [
        {
          type: "VIDEO",
          media: "teaching-1",
          title: "Leading a Small Group of Kids",
          summary: "Simple ways to help children talk, pray and remember.",
        },
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "Classroom Management with Grace",
          summary: "Clear expectations, warm relationships and calm redirection.",
        },
        {
          type: "ASSIGNMENT",
          title: "Plan a Ten-Minute Bible Lesson",
          summary: "Plan a short lesson for the age group you'll serve.",
          instructions: `
<p>Choose a Bible story and an age group (preschool, early elementary or upper elementary). In 200–400 words, outline a ten-minute lesson including:</p>
<ul>
<li>The <strong>big truth</strong> in one sentence, and how the story points to Jesus</li>
<li>How you'll <strong>tell</strong> the story (props, movement, visuals)</li>
<li>Two or three <strong>questions</strong> you'll ask</li>
<li>A short <strong>prayer</strong> or response activity</li>
</ul>
<p>You may upload a lesson plan document instead of typing.</p>`,
          allowText: true,
          allowFile: true,
          sampleResponses: [
            "Story: Jesus calms the storm (Mark 4:35–41). Age: early elementary. Big truth: Jesus is more powerful than anything that scares us. I'll have the kids sit in a “boat” made from a blue sheet and make wind and wave sounds together, then go completely silent when Jesus says “Peace, be still!” Questions: What do you think the disciples felt? What did Jesus show them about who he is? What is something that makes you afraid? Prayer: each child finishes the sentence “Jesus, when I'm scared, help me remember...”",
            "Story: The lost sheep (Luke 15:3–7). Age: preschool. Big truth: Jesus loves me and comes to find me. I'll hide a stuffed sheep in the room before class and we'll search for it together. Then I'll tell the story with a felt board. Questions: How did the shepherd feel when he found the sheep? Who is our Good Shepherd? Response: we'll sing “Jesus Loves Me” and each child gets a cotton-ball sheep to take home.",
            "Story: Zacchaeus (Luke 19:1–10). Age: upper elementary. Big truth: Jesus came to seek and save the lost, even people others reject. I'll use a step stool as the tree and have a volunteer play Zacchaeus. Questions: Why were people upset that Jesus went to his house? How did meeting Jesus change Zacchaeus? Who might feel left out at your school? Prayer: ask Jesus to help us welcome others the way he welcomed Zacchaeus.",
          ],
        },
      ],
    },
  ],
  reviews: [
    "Clear and thorough. I feel much more confident about the safeguarding procedures.",
    "Grace makes the policies feel like care, not rules. Great training.",
    "The lesson on teaching the Bible to kids was so helpful. No more “be like David” lessons for me!",
    "Required training that I actually enjoyed. That's saying something.",
    "Good overview. The quiz was tougher than I expected, which is a good thing.",
  ],
};
