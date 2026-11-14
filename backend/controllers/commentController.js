const { commentRepo, postRepo } = require('../models');

// @desc    Get all comments for a specific post
// @route   GET /api/posts/:postId/comments
// @access  Public
const getCommentsByPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await postRepo.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found.',
      });
    }

    const comments = await commentRepo.findByPost(postId);

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comments
// @access  Private (Authenticated users only)
const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.',
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters.',
      });
    }

    const post = await postRepo.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found.',
      });
    }

    const newComment = await commentRepo.create({
      post: postId,
      author: req.user._id,
      content: content.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully!',
      comment: newComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (Comment author only)
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await commentRepo.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    // Authorization check: Only the comment's author can delete their comment
    const authorId = comment.author?._id || comment.author;
    if (authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only delete your own comments.',
      });
    }

    await commentRepo.deleteById(id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommentsByPost,
  addComment,
  deleteComment,
};
