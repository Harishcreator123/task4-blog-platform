const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

// Generate 24-character hex ID compatible with MongoDB ObjectId format
const generateObjectId = () => crypto.randomBytes(12).toString('hex');

class MemoryStore {
  constructor() {
    this.users = [];
    this.posts = [];
    this.comments = [];
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || [];
        this.posts = data.posts || [];
        this.comments = data.comments || [];
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('MemoryStore init warning:', err.message);
      this.users = [];
      this.posts = [];
      this.comments = [];
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(
          {
            users: this.users,
            posts: this.posts,
            comments: this.comments,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to save to local_db.json:', err.message);
    }
  }

  // --- USER METHODS ---
  async createUser(userData) {
    const existing = this.users.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existing) {
      const err = new Error('User already exists with this email');
      err.code = 11000;
      throw err;
    }

    // Hash password if not already hashed
    let hashedPassword = userData.password;
    if (!hashedPassword.startsWith('$2')) {
      hashedPassword = await bcrypt.hash(userData.password, 10);
    }

    const newUser = {
      _id: userData._id || generateObjectId(),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      bio: userData.bio || 'Passionate writer and reader.',
      avatar:
        userData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);
    this.save();
    return this.sanitizeUser(newUser);
  }

  async findUserByEmail(email, includePassword = false) {
    const user = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (!user) return null;
    return includePassword ? { ...user } : this.sanitizeUser(user);
  }

  async findUserById(id) {
    const user = this.users.find((u) => u._id.toString() === id.toString());
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  async updateUserById(id, updates) {
    const index = this.users.findIndex((u) => u._id.toString() === id.toString());
    if (index === -1) return null;

    if (updates.password && !updates.password.startsWith('$2')) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.save();
    return this.sanitizeUser(this.users[index]);
  }

  sanitizeUser(user) {
    if (!user) return null;
    const clone = { ...user };
    delete clone.password;
    return clone;
  }

  // --- POST METHODS ---
  async createPost(postData) {
    const content = postData.content || '';
    const wordCount = content.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const newPost = {
      _id: postData._id || generateObjectId(),
      title: postData.title.trim(),
      slug: (postData.slug || postData.title)
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      content: postData.content,
      excerpt:
        postData.excerpt && postData.excerpt.trim()
          ? postData.excerpt.trim()
          : content.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...',
      category: postData.category || 'General',
      tags: Array.isArray(postData.tags)
        ? postData.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
        : typeof postData.tags === 'string'
        ? postData.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [],
      coverImage:
        postData.coverImage ||
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      readTime: postData.readTime || readTime,
      author: postData.author,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.posts.unshift(newPost);
    this.save();
    return this.populatePostAuthor(newPost);
  }

  async findPosts({ search, category, tag, author, sort = 'latest', page = 1, limit = 100 }) {
    let result = [...this.posts];

    // Search keyword in title, content, or tags
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Filter category
    if (category && category !== 'All' && category !== '') {
      result = result.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter tag
    if (tag && tag.trim()) {
      const qTag = tag.trim().toLowerCase();
      result = result.filter((p) => p.tags && p.tags.includes(qTag));
    }

    // Filter author
    if (author) {
      result = result.filter((p) => {
        const aId = typeof p.author === 'object' ? p.author._id : p.author;
        return aId.toString() === author.toString();
      });
    }

    // Sorting
    if (sort === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'most-commented') {
      result.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    } else if (sort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: latest
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const total = result.length;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    const populated = await Promise.all(
      paginated.map((p) => this.populatePostAuthor(p))
    );

    return {
      posts: populated,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findPostById(id) {
    const post = this.posts.find((p) => p._id.toString() === id.toString());
    if (!post) return null;
    return this.populatePostAuthor(post);
  }

  async updatePostById(id, updateData) {
    const index = this.posts.findIndex((p) => p._id.toString() === id.toString());
    if (index === -1) return null;

    const current = this.posts[index];
    const content = updateData.content !== undefined ? updateData.content : current.content;
    const wordCount = content.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    let tags = current.tags;
    if (updateData.tags !== undefined) {
      tags = Array.isArray(updateData.tags)
        ? updateData.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
        : typeof updateData.tags === 'string'
        ? updateData.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];
    }

    let excerpt = current.excerpt;
    if (updateData.excerpt !== undefined) {
      excerpt = updateData.excerpt.trim() || content.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...';
    } else if (updateData.content !== undefined) {
      excerpt = content.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...';
    }

    this.posts[index] = {
      ...current,
      ...updateData,
      content,
      readTime,
      tags,
      excerpt,
      updatedAt: new Date(),
    };

    this.save();
    return this.populatePostAuthor(this.posts[index]);
  }

  async deletePostById(id) {
    const index = this.posts.findIndex((p) => p._id.toString() === id.toString());
    if (index === -1) return null;

    const deleted = this.posts.splice(index, 1)[0];
    // Cascade delete comments
    this.comments = this.comments.filter((c) => c.post.toString() !== id.toString());
    this.save();
    return deleted;
  }

  async populatePostAuthor(post) {
    if (!post) return null;
    const clone = { ...post };
    const authorId = typeof clone.author === 'object' && clone.author !== null ? clone.author._id || clone.author : clone.author;
    const user = await this.findUserById(authorId);
    if (user) {
      clone.author = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      };
    }
    return clone;
  }

  // --- COMMENT METHODS ---
  async createComment(commentData) {
    const newComment = {
      _id: commentData._id || generateObjectId(),
      post: commentData.post,
      author: commentData.author,
      content: commentData.content.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.comments.push(newComment);

    // Update post commentCount
    const post = this.posts.find(
      (p) => p._id.toString() === commentData.post.toString()
    );
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
    }

    this.save();
    return this.populateCommentAuthor(newComment);
  }

  async findCommentsByPost(postId) {
    const postComments = this.comments.filter(
      (c) => c.post.toString() === postId.toString()
    );
    // Sort latest comments first
    postComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return Promise.all(postComments.map((c) => this.populateCommentAuthor(c)));
  }

  async findCommentById(id) {
    const comment = this.comments.find((c) => c._id.toString() === id.toString());
    if (!comment) return null;
    return this.populateCommentAuthor(comment);
  }

  async deleteCommentById(id) {
    const index = this.comments.findIndex((c) => c._id.toString() === id.toString());
    if (index === -1) return null;

    const deleted = this.comments.splice(index, 1)[0];

    // Decrement post commentCount
    const post = this.posts.find(
      (p) => p._id.toString() === deleted.post.toString()
    );
    if (post && post.commentCount > 0) {
      post.commentCount -= 1;
    }

    this.save();
    return deleted;
  }

  async populateCommentAuthor(comment) {
    if (!comment) return null;
    const clone = { ...comment };
    const authorId = typeof clone.author === 'object' && clone.author !== null ? clone.author._id || clone.author : clone.author;
    const user = await this.findUserById(authorId);
    if (user) {
      clone.author = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      };
    }
    return clone;
  }

  clear() {
    this.users = [];
    this.posts = [];
    this.comments = [];
    this.save();
  }
}

const memoryStore = new MemoryStore();
module.exports = memoryStore;
