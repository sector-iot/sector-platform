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
  name: PlatformIO CI
  
  on: [push]
  
  jobs:
    build:
      runs-on: ubuntu-latest
  
      steps:
        # Checkout the repository
        - uses: actions/checkout@v2
  
        # Set up Python and install PlatformIO
        - name: Set up Python
          uses: actions/setup-python@v2
          with:
            python-version: '3.x'
  
        - name: Install PlatformIO
          run: |
            python -m pip install --upgrade pip
            pip install platformio
  
        # Build the project
        - name: Build Project
          run: platformio run
  
        # Run static analysis (Cppcheck)
        - name: Run PIO Check
          run: pio check
  
        # Upload the built binary as an artifact
        - name: Upload Binary Artifact
          uses: actions/upload-artifact@v4
          with:
            name: firmware-binary
            path: .pio/build/esp32dev/firmware.bin
            if-no-files-found: ignore
            retention-days: 7 # Optional: Keeps the artifact for 7 days
  
        # Install MinIO client (mc)
        - name: Install MinIO Client (mc)
          run: |
            curl -O https://dl.min.io/client/mc/release/linux-amd64/mc
            chmod +x mc
            sudo mv mc /usr/local/bin/
  
        # Configure MinIO client with the running MinIO instance
        - name: Configure MinIO Client
          run: |
            mc alias set myminio \${{ secrets.MINIO_ENDPOINT }} \${{ secrets.MINIO_ACCESS_KEY }} \${{ secrets.MINIO_SECRET_KEY }}
  
        # Use the existing bucket in MinIO
        - name: Check Bucket Exists
          run: |
            echo "Using existing firmware-bucket"
            mc ls myminio/firmware-bucket/
  
        # Extract firmware version
        - name: Extract Firmware Version
          id: extract_version
          run: |
            VERSION=\$(grep '#define FIRMWARE_VERSION' src/version.h | awk '{print \$3}' | tr -d '\"')
            echo "Firmware version: \$VERSION"
            echo "VERSION=\$VERSION" >> \$GITHUB_ENV
  
        # Upload the built binary to MinIO with repository name and version as prefix
        - name: Upload Binary to MinIO
          run: |
            REPO_NAME="\${GITHUB_REPOSITORY#*/}"
            VERSION="\${{ env.VERSION }}"
            mc cp .pio/build/esp32dev/firmware.bin myminio/firmware-bucket/\${REPO_NAME}-firmware-\${VERSION}.bin
          if: success()
  
        - name: Update Firmware API
          run: |
            # Get repository name
            REPO_NAME="\${GITHUB_REPOSITORY#*/}"
  
            # Prepare the JSON payload with the MinIO URL and repository ID
            MINIO_URL="\${{ secrets.MINIO_ENDPOINT }}/firmware-bucket/\${REPO_NAME}-firmware-\${VERSION}.bin"
  
            # Make the API request
            curl -X POST https://api.sector-iot.space/api/firmware/ \
            -H "Content-Type: application/json" \
            -H "x-api-key: \${{ secrets.API_KEY }}" \
            -d '{
              "url": "\${MINIO_URL}",
              "repositoryId": "\${{ secrets.REPOSITORY_ID }}",
              "version": "\${VERSION}"
            }'
  `;
  
  

  const octokit = new Octokit({ auth: token });
  const { data: repoInfo } = await octokit.repos.get({ owner, repo });
  const branch = repoInfo.default_branch;

  let sha;
  try {
    const { data: existingFile } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    // If the file exists, get its sha
    sha = existingFile.sha;
  } catch (error) {
    if (error.status !== 404) {
      throw error; // Only ignore 404 (file not found), rethrow other errors
    }
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: "Add or update Hello World workflow",
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
    ...(sha && { sha }), // Only include sha if it exists
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
          console.error(
            `❌ Failed to add build file to ${owner}/${name}:`,
            err.response?.data || err.message
          );
        }
      }
    } catch (err) {
      console.error("❌ Failed to get installation access token:", err.message);
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 GitHub App is listening on http://localhost:3000"));
