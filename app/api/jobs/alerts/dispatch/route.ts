import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { buildJobMatches } from "@/lib/server/job-copilot";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { normalizeResume } from "@/lib/resume";

export const runtime = "nodejs";

const shouldRunDigest = (frequency: "daily" | "weekly", lastDigestAt?: string) => {
  if (!lastDigestAt) return true;
  const last = new Date(lastDigestAt).getTime();
  if (Number.isNaN(last)) return true;
  const diffMs = Date.now() - last;
  const needed = frequency === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return diffMs >= needed;
};

const renderDigestHtml = (items: Array<{ title: string; company: string; location: string; score: number; url: string }>) => {
  const rows = items
    .map(
      (item) =>
        `<li style="margin:10px 0;"><strong>${item.title}</strong> at ${item.company} (${item.location}) - Match ${item.score}% - <a href="${item.url}">Apply</a></li>`
    )
    .join("");
  return `<div><h2>Your Resumio Job Copilot Digest</h2><p>Top role matches for your profile:</p><ul>${rows}</ul><p>Open Resumio to tailor and track applications.</p></div>`;
};

const sendEmailDigest = async (to: string, subject: string, html: string): Promise<boolean> => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  return response.ok;
};

export async function POST(request: NextRequest) {
  const cronSecret = process.env.COPILOT_CRON_SECRET;
  const incoming = request.headers.get("x-cron-secret") || "";
  if (!cronSecret || incoming !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  const prefsSnap = await db.collectionGroup("preferences").where("enabled", "==", true).get();
  let scanned = 0;
  let processed = 0;
  let emailed = 0;

  for (const prefDoc of prefsSnap.docs) {
    scanned += 1;
    const parent = prefDoc.ref.parent.parent;
    if (!parent || parent.id !== "copilot") continue;
    const uid = parent.parent?.id;
    if (!uid) continue;

    const pref = prefDoc.data() || {};
    const frequency: "daily" | "weekly" = pref.frequency === "weekly" ? "weekly" : "daily";
    if (!shouldRunDigest(frequency, typeof pref.lastDigestAt === "string" ? pref.lastDigestAt : undefined)) {
      continue;
    }

    const resumeRef = db.doc(`users/${uid}/resumes/default`);
    const resumeSnap = await resumeRef.get();
    if (!resumeSnap.exists) continue;

    const resumeData = resumeSnap.data() || {};
    if (!resumeData.resume) continue;

    const matches = await buildJobMatches(normalizeResume(resumeData.resume), {
      location: typeof pref.location === "string" ? pref.location : "",
      remoteOnly: pref.remoteOnly !== false,
      limit: 8,
    });

    const digestItems = matches.slice(0, 5).map((match) => ({
      title: match.job.title,
      company: match.job.company,
      location: match.job.location,
      score: match.matchScore,
      url: match.job.applyUrl,
    }));

    const digestId = new Date().toISOString().replace(/[^0-9TZ]/g, "");
    await db.doc(`users/${uid}/copilotDigests/${digestId}`).set({
      uid,
      frequency,
      to: pref.email || "",
      items: digestItems,
      generatedAt: new Date().toISOString(),
      serverGeneratedAt: FieldValue.serverTimestamp(),
    });

    processed += 1;

    if (typeof pref.email === "string" && pref.email.length > 3 && digestItems.length > 0) {
      const sent = await sendEmailDigest(
        pref.email,
        `Resumio Job Copilot ${frequency === "weekly" ? "Weekly" : "Daily"} Digest`,
        renderDigestHtml(digestItems)
      );
      if (sent) emailed += 1;
    }

    await prefDoc.ref.set(
      {
        lastDigestAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return NextResponse.json({ ok: true, scanned, processed, emailed });
}
