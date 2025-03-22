const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json({ verify: verifyGitHubSignature })); // Middleware to verify signature

const GITHUB_SECRET = "your_webhook_secret"; // Set this in GitHub when creating the webhook

function verifyGitHubSignature(req, res, buf) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return res.status(401).send("Signature missing");

  const computedSig =
    "sha256=" + crypto.createHmac("sha256", GITHUB_SECRET).update(buf).digest("hex");

  if (signature !== computedSig) {
    return res.status(401).send("Invalid signature");
  }
}

// GitHub Webhook Endpoint
app.post("/webhook", async (req, res) => {
  const event = req.headers["x-github-event"];
  const payload = req.body;

  if (event === "pull_request") {
    const { action, pull_request, repository } = payload;

    if (action === "opened" || action === "synchronize") {
      console.log(`PR ${pull_request.number} updated in ${repository.full_name}`);
      await handlePRReview(pull_request, repository);
    }
  }

  res.status(200).send("Webhook received");
});
