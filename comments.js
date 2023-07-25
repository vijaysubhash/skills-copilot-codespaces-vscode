// Create web server
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const axios = require('axios');

// Create app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create app routes
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create app routes
app.post('/posts/:id/comments', async (req, res) => {
  // Create comment id
  const commentId = randomBytes(4).toString('hex');
  const { content } = req.body;

  // Create comment object
  const comment = {
    id: commentId,
    content,
    status: 'pending',
  };

  // Get comments array from commentsByPostId object
  const comments = commentsByPostId[req.params.id] || [];

  // Push new comment to comments array
  comments.push(comment);

  // Set comments array to commentsByPostId object
  commentsByPostId[req.params.id] = comments;

  // Emit event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: {
      ...comment,
      postId: req.params.id,
    },
  });

  // Send response
  res.status(201).send(comments);
});

// Create event handler
app.post('/events', async (req, res) => {
  console.log('Event Received:', req.body.type);

  const { type, data } = req.body;

  // If event type is CommentModerated
  if (type === 'CommentModerated') {
    // Get comments array from commentsByPostId object
    const comments = commentsByPostId[data.postId];

    // Get comment from comments array
    const comment = comments.find((comment) => {
      return comment.id === data.id;
    });

    // Set comment status to moderated
    comment.status = data.status;

    // Emit event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: {
        ...comment,
        postId: data.postId,
      },
   });
    }
