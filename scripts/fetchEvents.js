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
const MONITOR_FILE = node_path_1.default.join(process.cwd(), ".monitor.json");
function loadMonitorId() {
    if (process.argv[2])
        return process.argv[2];
    if (process.env.MONITOR_ID)
        return process.env.MONITOR_ID;
    if (node_fs_1.default.existsSync(MONITOR_FILE)) {
        const raw = node_fs_1.default.readFileSync(MONITOR_FILE, "utf8");
        const data = JSON.parse(raw);
        return data.monitor_id;
    }
    return undefined;
}
async function fetchEventGroup(monitorId, eventGroupId) {
    const url = `https://api.parallel.ai/v1alpha/monitors/${monitorId}/event_groups/${eventGroupId}`;
    const response = await axios_1.default.get(url, {
        headers: { "x-api-key": PARALLEL_API_KEY },
    });
    return response.data;
}
async function fetchRecentEvents(monitorId) {
    const url = `https://api.parallel.ai/v1alpha/monitors/${monitorId}/events?lookback=10d`;
    const response = await axios_1.default.get(url, {
        headers: { "x-api-key": PARALLEL_API_KEY },
    });
    return response.data;
}
async function main() {
    if (!PARALLEL_API_KEY)
        throw new Error("PARALLEL_API_KEY is required");
    const monitorId = loadMonitorId();
    if (!monitorId)
        throw new Error("monitor_id not provided or found");
    const eventGroupId = process.argv[3];
    try {
        if (eventGroupId) {
            const data = await fetchEventGroup(monitorId, eventGroupId);
            console.log(JSON.stringify(data, null, 2));
        }
        else {
            try {
                const data = await fetchRecentEvents(monitorId);
                console.log(JSON.stringify(data, null, 2));
            }
            catch (innerError) {
                console.warn("Fetching recent events failed; provide an event_group_id as argv[3].");
                throw innerError;
            }
        }
    }
    catch (error) {
        console.error("Failed to fetch events", error?.response?.data || error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=fetchEvents.js.map