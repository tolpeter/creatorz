import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { ExternalLink, Flag } from "lucide-react";
import { db } from "@/lib/db";
import { reviews, brandProfiles, creatorProfiles, reports, users } from "@/lib/db/schema";
import { RatingStars } from "@/components/shared/rating-stars";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { ReportActions } from "@/components/admin/report-actions";
import { ReportReplyBox } from "@/components/admin/report-reply-box";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { formatHuDate } from "@/lib/utils/format";
import { REPORT_REASONS } from "@/lib/constants";

export const metadata = { title: "Admin — Bejelentések" };

const reasonLabel = (v: string) => REPORT_REASONS.find((r) => r.value === v)?.label ?? v;

export default async function AdminReportsPage() {
  const reporter = alias(users, "reporter");

  const [contentReports, reportedReviews] = await Promise.all([
    db
      .select({
        id: reports.id,
        targetType: reports.targetType,
        targetLabel: reports.targetLabel,
        targetUrl: reports.targetUrl,
        reason: reports.reason,
        note: reports.note,
        createdAt: reports.createdAt,
        reportedUserId: reports.reportedUserId,
        reporterUserId: reports.reporterUserId,
        reporterEmail: reporter.email,
      })
      .from(reports)
      .leftJoin(reporter, eq(reporter.id, reports.reporterUserId))
      .where(eq(reports.status, "open"))
      .orderBy(desc(reports.createdAt)),
    db
      .select({
        id: reviews.id,
        text: reviews.text,
        overallRating: reviews.overallRating,
        hidden: reviews.hidden,
        createdAt: reviews.createdAt,
        brandName: brandProfiles.companyName,
        creatorName: creatorProfiles.displayName,
      })
      .from(reviews)
      .innerJoin(brandProfiles, eq(brandProfiles.id, reviews.brandId))
      .innerJoin(creatorProfiles, eq(creatorProfiles.id, reviews.creatorId))
      .where(eq(reviews.reported, true))
      .orderBy(desc(reviews.createdAt)),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Bejelentések"
        icon={Flag}
        description={`${contentReports.length} nyitott tartalom-bejelentés · ${reportedReviews.length} bejelentett értékelés`}
      />

      {/* Tartalom-bejelentések (profil / kampány) */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Flag className="h-4 w-4 text-red-500" /> Tartalom-bejelentések
        </h2>
        {contentReports.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nincs nyitott bejelentés.
          </div>
        ) : (
          <div className="space-y-3">
            {contentReports.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                        {r.targetType === "creator" ? "Tartalomgyártó" : "Kampány"}
                      </span>
                      {r.targetUrl ? (
                        <Link href={r.targetUrl} target="_blank" className="inline-flex items-center gap-1 font-medium hover:underline">
                          {r.targetLabel ?? "Megnyitás"} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="font-medium">{r.targetLabel}</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm">
                      <strong className="text-red-600">{reasonLabel(r.reason)}</strong>
                      {r.note && <span className="text-muted-foreground"> — {r.note}</span>}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Bejelentő: {r.reporterEmail ?? "ismeretlen"} · {formatHuDate(r.createdAt)}
                    </p>
                  </div>
                  <ReportActions reportId={r.id} reportedUserId={r.reportedUserId} />
                </div>
                <ReportReplyBox
                  reporterUserId={r.reporterUserId}
                  reporterEmail={r.reporterEmail}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bejelentett értékelések */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Bejelentett értékelések</h2>
        {reportedReviews.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nincs bejelentett értékelés.
          </div>
        ) : (
          <div className="space-y-3">
            {reportedReviews.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm">
                      <strong>{r.brandName}</strong> → {r.creatorName} · {formatHuDate(r.createdAt)}
                    </p>
                    <RatingStars rating={r.overallRating} />
                  </div>
                  <ReviewModerationActions reviewId={r.id} hidden={r.hidden} />
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
