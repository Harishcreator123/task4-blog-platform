const { postRepo } = require('../models');

// @desc    Get all blog posts (with search, category filter, tag filter, author filter, sort, pagination)
// @route   GET /api/posts
// @access  Public
const getAllPosts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      tag,
      author,
      sort = 'latest',
      page = 1,
      limit = 50,
    } = req.query;

    const result = await postRepo.find({
      search,
      category,
      tag,
      author,
      sort,
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    });

    res.status(200).json({
      success: true,
      count: result.posts.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      posts: result.posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await postRepo.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found.',
      });
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new blog post
// @route   POST /api/posts
// @access  Private (Authenticated users only)
const createPost = async (req, res, next) => {
  try {
    const { title, content, category, tags, coverImage, excerpt } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required for creating a blog post.',
      });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters long.',
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot be empty.',
      });
    }

    if (content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Post content must be at least 10 characters long.',
      });
    }

    const newPost = await postRepo.create({
      title: title.trim(),
      content: content.trim(),
      category: category && category.trim() ? category.trim() : 'General',
      tags: tags || [],
      coverImage: coverImage && coverImage.trim() ? coverImage.trim() : undefined,
      excerpt: excerpt && excerpt.trim() ? excerpt.trim() : undefined,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Post published successfully!',
      post: newPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing blog post
// @route   PUT /api/posts/:id
// @access  Private (Post author only)
const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, coverImage, excerpt } = req.body;

    const existingPost = await postRepo.findById(id);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found.',
      });
    }

    // Authorization check: Only the post author can edit it
    const authorId = existingPost.author?._id || existingPost.author;
    if (authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only edit your own blog posts.',
      });
    }

    // Validation
    if (title !== undefined && (!title || !title.trim() || title.trim().length < 3)) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters long.',
      });
    }

    if (content !== undefined && (!content || !content.trim() || content.trim().length < 10)) {
      return res.status(400).json({
        success: false,
        message: 'Content must be at least 10 characters long.',
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (category !== undefined) updates.category = category.trim();
    if (tags !== undefined) updates.tags = tags;
    if (coverImage !== undefined) updates.coverImage = coverImage.trim();
    if (excerpt !== undefined) updates.excerpt = excerpt.trim();

    const updated = await postRepo.updateById(id, updates);

    res.status(200).json({
      success: true,
      message: 'Post updated successfully!',
      post: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/posts/:id
// @access  Private (Post author only)
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPost = await postRepo.findById(id);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found.',
      });
    }

    // Authorization check: Only the post author can delete it
    const authorId = existingPost.author?._id || existingPost.author;
    if (authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only delete your own blog posts.',
      });
    }

    await postRepo.deleteById(id);

    res.status(200).json({
      success: true,
      message: 'Blog post and its comments have been deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};
