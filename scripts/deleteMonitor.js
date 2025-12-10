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
async function main() {
    if (!PARALLEL_API_KEY)
        throw new Error("PARALLEL_API_KEY is required");
    const monitorId = loadMonitorId();
    if (!monitorId)
        throw new Error("monitor_id not provided or found");
    const url = `https://api.parallel.ai/v1alpha/monitors/${monitorId}`;
    await axios_1.default.delete(url, {
        headers: {
            "x-api-key": PARALLEL_API_KEY,
        },
    });
    console.log(`Monitor ${monitorId} deleted.`);
    if (node_fs_1.default.existsSync(MONITOR_FILE)) {
        node_fs_1.default.unlinkSync(MONITOR_FILE);
        console.log(`Removed ${MONITOR_FILE}`);
    }
}
main().catch((error) => {
    console.error("Failed to delete monitor", error?.response?.data || error);
    process.exit(1);
});
//# sourceMappingURL=deleteMonitor.js.map