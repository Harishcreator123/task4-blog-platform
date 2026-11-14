const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { app, startServer } = require('../backend/server');
const { connectDB } = require('../backend/config/db');

let server;
let baseUrl;

// Test state
let testUser1 = {
  name: 'Test Author One',
  email: `author1_${Date.now()}@example.com`,
  password: 'Password123!',
};

let testUser2 = {
  name: 'Test Author Two',
  email: `author2_${Date.now()}@example.com`,
  password: 'Password123!',
};

let token1 = '';
let token2 = '';
let createdPostId = '';
let createdCommentId = '';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

async function request(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { status: res.status, ok: res.ok, body };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Full-Stack Blog Platform API Test Suite');
  console.log('======================================================\n');

  try {
    // 1. Connect DB and start test server
    await connectDB();
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Server started on ephemeral port ${port} for testing.\n`);

    // ----------------------------------------------------
    // TEST SUITE 1: System Health
    // ----------------------------------------------------
    console.log('📌 Test Suite 1: Health & System Diagnostics');
    {
      const res = await request('/api/health');
      assert(res.status === 200, 'GET /api/health returns 200 OK');
      assert(res.body.status === 'healthy', 'Health check reports status: "healthy"');
      assert(res.body.database !== undefined, 'Database adapter status is reported');
    }

    // ----------------------------------------------------
    // TEST SUITE 2: User Registration & Validation
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 2: User Registration & Validation');
    {
      // Valid Registration User 1
      const res1 = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(testUser1),
      });
      assert(res1.status === 201, 'POST /api/auth/register creates user with 201 Created');
      assert(res1.body.token !== undefined, 'Registration returns JWT token');
      assert(res1.body.user.email === testUser1.email.toLowerCase(), 'Registration returns correct email');
      assert(res1.body.user.password === undefined, 'Password is NOT exposed in response payload');
      token1 = res1.body.token;

      // Valid Registration User 2
      const res2 = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(testUser2),
      });
      assert(res2.status === 201, 'POST /api/auth/register creates second test user');
      token2 = res2.body.token;

      // Duplicate Registration
      const dupRes = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(testUser1),
      });
      assert(dupRes.status === 400, 'Duplicate registration returns 400 Bad Request');

      // Invalid Email
      const badEmailRes = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Bob', email: 'invalid-email', password: 'password123' }),
      });
      assert(badEmailRes.status === 400, 'Invalid email format rejected with 400');

      // Short Password
      const shortPassRes = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Bob', email: 'bob@example.com', password: '123' }),
      });
      assert(shortPassRes.status === 400, 'Password under 6 characters rejected with 400');
    }

    // ----------------------------------------------------
    // TEST SUITE 3: User Authentication & Login
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 3: User Authentication & Login');
    {
      // Valid Login
      const loginRes = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: testUser1.email, password: testUser1.password }),
      });
      assert(loginRes.status === 200, 'POST /api/auth/login authenticates valid user');
      assert(loginRes.body.token !== undefined, 'Login returns JWT token');

      // Invalid Password
      const badPassRes = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: testUser1.email, password: 'WrongPassword!' }),
      });
      assert(badPassRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

      // Non-existent Email
      const noUserRes = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password123' }),
      });
      assert(noUserRes.status === 401, 'Non-existent email rejected with 401 Unauthorized');

      // Verify Profile with JWT
      const meRes = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${token1}` },
      });
      assert(meRes.status === 200, 'GET /api/auth/me with Bearer token returns 200');
      assert(meRes.body.user.name === testUser1.name, 'Profile matches authenticated user');

      // Profile without JWT
      const noTokenRes = await request('/api/auth/me');
      assert(noTokenRes.status === 401, 'GET /api/auth/me without token rejected with 401');
    }

    // ----------------------------------------------------
    // TEST SUITE 4: Blog Post CRUD & Authorization
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 4: Blog Post Creation, Querying & Authorization');
    {
      // Unauthenticated Create Post
      const unauthPost = await request('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ title: 'Unauth Post', content: 'Should not work without token' }),
      });
      assert(unauthPost.status === 401, 'Creating post without token returns 401 Unauthorized');

      // Authenticated Create Post by User 1
      const createRes = await request('/api/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
        body: JSON.stringify({
          title: 'Automated Testing with Node.js and Jest',
          category: 'Programming',
          tags: ['testing', 'nodejs', 'qa'],
          content: 'Writing automated tests ensures high confidence, prevent regressions, and documents API behavior cleanly over time.',
        }),
      });
      assert(createRes.status === 201, 'POST /api/posts by User 1 returns 201 Created');
      assert(createRes.body.post.title === 'Automated Testing with Node.js and Jest', 'Post title matches');
      assert(createRes.body.post.category === 'Programming', 'Post category matches');
      assert(createRes.body.post.readTime >= 1, 'Read time auto-calculated');
      createdPostId = createRes.body.post._id;

      // Get All Posts
      const allPostsRes = await request('/api/posts');
      assert(allPostsRes.status === 200, 'GET /api/posts returns 200 OK');
      assert(Array.isArray(allPostsRes.body.posts), 'Returns array of posts');
      assert(allPostsRes.body.posts.length >= 1, 'Posts array is populated');

      // Search Filter
      const searchRes = await request('/api/posts?search=Automated');
      assert(searchRes.status === 200, 'GET /api/posts?search=Automated returns 200');
      assert(searchRes.body.posts.some((p) => p._id === createdPostId), 'Search query found created post');

      // Category Filter
      const catRes = await request('/api/posts?category=Programming');
      assert(catRes.status === 200, 'GET /api/posts?category=Programming returns 200');
      assert(catRes.body.posts.every((p) => p.category.toLowerCase() === 'programming'), 'All filtered posts belong to category');

      // Get Post by ID
      const singlePostRes = await request(`/api/posts/${createdPostId}`);
      assert(singlePostRes.status === 200, 'GET /api/posts/:id returns 200');
      assert(singlePostRes.body.post._id === createdPostId, 'Single post ID matches');
      assert(singlePostRes.body.post.author.name === testUser1.name, 'Author details are populated');

      // Edit Post by Unauthorized User (User 2 attempts to edit User 1 post)
      const badEditRes = await request(`/api/posts/${createdPostId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token2}` },
        body: JSON.stringify({ title: 'Hacked Title By Other User' }),
      });
      assert(badEditRes.status === 403, 'PUT /api/posts/:id by non-author returns 403 Forbidden');

      // Edit Post by Author (User 1)
      const goodEditRes = await request(`/api/posts/${createdPostId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token1}` },
        body: JSON.stringify({
          title: 'Automated Testing with Node.js and Jest (Updated)',
          content: 'Updated content with even more thorough technical assertions and regression safety.',
        }),
      });
      assert(goodEditRes.status === 200, 'PUT /api/posts/:id by author returns 200 OK');
      assert(goodEditRes.body.post.title.includes('(Updated)'), 'Updated title persisted');
    }

    // ----------------------------------------------------
    // TEST SUITE 5: Comments CRUD & Authorization
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 5: Comments Section & Comment Authorization');
    {
      // Add Comment without Token
      const unauthComment = await request(`/api/posts/${createdPostId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Unauthenticated comment' }),
      });
      assert(unauthComment.status === 401, 'POST comment without token returns 401 Unauthorized');

      // Add Comment by User 2
      const addCommentRes = await request(`/api/posts/${createdPostId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token2}` },
        body: JSON.stringify({ content: 'Super insightful post! I completely agree on testing.' }),
      });
      assert(addCommentRes.status === 201, 'POST comment by User 2 returns 201 Created');
      assert(addCommentRes.body.comment.content.includes('insightful'), 'Comment content matches');
      createdCommentId = addCommentRes.body.comment._id;

      // Get Comments for Post
      const getCommentsRes = await request(`/api/posts/${createdPostId}/comments`);
      assert(getCommentsRes.status === 200, 'GET /api/posts/:id/comments returns 200 OK');
      assert(getCommentsRes.body.comments.length >= 1, 'Post comments list has items');
      assert(getCommentsRes.body.comments.some((c) => c._id === createdCommentId), 'Created comment is in list');

      // Verify post commentCount incremented
      const postAfterComment = await request(`/api/posts/${createdPostId}`);
      assert(postAfterComment.body.post.commentCount >= 1, 'Post commentCount incremented');

      // Delete Comment by Unauthorized User (User 1 attempts to delete User 2 comment)
      const badDeleteCommentRes = await request(`/api/comments/${createdCommentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` },
      });
      assert(badDeleteCommentRes.status === 403, 'DELETE comment by non-author returns 403 Forbidden');

      // Delete Comment by Author (User 2)
      const goodDeleteCommentRes = await request(`/api/comments/${createdCommentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token2}` },
      });
      assert(goodDeleteCommentRes.status === 200, 'DELETE comment by author returns 200 OK');

      // Verify comment count decremented
      const postAfterCommentDel = await request(`/api/posts/${createdPostId}`);
      assert(postAfterCommentDel.body.post.commentCount === 0, 'Post commentCount decremented after delete');
    }

    // ----------------------------------------------------
    // TEST SUITE 6: Post Deletion & Cascade Clean-up
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 6: Post Deletion & Cascade Clean-up');
    {
      // Attempt Delete by Non-Author (User 2)
      const badDeletePost = await request(`/api/posts/${createdPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token2}` },
      });
      assert(badDeletePost.status === 403, 'DELETE post by non-author returns 403 Forbidden');

      // Delete by Author (User 1)
      const goodDeletePost = await request(`/api/posts/${createdPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` },
      });
      assert(goodDeletePost.status === 200, 'DELETE post by author returns 200 OK');

      // Verify Post is gone
      const checkDeleted = await request(`/api/posts/${createdPostId}`);
      assert(checkDeleted.status === 404, 'Deleted post returns 404 Not Found');
    }

    console.log('\n======================================================');
    console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED WITH ZERO ERRORS!');
    } else {
      console.error(`⚠️ ${failedTests} TESTS FAILED.`);
    }
    console.log('======================================================\n');
  } catch (err) {
    console.error('Unexpected test runner error:', err);
  } finally {
    if (server) {
      server.close();
    }
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runTests();
