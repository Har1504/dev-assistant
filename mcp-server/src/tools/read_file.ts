import { promises as fs } from "fs";
import { z } from "zod";

export const readFileSchema = {
  name: "read_file",
  description: "Reads the content of a file at a given path.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file.",
      },
    },
    required: ["path"],
  },
};

const ReadFileArgsSchema = z.object({
  path: z.string(),
});

export async function readFile(args: unknown) {
  try {
    const validatedArgs = ReadFileArgsSchema.parse(args);
    const content = await fs.readFile(validatedArgs.path, "utf-8");
    return content;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return `Invalid arguments: ${error.errors.map((e) => e.message).join(", ")}`;
    }
    // Check for file not found error
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return `File not found at path: ${(error as any).path}`;
    }
    return `Error reading file: ${error instanceof Error ? error.message : "An unknown error occurred"}`;
  }
}
