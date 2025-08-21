import express, { Request, Response } from "express";
import cors from "cors";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import "dotenv/config";
import { listDirectorySchema, listDirectory } from "./tools/list_directory";

const app = express();
const port = 3001;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.use(cors());
app.use(express.json());

// A simple history store (in-memory, resets on server restart)
const historyStore: { [chatId: string]: Content[] } = {};

app.post("/api/mcp", async (req: Request, res: Response) => {
  try {
    const { message, chatId = "default" } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Initialize history for a new chat
    if (!historyStore[chatId]) {
      historyStore[chatId] = [];
    }
    const history = historyStore[chatId];

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Or another model that supports function calling
      tools: {
        functionDeclarations: [listDirectorySchema],
      },
    });

    const chat = model.startChat({
      history,
    });

    const result = await chat.sendMessage(message);
    const response = result.response;

    // Add user message to history
    history.push({ role: "user", parts: [{ text: message }] });

    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]; // Handle one tool call at a time for simplicity
      let apiResponse;

      if (call.name === "list_directory") {
        const result = await listDirectory(call.args);
        apiResponse = {
          name: "list_directory",
          response: {
            content: result,
          },
        };
      } else {
        throw new Error(`Unknown tool: ${call.name}`);
      }

      // Send the tool's result back to the model
      const toolResult = await chat.sendMessage(
        JSON.stringify({ functionResponse: apiResponse })
      );
      const toolResponse = toolResult.response;
      const finalResponse = toolResponse.text();
      
      // Add model's response to history
      history.push({ role: "model", parts: [{ text: finalResponse }] });
      
      return res.json({ message: finalResponse });
    } else {
      const text = response.text();
      // Add model's response to history
      history.push({ role: "model", parts: [{ text }] });
      return res.json({ message: text });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`MCP Server listening on http://localhost:${port}`);
});
