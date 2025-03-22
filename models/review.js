import { Schema, model } from "mongoose";

const prReviewSchema = new Schema({
  prId: { type: String, required: true }, // PR identifier
  fileName: { type: String, required: true }, // Name of reviewed file
  fileContent: { type: String, required: true }, // File content for standalone mode
  reviewComments: { type: [String], default: [] }, // Array of review comments
  timestamp: { type: Date, default: Date.now } // Last updated timestamp
});

const PRReview = model("PRReview", prReviewSchema); // Collection name: 'prreviews'

export default PRReview;