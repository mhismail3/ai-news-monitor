import { execFile } from "node:child_process";

export interface IMessageOptions {
  recipient: string;
  message: string;
  dryRun?: boolean;
}

function escapeAppleScriptString(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function sendImessage({
  recipient,
  message,
  dryRun = false,
}: IMessageOptions): Promise<void> {
  if (!recipient) {
    throw new Error("IMESSAGE_RECIPIENT is required to send iMessage notifications.");
  }

  if (dryRun) {
    console.log(`[DRY RUN] Would send iMessage to ${recipient}:\n${message}`);
    return;
  }

  const escapedMessage = escapeAppleScriptString(message);
  const escapedRecipient = escapeAppleScriptString(recipient);
  const script = `
    tell application "Messages"
      set targetService to 1st service whose service type = iMessage
      set targetBuddy to buddy "${escapedRecipient}" of targetService
      send "${escapedMessage}" to targetBuddy
    end tell
  `;

  await new Promise<void>((resolve, reject) => {
    execFile("osascript", ["-e", script], (error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
}

