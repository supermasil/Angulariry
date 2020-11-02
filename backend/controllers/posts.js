const Post = require('../models/post');

exports.createPost = (req, res, next) => {
  const url = req.protocol + '://' + req.get('host');
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    imagePath: url + '/images/' + req.file.filename,
    creator: req.userData.uid
  });
  post.save().then(createdPost => {
    return res.status(201).json({
      message: 'Post created successfully',
      postId: createdPost._id,
      post: {
       // ...createdPost // Copy all existing properties
        id: createdPost._id,
        title: createdPost.title,
        content: createdPost.content,
        imagePath: createdPost.imagePath,
        creator: createdPost.creator
      }
    });
  })
  .catch(error => {
    console.log("createPost: " + error.message);
    return res.status(500).json({message: "Post creation failed"});
  });
}


exports.updatePost = (req, res, next) => {
  let imagePath = req.body.imagePath // Existing image
  if (req.file) { // New image
    const url = req.protocol + '://' + req.get('host');
    imagePath = url + '/images/' + req.file.filename;
  }

  const post = new Post ({
    _id: req.body.id,
    title: req.body.title,
    content: req.body.content,
    imagePath: imagePath,
    creator: req.userData.uid
  });

  Post.updateOne({ _id: req.params.id, creator: req.userData.uid }, post).then(updatedPost => {
    if (updatedPost.n > 0) { // Should not use nModified because of the case save unchanged post
      return res.status(201).json({updatedPost: updatedPost, message: "Post updated sucessfully"});
    } else {
      return res.status(500).json({message: "No post was updated"});
    }
  })
  .catch(error => {
    console.log("updatePost: " + error.message);
    return res.status(500).json({message: "Couldn't update post"});
  });
}

exports.getPosts = (req, res, next) => {
  // Pagination
  const pageSize = +req.query.pageSize; // Convert to int
  const currentPage = +req.query.currentPage;
  const postQuery = Post.find();
  let fetchedPosts;
  if (pageSize && currentPage) {
    postQuery
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
  }
  postQuery
    .then(documents => {
      fetchedPosts = documents
      return Post.countDocuments();
    })
    .then(count => {
      return res.status(200).json({
        posts: fetchedPosts,
        maxPosts: count
      });
    })
    .catch(error => {
      console.log("getPosts: " + error.message);
      return res.status(500).json({message: "Couldn't fetch posts"});
    });
}

exports.getPost = (req, res, next) => {
  Post.findById(req.params.id)
  .then(post => {
      return res.status(200).json(post);
  })
  .catch(error => {
      onsole.log("getPost: " + error.message);
      return res.status(500).json({message: "Couldn't fetch post"});
  });
}

exports.deletePost = (req, res, next) => {
  Post.deleteOne({ _id: req.params.id, creator: req.userData.uid }).then(deletedPost => {
    if (deletedPost.n > 0) {
      return res.status(201).json({message: "Post deleted sucessfully"});
    } else {
      return res.status(401).json({message: "No post was deleted"});
    }
  })
  .catch(error => {
    console.log(error.message);
    return res.status(500).json({message: "Couldn't delete post"});
  });
}
