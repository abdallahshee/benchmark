import { getCurrentUser } from "@/lib/auth";
import { generateReportPdf } from "@/lib/pdf/report-pdf";
import { getReportDetails, type ReportDetails } from "@/lib/queries/report-details";

type RouteContext = { params: Promise<{ reportId: string }> };

const plain = (message: string, status: number) =>
  new Response(message, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return plain("Please sign in.", 401);

  const { reportId } = await params;

  // The admin may open any site's report; the foreman and secretary only their own
  // site's, taken from their profile and never from the URL.
  let report: ReportDetails | null;
  if (user.role === "admin") {
    report = await getReportDetails({ reportId });
  } else if ((user.role === "foreman" || user.role === "secretary") && user.siteId) {
    report = await getReportDetails({ reportId, siteId: user.siteId });
  } else {
    return plain("You don't have access to reports.", 403);
  }

//   console.log("PDF download debug:", {
//   reportId,
//   userRole: user.role,
//   userSiteId: user.siteId,
//   reportFound: Boolean(report),
// });



  // Another site's report and a wrong id look the same, so ids can't be probed.
  if (!report) return plain("Report not found.", 404);

  const bytes = await generateReportPdf(report);

  // The report's day in the site's time zone (en-CA formats as YYYY-MM-DD).
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(
    report.createdAt,
  );
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