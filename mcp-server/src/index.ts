import express, { Request, Response } from "express";
import cors from "cors";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import "dotenv/config";
import { listDirectorySchema, listDirectory } from "./tools/list_directory";
import { readFileSchema, readFile } from "./tools/read_file";
import { writeFileSchema, writeFile } from "./tools/write_file";
import {
  executeShellCommandSchema,
  executeShellCommand,
} from "./tools/execute_shell_command";

const app = express();
const port = 3001;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "MCP Server is running" });
});

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
      model: "gemini-1.5-flash",
      tools: {
        functionDeclarations: [
          listDirectorySchema,
          readFileSchema,
          writeFileSchema,
          executeShellCommandSchema,
        ],
      },
    });

    const chat = model.startChat({
      history,
    });

    // Add user message to history before making the call
    history.push({ role: "user", parts: [{ text: message }] });

    const result = await chat.sendMessageStream(message);

    res.setHeader("Content-Type", "text/plain");
    res.flushHeaders(); // flush the headers to establish a connection

    let fullResponseText = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullResponseText += chunkText;
        res.write(chunkText);
      }
    }

    // After streaming, check for function calls
    if (result.response) {
      const response = await result.response;
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        // Handle tool calls here, similar to the non-streaming version
        // This part will need to be adapted for a streaming context if tools can be streamed
        // For now, we handle it after the initial stream.
        const call = functionCalls[0];
        let apiResponse;

        if (call.name === "list_directory") {
          const result = await listDirectory(call.args);
          apiResponse = { name: "list_directory", response: { content: result } };
        } else if (call.name === "read_file") {
          const result = await readFile(call.args);
          apiResponse = { name: "read_file", response: { content: result } };
        } else if (call.name === "write_file") {
          const result = await writeFile(call.args);
          apiResponse = { name: "write_file", response: { content: result } };
        } else if (call.name === "execute_shell_command") {
          const result = await executeShellCommand(call.args);
          apiResponse = { name: "execute_shell_command", response: { content: result } };
        } else {
          throw new Error(`Unknown tool: ${call.name}`);
        }

        const toolResult = await chat.sendMessageStream(
          JSON.stringify({ functionResponse: apiResponse })
        );

        for await (const chunk of toolResult.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullResponseText += chunkText;
            res.write(chunkText);
          }
        }
      }
    }

    // Add the final model response to history
    if (fullResponseText) {
      history.push({ role: "model", parts: [{ text: fullResponseText }] });
    }

    res.end();
  } catch (error) {
    console.error("Error processing request:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.end(); // End the stream if an error occurs mid-stream
    }
  }
});

app.listen(port, () => {
  console.log(`MCP Server listening on http://localhost:${port}`);
});
