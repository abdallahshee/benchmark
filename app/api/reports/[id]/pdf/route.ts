import { getCurrentUser } from "@/lib/auth";
import { generateReportPdf } from "@/lib/pdf/report-pdf";
import { getReportDetails } from "@/lib/queries/report-details";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const plain = (message: string, status: number) =>
  new Response(message, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const user = await getCurrentUser();

  if (!user) {
    return plain("Please sign in.", 401);
  }

  const { id } = await params;

  // Any authenticated user can access any report.
  const report = await getReportDetails({ id });

  if (!report) {
    return plain("Report not found.", 404);
  }

  const bytes = await generateReportPdf(report);

  const day = new Date(report.createdAt).toISOString().slice(0, 10);

  const site =
    report.siteName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "site";

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="daily-report-${site}-${day}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}