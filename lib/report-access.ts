import type { ReportStatus } from "@/db/schema";

// Which report statuses each role may see. The list pages and the details pages share it.
export const REPORT_VISIBILITY = {
  admin: ["submitted","approved", "rejected"],
  secretary: ["submitted", "approved", "rejected"],
  foreman: ["submitted", "approved", "rejected"],
} as const satisfies Record<string, readonly ReportStatus[]>;

// Only approved reports can be downloaded as a PDF.
export const PDF_STATUSES = ["approved"] as const satisfies readonly ReportStatus[];

export const canDownloadPdf = (status: string) =>
  (PDF_STATUSES as readonly string[]).includes(status);