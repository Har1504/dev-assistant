import { promises as fs } from "fs";
import { z } from "zod";

export const writeFileSchema = {
  name: "write_file",
  description: "Writes content to a file at a given path. Overwrites the file if it exists.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file.",
      },
      content: {
        type: "string",
        description: "The content to write to the file.",
      },
    },
    required: ["path", "content"],
  },
};

const WriteFileArgsSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export async function writeFile(args: unknown) {
  try {
    const validatedArgs = WriteFileArgsSchema.parse(args);
    await fs.writeFile(validatedArgs.path, validatedArgs.content, "utf-8");
    return `Successfully wrote to ${validatedArgs.path}`;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return `Invalid arguments: ${error.errors.map((e) => e.message).join(", ")}`;
    }
    return `Error writing file: ${error instanceof Error ? error.message : "An unknown error occurred"}`;
  }
}
