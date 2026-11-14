const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { connectDB, isMongooseConnected } = require('../config/db');
const { User, Post, Comment, userRepo, postRepo, commentRepo } = require('../models');
const memoryStore = require('../models/memoryStore');

const seedUsers = [
  {
    name: 'Alex Rivera',
    email: 'alex@example.com',
    password: 'password123',
    bio: 'Full-stack software architect & tech essayist. Writing about JavaScript, distributed systems, and clean code.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    role: 'admin',
  },
  {
    name: 'Sophia Chen',
    email: 'sophia@example.com',
    password: 'password123',
    bio: 'Senior Design Systems Lead & Creative Developer. Passionate about typography, accessibility, and micro-interactions.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    role: 'user',
  },
  {
    name: 'Marcus Thorne',
    email: 'marcus@example.com',
    password: 'password123',
    bio: 'Cloud & DevOps engineer exploring scalable microservices, Kubernetes, and developer productivity tools.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    role: 'user',
  },
];

const seedPostsData = [
  {
    title: 'Modern Web Architecture in 2026: The Rise of Autonomous Systems',
    category: 'Technology',
    tags: ['webdev', 'architecture', 'javascript', 'backend'],
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Explore how full-stack engineering has evolved with decoupled APIs, edge computing, resilient microservices, and modern state machines.',
    content: `Web development continues to undergo massive transformations. In this deep dive, we explore how modern web architectures achieve high availability, blazing fast response times, and bulletproof security.

### 1. Decoupled and Modular Architectures
Modern applications separate presentation concerns from data logic. Using RESTful standards or hyper-efficient GraphQL/gRPC layers allows teams to iterate on interfaces independently of backend pipelines.

### 2. Micro-interactions and Edge Performance
By moving edge caches closer to users and utilizing lightweight micro-frameworks like Express, web platforms can deliver sub-100ms latency globally.

### 3. Authentication & Security Best Practices
- **JSON Web Tokens (JWT)** provide stateless authorization with verifiable digital signatures.
- **Bcrypt hashing with salted rounds** safeguards user passwords against rainbow tables and brute force attacks.
- Strict input validation prevents XSS and injection vulnerabilities before payloads reach persistence layers.

The goal is always clear: build tools that are resilient, maintainable, and an absolute joy for people to use every single day.`,
  },
  {
    title: 'Designing Human-Centric Interfaces: From Wireframes to Delight',
    category: 'Design',
    tags: ['ui', 'ux', 'designsystems', 'css'],
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Great software starts with empathy. Learn how typographic hierarchy, rhythm, whitespace, and color tokens create unforgettable web experiences.',
    content: `Design is not just what it looks like and feels like — design is how it works. When crafting modern web experiences, every pixel, spacing unit, and font size plays an intentional role.

### The Power of Visual Hierarchy
Users don't read web pages from start to finish; they scan. Effective visual hierarchy guides the eye effortlessly from prominent headings to contextual cards and actionable calls to action.

### Micro-interactions That Spark Joy
- Smooth transition states during button presses and card hover effects.
- Non-intrusive floating toasts confirming important actions like publishing or deleting.
- Thoughtfully formatted reading times so users know the investment needed before reading.

When UI details align harmoniously, software feels lightweight, trustworthy, and human.`,
  },
  {
    title: 'Mastering Node.js and Express RESTful API Patterns',
    category: 'Programming',
    tags: ['nodejs', 'express', 'api', 'backend'],
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'A comprehensive playbook on structuring Express APIs, controller layers, centralized error handling, and robust database models.',
    content: `Node.js and Express remain the foundational bedrock of modern backend development. Here is the blueprint for creating production-ready APIs that scale cleanly.

### Clean Layered Architecture
1. **Config Layer**: Manages database connections, timeouts, and fallback resilience.
2. **Models & Schema**: Defines data structure, types, timestamps, and relational references.
3. **Controllers**: Encapsulates business logic, input sanitization, and response formatting.
4. **Middlewares**: Handles cross-cutting concerns such as JWT verification, logging, and error bubbling.

### Centralized Error Handling
Avoid scattered try/catch blocks that return inconsistent status codes. By funneling errors through an Express error handler middleware, you ensure consistent JSON responses and prevent server crashes from unhandled rejections.`,
  },
  {
    title: 'The Future of AI-Assisted Software Engineering',
    category: 'AI & ML',
    tags: ['ai', 'future', 'productivity', 'software'],
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'How intelligent agents and automated development assistants are revolutionizing developer velocity, code reviews, and software testing.',
    content: `We are witnessing a monumental paradigm shift in software development. Intelligent agent workflows are evolving from simple auto-completion into proactive partners that scaffold architectures, verify edge cases, and run automated validation tests.

### Expanding Cognitive Bandwidth
Engineers spend less time on repetitive boilerplate and more time focusing on system design, domain modeling, and user empathy.

### Continuous Quality Assurance
Automated verification pipelines ensure that every newly written endpoint conforms to REST conventions, handles edge cases, and verifies authorization barriers securely.`,
  },
];

const seedCommentsData = [
  'Outstanding article! The breakdown of JWT token flows and security safeguards was crystal clear.',
  'Really enjoyed this perspective. The visual hierarchy tips resonate deeply with what we build every day.',
  'Super clean explanation! Having structured error handling in Express has saved our team countless debugging hours.',
  'Incredible insights! Looking forward to seeing more posts on scalable backend architectures.',
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    await connectDB();

    const mongooseActive = isMongooseConnected();
    console.log(`📡 Storage engine: ${mongooseActive ? 'MongoDB (Mongoose)' : 'Local Persistent Store'}`);

    // If using Mongoose, clear existing collections
    if (mongooseActive) {
      await User.deleteMany({});
      await Post.deleteMany({});
      await Comment.deleteMany({});
    } else {
      memoryStore.clear();
    }

    // 1. Create Users
    const createdUsers = [];
    for (const u of seedUsers) {
      const user = await userRepo.create(u);
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} seed users`);

    // 2. Create Posts
    const createdPosts = [];
    for (let i = 0; i < seedPostsData.length; i++) {
      const postData = seedPostsData[i];
      const author = createdUsers[i % createdUsers.length];
      const post = await postRepo.create({
        ...postData,
        author: author._id,
      });
      createdPosts.push(post);
    }
    console.log(`✅ Created ${createdPosts.length} seed posts`);

    // 3. Create Comments
    let commentCount = 0;
    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];
      // Add 2 comments per post
      for (let j = 0; j < 2; j++) {
        const commentAuthor = createdUsers[(i + j + 1) % createdUsers.length];
        const commentText = seedCommentsData[(i * 2 + j) % seedCommentsData.length];
        await commentRepo.create({
          post: post._id,
          author: commentAuthor._id,
          content: commentText,
        });
        commentCount++;
      }
    }
    console.log(`✅ Created ${commentCount} seed comments`);
    console.log('🎉 Database seeding completed successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Seeding error:', error);
    return false;
  }
};

// If run directly via CLI
if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = {
  seedDatabase,
};
