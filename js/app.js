const githubUser = "arjun939201";
const repo = "social";
const branch = "main";

const usersUrl = `https://raw.githubusercontent.com/${githubUser}/${repo}/${branch}/data/users.json`;
const postsUrl = `https://raw.githubusercontent.com/${githubUser}/${repo}/${branch}/data/posts.json`;

let users = [];
let posts = [];
const currentUserId = 1; // For demo, assume logged-in user is ID 1 (alice)

// Fetch users and posts
async function fetchData() {
  const usersRes = await fetch(usersUrl);
  users = await usersRes.json();

  const postsRes = await fetch(postsUrl);
  posts = await postsRes.json();
}

// Render feed
function renderFeed() {
  const feedDiv = document.getElementById("feed-posts");
  feedDiv.innerHTML = posts.map(p => {
    const author = users.find(u => u.id === p.user_id)?.username || "Unknown";
    return `<div class="post"><strong>${author}:</strong> ${p.content}<br>Likes: ${p.likes}</div>`;
  }).join("");
}

// Render profile page
function renderProfile() {
  const user = users.find(u => u.id === currentUserId);
  if (!user) return;

  document.getElementById("profile-username").innerText = user.username;
  document.getElementById("post-count").innerText = posts.filter(p => p.user_id === user.id).length;
  document.getElementById("followers-count").innerText = user.followers.length;
  document.getElementById("following-count").innerText = user.following.length;

  const profilePostsDiv = document.getElementById("profile-posts");
  const userPosts = posts.filter(p => p.user_id === user.id);
  profilePostsDiv.innerHTML = userPosts.map(p => `<div class="post">${p.content}</div>`).join("");
}

// Navigation logic
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      document.querySelector(".nav-item.active").classList.remove("active");
      item.classList.add("active");

      document.querySelector(".page.active").classList.remove("active");
      const pageId = item.dataset.page;
      document.getElementById(pageId).classList.add("active");
    });
  });

  // Profile icon click
  document.getElementById("profile-icon").addEventListener("click", () => {
    document.querySelector(".page.active").classList.remove("active");
    document.getElementById("profile-page").classList.add("active");
  });
}

// Initialize app
async function init() {
  await fetchData();
  renderFeed();
  renderProfile();
  setupNavigation();
}

init();
