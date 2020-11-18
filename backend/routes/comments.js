const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const CommentController = require("../controllers/comments");

router.post('/', checkAuth.isAuthenticated, CommentController.createComment);

router.delete('/:id', checkAuth.isAuthenticated, CommentController.deleteComment);

router.put('/:id', checkAuth.isAuthenticated, CommentController.updateComment);

module.exports = router;
