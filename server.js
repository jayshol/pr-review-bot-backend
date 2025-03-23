import express from 'express';
import pkg from 'body-parser';
const { json, urlencoded } = pkg;
import cors from 'cors';
import reviewRoutes from './routes/reviewRoutes.js';
import githubRoutes from './routes/githubRoutes.js';
import 'dotenv/config';
import mongoose from 'mongoose';

const app = express();
//const { json } = pkg;
const port = process.env.PORT || 5001; // Change from 5000 to 5001


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));


// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://pr-review-bot-frontend.vercel.app"], // Add your frontend URL here
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
//  Handle CORS preflight requests explicitly
app.options("*", (req, res) => {
  res.status(200).send(); // Ensure preflight requests get a proper response
});

app.use(json());
app.use(urlencoded({ extended: true })); // Parse URL-encoded requests

app.use("/api", reviewRoutes);
app.use('/github', githubRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
