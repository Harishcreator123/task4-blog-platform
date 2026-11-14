const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isMongooseConnected } = require('../config/db');
const User = require('./User');
const Post = require('./Post');
const Comment = require('./Comment');
const memoryStore = require('./memoryStore');

// --- USER REPOSITORY ---
const userRepo = {
  async findByEmail(email, includePassword = false) {
    if (isMongooseConnected()) {
      const query = User.findOne({ email: email.toLowerCase().trim() });
      if (includePassword) {
        query.select('+password');
      }
      return await query.exec();
    }
    return await memoryStore.findUserByEmail(email, includePassword);
  },

  async findById(id) {
    if (isMongooseConnected()) {
      return await User.findById(id).select('-password');
    }
    return await memoryStore.findUserById(id);
  },

  async create(userData) {
    if (isMongooseConnected()) {
      const user = new User(userData);
      await user.save();
      const sanitized = user.toObject();
      delete sanitized.password;
      return sanitized;
    }
    return await memoryStore.createUser(userData);
  },

  async updateById(id, updateData) {
    if (isMongooseConnected()) {
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }
      return await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select('-password');
    }
    return await memoryStore.updateUserById(id, updateData);
  },

  async comparePassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  },
};

// --- POST REPOSITORY ---
const postRepo = {
  async find({ search, category, tag, author, sort = 'latest', page = 1, limit = 50 }) {
    if (isMongooseConnected()) {
      const query = {};

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex },
        ];
      }

      if (category && category !== 'All' && category !== '') {
        query.category = new RegExp(`^${category}$`, 'i');
      }

      if (tag && tag.trim()) {
        query.tags = new RegExp(`^${tag.trim()}$`, 'i');
      }

      if (author) {
        query.author = author;
      }

      let sortOption = { createdAt: -1 };
      if (sort === 'oldest') {
        sortOption = { createdAt: 1 };
      } else if (sort === 'most-commented') {
        sortOption = { commentCount: -1, createdAt: -1 };
      } else if (sort === 'title') {
        sortOption = { title: 1 };
      }

      const skip = (page - 1) * limit;
      const total = await Post.countDocuments(query);
      const posts = await Post.find(query)
        .populate('author', 'name email avatar bio')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .exec();

      return {
        posts,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    return await memoryStore.findPosts({
      search,
      category,
      tag,
      author,
      sort,
      page,
      limit,
    });
  },

  async findById(id) {
    if (isMongooseConnected()) {
      return await Post.findById(id).populate('author', 'name email avatar bio');
    }
    return await memoryStore.findPostById(id);
  },

  async create(postData) {
    if (isMongooseConnected()) {
      const post = new Post(postData);
      await post.save();
      return await Post.findById(post._id).populate('author', 'name email avatar bio');
    }
    return await memoryStore.createPost(postData);
  },

  async updateById(id, updateData) {
    if (isMongooseConnected()) {
      if (updateData.content) {
        const plainText = updateData.content.replace(/<[^>]*>?/gm, '');
        const wordCount = plainText.trim().split(/\s+/).length;
        updateData.readTime = Math.max(1, Math.ceil(wordCount / 200));

        if (!updateData.excerpt) {
          updateData.excerpt = plainText.substring(0, 160) + (plainText.length > 160 ? '...' : '');
        }
      }

      if (updateData.tags && typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
      }

      return await Post.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate('author', 'name email avatar bio');
    }

    return await memoryStore.updatePostById(id, updateData);
  },

  async deleteById(id) {
    if (isMongooseConnected()) {
      const deleted = await Post.findByIdAndDelete(id);
      if (deleted) {
        // Cascade delete comments
        await Comment.deleteMany({ post: id });
      }
      return deleted;
    }
    return await memoryStore.deletePostById(id);
  },
};

// --- COMMENT REPOSITORY ---
const commentRepo = {
  async findByPost(postId) {
    if (isMongooseConnected()) {
      return await Comment.find({ post: postId })
        .populate('author', 'name email avatar bio')
        .sort({ createdAt: -1 })
        .exec();
    }
    return await memoryStore.findCommentsByPost(postId);
  },

  async findById(id) {
    if (isMongooseConnected()) {
      return await Comment.findById(id).populate('author', 'name email avatar bio');
    }
    return await memoryStore.findCommentById(id);
  },

  async create(commentData) {
    if (isMongooseConnected()) {
      const comment = new Comment(commentData);
      await comment.save();
      await Post.findByIdAndUpdate(commentData.post, { $inc: { commentCount: 1 } });
      return await Comment.findById(comment._id).populate('author', 'name email avatar bio');
    }
    return await memoryStore.createComment(commentData);
  },

  async deleteById(id) {
    if (isMongooseConnected()) {
      const comment = await Comment.findById(id);
      if (!comment) return null;
      await Comment.findByIdAndDelete(id);
      await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
      return comment;
    }
    return await memoryStore.deleteCommentById(id);
  },
};

module.exports = {
  User,
  Post,
  Comment,
  userRepo,
  postRepo,
  commentRepo,
};
