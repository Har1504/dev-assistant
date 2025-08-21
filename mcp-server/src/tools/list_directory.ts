import { FunctionDeclaration } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

// Define the schema for the list_directory tool for the Gemini API
export const listDirectorySchema: FunctionDeclaration = {
  name: "list_directory",
  description: "Lists the files and subdirectories in a given directory.",
  parameters: {
    type: "OBJECT",
    properties: {
      path: {
        type: "STRING",
        description: "The path to the directory to list.",
      },
    },
    required: ["path"],
  },
};

// Define the function that implements the tool
export async function listDirectory(args: { path: string }): Promise<string> {
  try {
    // Basic security check to prevent directory traversal
    const projectRoot = path.resolve(process.cwd());
    const fullPath = path.resolve(projectRoot, args.path);

    if (!fullPath.startsWith(projectRoot)) {
      return "Error: Access denied. Path is outside the project directory.";
    }

    const files = await fs.readdir(fullPath);
    return files.join("\n");
  } catch (error: any) {
    // Provide a more user-friendly error message
    if (error.code === 'ENOENT') {
      return `Error: Directory not found at path: ${args.path}`;
    }
    return `Error listing directory: ${error.message}`;
  }
}