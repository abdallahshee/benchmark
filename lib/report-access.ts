import type { ReportStatus } from "@/db/schema";

// Which report statuses each role may see. The list pages and the details pages share it.
export const REPORT_VISIBILITY = {
  admin: ["approved", "rejected"],
  secretary: [ "approved", "rejected"],
  foreman: ["draft", "approved", "rejected"],
} as const satisfies Record<string, readonly ReportStatus[]>;