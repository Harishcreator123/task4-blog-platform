const express = require('express');
const router = express.Router();
const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} = require('../controllers/postController');
const {
  getCommentsByPost,
  addComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Post endpoints
router.route('/').get(getAllPosts).post(protect, createPost);

router
  .route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

// Nested comment endpoints under posts
router
  .route('/:postId/comments')
  .get(getCommentsByPost)
  .post(protect, addComment);

module.exports = router;
