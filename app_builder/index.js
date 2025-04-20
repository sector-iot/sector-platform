const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");

// Generate the JWT for authentication with GitHub
function generateJWT() {
  return jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000) - 60, // issued at
      exp: Math.floor(Date.now() / 1000) + 600, // expires in 10 minutes
      iss: APP_ID, // App ID
    },
    PRIVATE_KEY,
    { algorithm: "RS256" }
  );
}

// Get installation access token to authenticate API requests on behalf of the installation
async function getInstallationAccessToken(installationId) {
  const jwtToken = generateJWT();
  const response = await axios.post(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {},
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  return response.data.token;
}

// Add build workflow file to the repository
async function addBuildFile(repo, owner, token) {
  const path = ".github/workflows/build.yml";
  const content = `
name: Build

on:
  push:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run a script
        run: echo "Hello from GitHub App!"
`;

  const encodedContent = Buffer.from(content).toString("base64");

  // First, get the default branch (in case it's not "main")
  const repoInfo = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  const branch = repoInfo.data.default_branch;

  // Create or update the build.yml file in the repository
  await axios.put(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      message: "Add build workflow",
      content: encodedContent,
      branch: branch,
    },
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
}

app.post("/webhook", async (req, res) => {
    console.log("📦 Received event:", req.headers["x-github-event"]);
    console.log("🔍 Body:", JSON.stringify(req.body, null, 2));
  
    const event = req.headers["x-github-event"];
    const action = req.body.action;
  
    if (event === "installation_repositories") {
      // Check if repositories_added or repositories_removed is populated
      const repositoriesAdded = req.body.repositories_added;
      const repositoriesRemoved = req.body.repositories_removed;
  
      if (repositoriesAdded && repositoriesAdded.length > 0) {
        console.log(`✅ Repositories added: ${repositoriesAdded.map(repo => repo.name).join(', ')}`);
        for (const repo of repositoriesAdded) {
          const owner = req.body.installation.account.login;
          const name = repo.name;
  
          try {
            const token = await getInstallationAccessToken(req.body.installation.id);
            await addBuildFile(name, owner, token);
            console.log(`✅ Added build file to ${owner}/${name}`);
          } catch (err) {
            console.error(`❌ Failed to add build file to ${owner}/${name}:`, err.response?.data?.message || err.message);
          }
        }
      } else {
        console.log("❌ No repositories added in the event!");
      }
  
      if (repositoriesRemoved && repositoriesRemoved.length > 0) {
        console.log(`✅ Repositories removed: ${repositoriesRemoved.map(repo => repo.name).join(', ')}`);
        // Handle repository removal logic if needed
      } else {
        console.log("❌ No repositories removed in the event!");
      }
    }
  
    res.sendStatus(200); // Respond to GitHub that the webhook was handled
  });
  

app.listen(3000, () => console.log("🚀 GitHub App is listening on http://localhost:3000"));
