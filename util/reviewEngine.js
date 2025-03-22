import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
const chatModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4", // Ensure you specify a model
});



export async function analyzeFiles(files) {
    // Your existing analysis logic here
    let reviewComments = [];

    for (const file of files) {
        const comments = await analyzeFile(file);
        reviewComments.push(...comments);
    }

    return reviewComments;
}

async function analyzeFile(file) {
    // Dummy function – replace with your actual PR review logic
    //return [{ text: `Possible issue in ${file.name}`, file: file.name, position: 1 }];
    // Create a prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are a senior software engineer who provides detailed and structured code reviews. 
      Analyze the following code and return an array of review comments in **valid JSON format**. 
      Do NOT include any extra text before or after the JSON response.`],
      ["human", "{code}"], // Placeholder for actual code input
    ]);
    console.log(typeof(file));

    // Ensure `code` is properly defined before formatting
    if (!file || typeof file.content !== "string") {
      throw new Error("Missing or invalid `file` input");
    }
    if (!file.content.trim()) {
      throw new Error(`File ${file.name} has empty content`);
    }
    console.log("File content preview:", file.content.slice(0, 200));

    const sanitizedContent = file.content.replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII chars
    // Format the prompt correctly
    //const formattedPrompt = await prompt.format({ code: sanitizedContent });
    const formattedPrompt = await prompt.format({ code: sanitizedContent});

    console.log("Formatted Prompt:", formattedPrompt);
    // Send the prompt to OpenAI via LangChain
    const response = await chatModel.invoke(formattedPrompt);

    // Parse the response to JSON
    let comments;
    try {
      comments = JSON.parse(response.content).map(comment => ({
          position: comment.line,   // Convert "line" to "position"
          text: comment.comment,    // Convert "comment" to "text"
          file: file.name,          // Add the file name
      }));
  } catch (error) {
      console.error("Failed to parse AI response:", response);
      comments = []; // Default to empty array if parsing fails
  }
    return comments;
}
