// server.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Allow frontend requests

// ========== CONFIG ==========
const GITHUB_TOKEN = "YOUR_PERSONAL_ACCESS_TOKEN"; // keep secret
const REPO_OWNER = "arjun939201";
const REPO_NAME = "social";
const USERS_PATH = "data/users.json";
const POSTS_PATH = "data/posts.json";
const BRANCH = "main";

// ===== Helper Functions =====

// Get file from GitHub
async function getJsonFile(path) {
  const res = await axios.get(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${path}`);
  return res.data;
}

// Update file on GitHub
async function updateJsonFile(path, newData, commitMessage) {
  const fileRes = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`);
  const sha = fileRes.data.sha;
  const content = Buffer.from(JSON.stringify(newData, null, 2)).toString("base64");

  await axios.put(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      message: commitMessage,
      content,
      sha,
      branch: BRANCH
    },
    { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
  );
}

// ===== Endpoints =====

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  let users = await getJsonFile(USERS_PATH);

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const newUser = {
    id: users.length + 1,
    username,
    password,
    followers: [],
    following: []
  };
  users.push(newUser);
  await updateJsonFile(USERS_PATH, users, `Add new user: ${username}`);
  res.json({ success: true, user: newUser });
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = await getJsonFile(USERS_PATH);
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  res.json({ success: true, user });
});

// Create Post
app.post('/posts', async (req, res) => {
  const { user_id, content } = req.body;
  let posts = await getJsonFile(POSTS_PATH);

  const newPost = {
    id: posts.length + 1,
    user_id,
    content,
    likes: 0
  };
  posts.unshift(newPost);
  await updateJsonFile(POSTS_PATH, posts, `Add post by user ${user_id}`);
  res.json({ success: true, post: newPost });
});

// Get Posts
app.get('/posts', async (req, res) => {
  const posts = await getJsonFile(POSTS_PATH);
  res.json(posts);
});

// Follow/Unfollow
app.post('/follow', async (req, res) => {
  const { currentUserId, targetUserId } = req.body;
  let users = await getJsonFile(USERS_PATH);

  const currentUser = users.find(u => u.id === currentUserId);
  const targetUser = users.find(u => u.id === targetUserId);

  if (!currentUser || !targetUser) return res.status(400).json({ error: "User not found" });

  const index = currentUser.following.indexOf(targetUserId);
  if (index > -1) {
    // Unfollow
    currentUser.following.splice(index, 1);
    targetUser.followers.splice(targetUser.followers.indexOf(currentUserId), 1);
  } else {
    // Follow
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);
  }

  await updateJsonFile(USERS_PATH, users, `Update follow/unfollow by ${currentUser.username}`);
  res.json({ success: true, currentUser, targetUser });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
