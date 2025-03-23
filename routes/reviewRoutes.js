import { Router } from "express";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import  PRReview  from "../models/review.js";

const router = Router();
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4", // Ensure you specify a model
});

router.post("/", async (req, res) => {
  const { code } = req.body;
 
  if (!code) {
    return res.status(400).json({ error: "Code is required." });
  }

  try {
    // Create a prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a senior software engineer who is very particular about implementing best coding practices. Analyze the following code and provide constructive feedback. You do not need to give refactored code samples."],
      ["human", "{code}"], // Use placeholder
    ]);

    // Format the prompt correctly
    const formattedPrompt = await prompt.format({ code });

    // Send the prompt to OpenAI via LangChain
    const response = await chatModel.invoke(formattedPrompt);

    res.json({ review: response.content }); // Extract review text
  } catch (error) {
    console.error("Error generating review:", error);
    res.status(500).json({ error: "Failed to generate review comments." });
  }
});


// save or update PRReview
router.post("/savereview", async (req, res) => {
  let { prId, fileName, fileContent, reviewComments } = req.body;
  try {
    const existingReview = await PRReview.findOne({ prId, fileName });

    if (existingReview) {
      existingReview.fileContent = fileContent;
      existingReview.reviewComments = reviewComments;
      existingReview.timestamp = new Date();
      await existingReview.save();
      return res.json({ message: "Review updated", review: existingReview });
    }

    const newReview = new PRReview({ prId, fileName, fileContent, reviewComments });
    await newReview.save();
    res.json({ message: "Review saved", review: newReview });
  } catch (error) {
    res.status(500).json({ error: "Error saving review" });
  }
});


router.get("/prs", async (req, res) => {

  try {
    const reviews = await PRReview.find().sort({ timestamp: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Error fetching PRs" });
  }
});


router.get("/review/:prId/:fileName", async (req, res) => {
  const { prId, fileName } = req.params;

  try {
    const review = await PRReview.findOne({ prId, fileName });
    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving review" });
  }
});

export default router;
