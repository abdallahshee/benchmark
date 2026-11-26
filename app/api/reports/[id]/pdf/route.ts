import { getCurrentUser } from "@/lib/auth";
import { generateReportPdf } from "@/lib/pdf/report-pdf";
import { getReportDetails, type ReportDetails } from "@/lib/queries/report-details";
import { PDF_STATUSES } from "@/lib/report-access";

type RouteContext = { params: Promise<{ id: string }> };

const plain = (message: string, status: number) =>
  new Response(message, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return plain("Please sign in.", 401);

  const { id } = await params;

  // The admin may open any site's report; the foreman and secretary only their own
  // site's, taken from their profile and never from the URL.
  let report: ReportDetails | null;
  if (user.role === "admin") {
    report = await getReportDetails({ id, allowed: PDF_STATUSES });
  } else if ((user.role === "foreman" || user.role === "secretary") && user.siteId) {
    report = await getReportDetails({ id, allowed: PDF_STATUSES, siteId: user.siteId });
  } else {
    return plain("You don't have access to reports.", 403);
  }
  // Not approved, another site's report and a wrong id all look the same.
  if (!report) return plain("Report not found.", 404);

  const bytes = await generateReportPdf(report);

  const day = new Date(report.createdAt).toISOString().slice(0, 10);
  const site =
    report.siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "site";

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="daily-report-${site}-${day}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}