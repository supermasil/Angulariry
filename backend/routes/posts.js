const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const extractFile = require("../middleware/multer");
const PostController = require("../controllers/posts");

router.post('', checkAuth.isAuthenticated, extractFile, PostController.createPost);

router.get('', PostController.getPosts);

router.get('/:id', PostController.getPost)

router.delete('/:id', checkAuth.isAuthenticated, PostController.deletePost);

router.put('/:id', checkAuth.isAuthenticated, extractFile, PostController.updatePost);

module.exports = router;
