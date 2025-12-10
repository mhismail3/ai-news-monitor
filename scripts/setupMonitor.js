"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
dotenv_1.default.config();
const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY || "";
const WEBHOOK_URL = process.env.WEBHOOK_URL || "";
const MONITOR_FILE = node_path_1.default.join(process.cwd(), ".monitor.json");
async function main() {
    if (!PARALLEL_API_KEY) {
        throw new Error("PARALLEL_API_KEY is required");
    }
    if (!WEBHOOK_URL) {
        throw new Error("WEBHOOK_URL is required");
    }
    const query = "Latest AI news about OpenAI, Anthropic (Claude), Google Gemini, xAI Grok, Nvidia, and broader AI/tech industry; focus on material updates, launches, funding, regulatory, key product changes; provide concise summaries with source links.";
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
    const response = await axios_1.default.post("https://api.parallel.ai/v1alpha/monitors", payload, {
        headers: {
            "Content-Type": "application/json",
            "x-api-key": PARALLEL_API_KEY,
        },
    });
    const data = response.data;
    node_fs_1.default.writeFileSync(MONITOR_FILE, JSON.stringify({
        monitor_id: data.monitor_id,
        query: data.query,
        cadence: data.cadence,
        webhook_url: WEBHOOK_URL,
        created_at: data.created_at,
    }, null, 2));
    console.log("Monitor created:");
    console.log(JSON.stringify(data, null, 2));
    console.log(`Saved monitor_id to ${MONITOR_FILE}`);
}
main().catch((error) => {
    console.error("Failed to create monitor", error?.response?.data || error);
    process.exit(1);
});
//# sourceMappingURL=setupMonitor.js.map