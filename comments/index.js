const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

// app.get("/posts/:id/comments", (req, res) => {
//   res.send(commentsByPostId[req.params.id] || []);
// });

app.get("/posts/comments", (req, res) => {
  res.send(commentsByPostId);
});

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { content } = req.body;
  comment = { id: commentId, content, status: "pending" };
  const comments = commentsByPostId[req.params.id] || [];
  comments.push(comment);
  commentsByPostId[req.params.id] = comments;

  await axios.post("http://eventbus-srv:4005/events", {
    type: "CommentCreated",
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: "pending",
    },
  });
  res.status(201).send(comment);
});

app.post("/events", async (req, res) => {
  console.log("Recevied Events", req.body.type);

  const { type, data } = req.body;
  if (type === "CommentModerated") {
    const { postId, id, content, status } = data;
    const comments = commentsByPostId[postId];

    const comment = comments.find((comment) => {
      return comment.id === id;
    });

    comment.status = status;

    await axios.post("http://eventbus-srv:4005/events", {
      type: "CommentUpdated",
      data: {
        id,
        content,
        postId,
        status,
      },
    });
  }

  res.send({});
});

app.listen(4001, () => {
  console.log("Listening on 4001");
});
