import type { CourseSeed } from "../types";

/** A draft in progress, so the course builder has something real to show. */
export const spiritualGiftsDraft: CourseSeed = {
  slug: "discovering-your-spiritual-gifts",
  title: "Discovering Your Spiritual Gifts",
  subtitle: "Find out how God has equipped you to serve, and where you fit in the body of Christ.",
  description: `
<p>Every believer has been given gifts by the Holy Spirit for the good of the church. This course will help you understand what the Bible teaches about spiritual gifts, discern how God has equipped you, and find a place to serve at Grace Harbor.</p>
<p><em>Draft: still to add the gifts inventory and the serving-team overview video.</em></p>`,
  category: "ministry-training",
  level: "BEGINNER",
  tags: ["Spiritual Gifts", "Serving", "Holy Spirit"],
  objectives: [
    "Understand the purpose of spiritual gifts from 1 Corinthians 12",
    "Discern your own gifts through Scripture, community and experience",
  ],
  requirements: [],
  audience: ["Members looking for a place to serve"],
  owner: "grace",
  status: "DRAFT",
  popularity: 0,
  completionRate: 0,
  thumbnail: "dove",
  sections: [
    {
      title: "What Are Spiritual Gifts?",
      lessons: [
        {
          type: "TEXT",
          title: "Gifts Given for the Common Good",
          summary: "1 Corinthians 12 and the purpose of every gift.",
          content: `
<h2>One Spirit, many gifts</h2>
<p>The church in Corinth was richly gifted and deeply divided. Some believers prized the more spectacular gifts and looked down on others. Paul's response is a beautiful picture of the church as a body.</p>
<blockquote>“To each is given the manifestation of the Spirit for the common good.” (1 Corinthians 12:7)</blockquote>
<h3>Every believer is gifted</h3>
<p>Notice the words “to each.” There are no ungifted Christians. If you belong to Jesus, the Spirit has equipped you to build up his church.</p>
<h3>Gifts are for others</h3>
<p>Spiritual gifts are not trophies or personality badges. They are tools given “for the common good.” The question is not “What is my gift?” as much as “How can I serve?”</p>
<h3>Every part matters</h3>
<p>“The eye cannot say to the hand, ‘I have no need of you’” (1 Corinthians 12:21). The unseen gifts, such as helping, administration and mercy, are as essential as the visible ones.</p>`,
        },
        {
          type: "VIDEO",
          media: "teaching-2",
          title: "One Body, Many Parts",
          summary: "Grace Thompson on finding your place in the body of Christ.",
        },
      ],
    },
    {
      title: "Discerning Your Gifts",
      lessons: [
        {
          type: "TEXT",
          title: "Five Ways to Discern Your Gifts",
          summary: "Scripture, prayer, experimentation, feedback and fruit.",
          content: `
<h2>Discovering by doing</h2>
<p>Most people discover their gifts not by taking a test but by serving. Here are five ways to discern how God has equipped you:</p>
<ol>
<li><strong>Study the lists</strong> in Romans 12, 1 Corinthians 12, Ephesians 4 and 1 Peter 4.</li>
<li><strong>Pray</strong> and ask God to show you where he wants you to serve.</li>
<li><strong>Experiment</strong> by trying different serving teams for a season.</li>
<li><strong>Ask others</strong> where they have seen God use you.</li>
<li><strong>Look for fruit</strong>: where does your service build others up?</li>
</ol>`,
        },
      ],
    },
    {
      title: "Using Your Gifts at Grace Harbor",
      description: "Serving team overview and next steps (coming soon).",
      lessons: [],
    },
  ],
  reviews: [],
};
