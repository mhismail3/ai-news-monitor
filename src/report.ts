export interface MonitorEvent {
  type: string;
  event_group_id: string;
  output: string;
  event_date?: string;
  source_urls?: string[];
}

export interface ReportBuildInput {
  events: MonitorEvent[];
  monitorId?: string;
  generatedAt?: Date;
}

function formatSources(sourceUrls: string[] = []): string {
  if (!sourceUrls.length) return "";
  const unique = Array.from(new Set(sourceUrls));
  const limited = unique.slice(0, 5);
  return `Sources: ${limited.join(", ")}`;
}

export function buildReport({
  events,
  monitorId,
  generatedAt = new Date(),
}: ReportBuildInput): string {
  const headlineDate = generatedAt.toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(`Daily AI Monitor — ${headlineDate}`);
  if (monitorId) {
    lines.push(`Monitor: ${monitorId}`);
  }
  lines.push(`Events detected: ${events.length}`);
  lines.push("");

  events.forEach((event, idx) => {
    const dateSuffix = event.event_date ? ` (${event.event_date})` : "";
    const description = event.output?.trim() || "No description provided";
    lines.push(`${idx + 1}. ${description}${dateSuffix}`);
    const sourcesLine = formatSources(event.source_urls);
    if (sourcesLine) {
      lines.push(`   ${sourcesLine}`);
    }
  });

  if (!events.length) {
    lines.push("No events returned for this run.");
  }

  lines.push("");
  lines.push("— Sent via Parallel Monitor");
  return lines.join("\n");
}

