import { exec } from "child_process";
import { z } from "zod";

export const executeShellCommandSchema = {
  name: "execute_shell_command",
  description: "Executes a shell command in the project's root directory.",
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute.",
      },
    },
    required: ["command"],
  },
};

const ExecuteShellCommandArgsSchema = z.object({
  command: z.string(),
});

export async function executeShellCommand(args: unknown): Promise<string> {
  return new Promise((resolve) => {
    try {
      const validatedArgs = ExecuteShellCommandArgsSchema.parse(args);
      exec(validatedArgs.command, (error, stdout, stderr) => {
        if (error) {
          resolve(`Error: ${error.message}\nStderr: ${stderr}`);
          return;
        }
        resolve(`Stdout: ${stdout}\nStderr: ${stderr}`);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        resolve(`Invalid arguments: ${error.errors.map((e) => e.message).join(", ")}`);
      } else {
        resolve(`An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  });
}
