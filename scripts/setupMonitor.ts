import axios from "axios";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY || "";
const WEBHOOK_URL = process.env.WEBHOOK_URL || "";
const MONITOR_FILE = path.join(process.cwd(), ".monitor.json");

async function main() {
  if (!PARALLEL_API_KEY) {
    throw new Error("PARALLEL_API_KEY is required");
  }
  if (!WEBHOOK_URL) {
    throw new Error("WEBHOOK_URL is required");
  }

  const query =
    "Latest AI news about OpenAI, Anthropic (Claude), Google Gemini, xAI Grok, Nvidia, and broader AI/tech industry; focus on material updates, launches, funding, regulatory, key product changes; provide concise summaries with source links.";

  const payload = {
    query,
    cadence: "daily",
    webhook: {
      url: WEBHOOK_URL,
      event_types: ["monitor.event.detected"],
    },
    metadata: {
      source: "ai-news-monitor",
    },
  };

  const response = await axios.post(
    "https://api.parallel.ai/v1alpha/monitors",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PARALLEL_API_KEY,
      },
    }
  );

  const data = response.data;
  fs.writeFileSync(
    MONITOR_FILE,
    JSON.stringify(
      {
        monitor_id: data.monitor_id,
        query: data.query,
        cadence: data.cadence,
        webhook_url: WEBHOOK_URL,
        created_at: data.created_at,
      },
      null,
      2
    )
  );

  console.log("Monitor created:");
  console.log(JSON.stringify(data, null, 2));
  console.log(`Saved monitor_id to ${MONITOR_FILE}`);
}

main().catch((error) => {
  console.error("Failed to create monitor", error?.response?.data || error);
  process.exit(1);
});

