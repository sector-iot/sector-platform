import express from "express";
import { Octokit } from "@octokit/rest";
import jwt from "jsonwebtoken";
import fs from "fs";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(bodyParser.json());

const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");

// Generate JWT for GitHub App
function generateJWT() {
  return jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 600,
      iss: APP_ID,
    },
    PRIVATE_KEY,
    { algorithm: "RS256" }
  );
}

// Get an installation access token
async function getInstallationAccessToken(installationId) {
  const jwtToken = generateJWT();
  const octokit = new Octokit({ auth: jwtToken });
  const { data } = await octokit.request(
    "POST /app/installations/{installation_id}/access_tokens",
    { installation_id: installationId }
  );
  return data.token;
}

// Upload a build.yml workflow file
async function addBuildFile(repo, owner, token) {
  const path = ".github/workflows/build.yml";
  const content = `
name: Hello World CI

on: [push]

jobs:
  say-hello:
    runs-on: ubuntu-latest
    steps:
      - name: Say Hello
        run: echo "Hello, world!"
`;

  const octokit = new Octokit({ auth: token });
  const { data: repoInfo } = await octokit.repos.get({ owner, repo });
  const branch = repoInfo.default_branch;

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: "Add Hello World workflow",
    content: Buffer.from(content).toString("base64"),
    branch,
    committer: {
      name: "Doc Pusher",
      email: "bot@doc-pusher.app",
    },
    author: {
      name: "Doc Pusher",
      email: "bot@doc-pusher.app",
    },
  });
}

// Webhook handler
app.post("/webhook", async (req, res) => {
  console.log("📦 Received event:", req.headers["x-github-event"]);
  console.log("🔍 Body:", JSON.stringify(req.body, null, 2));

  const event = req.headers["x-github-event"];
  const action = req.body.action;

  if (event === "installation_repositories" && action === "added") {
    const installationId = req.body.installation.id;
    const repositoriesAdded = req.body.repositories_added;

    if (!repositoriesAdded || repositoriesAdded.length === 0) {
      console.log("❌ No repositories added.");
      return res.sendStatus(200);
    }

    try {
      const token = await getInstallationAccessToken(installationId);

      for (const repo of repositoriesAdded) {
        const owner = req.body.installation.account.login;
        const name = repo.name;

        try {
          await addBuildFile(name, owner, token);
          console.log(`✅ Added build file to ${owner}/${name}`);
        } catch (err) {
          console.error(`❌ Failed to add build file to ${owner}/${name}:`, err.response?.data || err.message);
        }
      }
    } catch (err) {
      console.error("❌ Failed to get installation access token:", err.message);
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 GitHub App is listening on http://localhost:3000"));