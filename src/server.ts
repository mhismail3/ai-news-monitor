import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { buildReport, MonitorEvent } from "./report";
import { sendImessage } from "./imessage";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY || "";
const IMESSAGE_RECIPIENT = process.env.IMESSAGE_RECIPIENT || "";
const DRY_RUN = (process.env.DRY_RUN || "").toLowerCase() === "true";

const MONITOR_FILE = path.join(process.cwd(), ".monitor.json");
const processedEventGroups = new Set<string>();

function loadMonitorId(): string | undefined {
  if (process.env.MONITOR_ID) return process.env.MONITOR_ID;
  if (!fs.existsSync(MONITOR_FILE)) return undefined;
  try {
    const raw = fs.readFileSync(MONITOR_FILE, "utf8");
    const data = JSON.parse(raw);
    return data.monitor_id as string | undefined;
  } catch (error) {
    console.warn("Could not read .monitor.json", error);
    return undefined;
  }
}

function extractEventGroupId(body: any): string | undefined {
  return (
    body?.event_group_id ||
    body?.data?.event_group_id ||
    body?.event_group?.id ||
    body?.event_group?.event_group_id
  );
}

async function fetchEventGroup(
  monitorId: string,
  eventGroupId: string
): Promise<MonitorEvent[]> {
  const url = `https://api.parallel.ai/v1alpha/monitors/${monitorId}/event_groups/${eventGroupId}`;
  const response = await axios.get(url, {
    headers: {
      "x-api-key": PARALLEL_API_KEY,
    },
  });
  return response.data?.events || [];
}

async function handleEventsAndNotify(
  monitorId: string,
  eventGroupId: string
): Promise<string> {
  const events = await fetchEventGroup(monitorId, eventGroupId);
  const report = buildReport({ events, monitorId });
  await sendImessage({
    recipient: IMESSAGE_RECIPIENT,
    message: report,
    dryRun: DRY_RUN,
  });
  return report;
}

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    monitor_id: loadMonitorId() || null,
    dry_run: DRY_RUN,
  });
});

app.post("/webhook", async (req, res) => {
  if (!PARALLEL_API_KEY) {
    return res.status(500).json({ error: "PARALLEL_API_KEY is not set" });
  }
  if (!IMESSAGE_RECIPIENT && !DRY_RUN) {
    return res.status(400).json({ error: "IMESSAGE_RECIPIENT is required" });
  }

  const monitorId = req.body?.monitor_id || loadMonitorId();
  const eventGroupId = extractEventGroupId(req.body);

  if (!monitorId) {
    return res.status(400).json({ error: "monitor_id is missing" });
  }
  if (!eventGroupId) {
    return res.status(400).json({ error: "event_group_id is missing" });
  }
  if (processedEventGroups.has(eventGroupId)) {
    return res.status(200).json({ status: "skipped", reason: "duplicate" });
  }

  try {
    const report = await handleEventsAndNotify(monitorId, eventGroupId);
    processedEventGroups.add(eventGroupId);
    return res.json({ status: "sent", event_group_id: eventGroupId, dry_run: DRY_RUN, monitor_id: monitorId, preview: report });
  } catch (error: any) {
    console.error("Failed to process webhook", error?.response?.data || error);
    return res.status(500).json({
      error: "Failed to process webhook",
      details: error?.message || "Unknown error",
    });
  }
});

app.post("/test/notify", async (_req, res) => {
  const monitorId = loadMonitorId() || "test-monitor";
  const sampleEvents: MonitorEvent[] = [
    {
      type: "event",
      event_group_id: "sample-1",
      output: "OpenAI announces a new multimodal update for GPT models.",
      event_date: "2025-12-10",
      source_urls: ["https://openai.com/blog", "https://example.com/news1"],
    },
    {
      type: "event",
      event_group_id: "sample-1",
      output: "Anthropic expands Claude context window and partners with major cloud provider.",
      source_urls: ["https://www.anthropic.com/news"],
    },
  ];

  const report = buildReport({ events: sampleEvents, monitorId });
  try {
    await sendImessage({
      recipient: IMESSAGE_RECIPIENT,
      message: report,
      dryRun: DRY_RUN,
    });
    return res.json({ status: "sent", dry_run: DRY_RUN, preview: report });
  } catch (error: any) {
    console.error("Test notify failed", error);
    return res.status(500).json({ error: "Test notify failed", details: error?.message });
  }
});

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT} (dryRun=${DRY_RUN})`);
});

