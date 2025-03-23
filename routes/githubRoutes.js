import express from 'express';
import { analyzeFiles } from '../util/reviewEngine.js';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/github-webhook', express.json(), async (req, res) => {
    // Respond immediately to prevent GitHub timeout
    res.status(200).json({ message: "Webhook received successfully" });
    const event = req.headers['x-github-event'];
    const payload = req.body;
    
    if (event === 'pull_request' && (payload.action === 'opened' || payload.action === 'reopened')) {
        const { repository, pull_request } = payload;
        const owner = repository.owner.login;
        const repo = repository.name;
        const prNumber = pull_request.number;

        // Fetch changed files
        const files = await fetchPRFiles(owner, repo, prNumber);
        if (!files) return res.status(500).json({ error: 'Failed to fetch PR files' });

        console.log('Fetched PR Files:', files);

        // Run analysis
        const reviewComments = await analyzeFiles(files);
        console.log('review', reviewComments);
        // Post comments to GitHub
        await postReviewComments(owner, repo, prNumber, reviewComments);
    }
});

async function fetchPRFiles(owner, repo, prNumber) {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`;
    const response = await fetch(url, {
        headers: { Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}` },
    });

    if (!response.ok) {
        console.error("Failed to fetch PR files:", response.status, await response.text());
        return null;
    }

    const files = await response.json();
    
    // Fetch file contents
    const fileData = await Promise.all(
        files.map(async (file) => {
            const contentResponse = await fetch(file.raw_url);
            if (!contentResponse.ok) return null;

            const content = await contentResponse.text(); // Ensure it's a string

            return {
                name: file.filename,
                content,  // Ensure the content is a string
            };
        })
    );

    return fileData.filter(Boolean); // Remove any failed fetches
}



async function postReviewComments(owner, repo, prNumber, comments) {
    try {
        // Fetch latest commit ID
        const commitId = await getLatestCommitId(owner, repo, prNumber);

        for (const comment of comments) {
            await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`, {
                method: 'POST',
                headers: {
                    Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    body: comment.text,
                    commit_id: commitId, // Use the actual commit ID
                    path: comment.file,
                    position: comment.position,
                }),
            });
        }

        console.log("Comments posted successfully");
    } catch (error) {
        console.error("Error posting review comments:", error);
    }
}

async function getLatestCommitId(owner, repo, prNumber) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
        headers: {
            Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch PR details: ${response.statusText}`);
    }

    const prData = await response.json();
    return prData.head.sha; // This is the latest commit SHA
}

export default router;