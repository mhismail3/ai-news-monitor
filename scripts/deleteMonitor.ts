import axios from "axios";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY || "";
const MONITOR_FILE = path.join(process.cwd(), ".monitor.json");

function loadMonitorId(): string | undefined {
  if (process.argv[2]) return process.argv[2];
  if (process.env.MONITOR_ID) return process.env.MONITOR_ID;
  if (fs.existsSync(MONITOR_FILE)) {
    const raw = fs.readFileSync(MONITOR_FILE, "utf8");
    const data = JSON.parse(raw);
    return data.monitor_id;
  }
  return undefined;
}

async function main() {
  if (!PARALLEL_API_KEY) throw new Error("PARALLEL_API_KEY is required");
  const monitorId = loadMonitorId();
  if (!monitorId) throw new Error("monitor_id not provided or found");

  const url = `https://api.parallel.ai/v1alpha/monitors/${monitorId}`;
  await axios.delete(url, {
    headers: {
      "x-api-key": PARALLEL_API_KEY,
    },
  });

  console.log(`Monitor ${monitorId} deleted.`);
  if (fs.existsSync(MONITOR_FILE)) {
    fs.unlinkSync(MONITOR_FILE);
    console.log(`Removed ${MONITOR_FILE}`);
  }
}

main().catch((error) => {
  console.error("Failed to delete monitor", error?.response?.data || error);
  process.exit(1);
});

