import { useEffect, useMemo, useState } from "react";
import {
  createModerationBlacklistApi,
  deleteModerationBlacklistApi,
  getModerationBlacklistApi,
  getModerationMemesApi,
  getModerationReportsApi,
  moderateMemeApi,
  reviewModerationReportApi,
  type ApiBlacklistTerm,
  type ApiMeme,
  type ApiModerationReport,
} from "../lib/api";

type AdminModerationPanelProps = {
  token: string;
  language: string;
  onError: (message: string) => void;
};

type MemeStatus = "pending" | "approved" | "rejected";
type ReportStatus = "open" | "reviewed" | "dismissed" | "all";

export default function AdminModerationPanel({
  token,
  language,
  onError,
}: AdminModerationPanelProps) {
  const labels = useMemo(
    () =>
      language === "fr"
        ? {
            title: "Dashboard moderation admin",
            subtitle: "Gere les memes publics, signalements et termes bloques.",
            tabs: {
              memes: "Memes",
              reports: "Signalements",
              blacklist: "Blacklist",
            },
            loading: "Chargement...",
            empty: "Aucun element.",
            memesStatus: "Filtre statut",
            reportsStatus: "Filtre signalements",
            approve: "Approuver",
            reject: "Rejeter",
            pending: "Mettre en attente",
            review: "Marquer reviewed",
            dismiss: "Dismiss",
            reopen: "Reouvrir",
            reason: "Raison moderation (optionnelle)",
            reportNote: "Note resolution (optionnelle)",
            reportReason: "Raison",
            reportDetails: "Details",
            reporter: "Reporter",
            meme: "Meme",
            createdAt: "Cree le",
            addTerm: "Ajouter terme",
            add: "Ajouter",
            remove: "Supprimer",
            termPlaceholder: "mot ou expression a bloquer",
            approveMeme: "Approuver le meme",
            rejectMeme: "Rejeter le meme",
          }
        : {
            title: "Admin moderation dashboard",
            subtitle: "Manage public memes, reports, and blocked terms.",
            tabs: {
              memes: "Memes",
              reports: "Reports",
              blacklist: "Blacklist",
            },
            loading: "Loading...",
            empty: "No items.",
            memesStatus: "Status filter",
            reportsStatus: "Reports filter",
            approve: "Approve",
            reject: "Reject",
            pending: "Set pending",
            review: "Mark reviewed",
            dismiss: "Dismiss",
            reopen: "Reopen",
            reason: "Moderation reason (optional)",
            reportNote: "Resolution note (optional)",
            reportReason: "Reason",
            reportDetails: "Details",
            reporter: "Reporter",
            meme: "Meme",
            createdAt: "Created",
            addTerm: "Add term",
            add: "Add",
            remove: "Remove",
            termPlaceholder: "word or phrase to block",
            approveMeme: "Approve meme",
            rejectMeme: "Reject meme",
          },
    [language]
  );

  const [tab, setTab] = useState<"memes" | "reports" | "blacklist">("memes");
  const [memeStatus, setMemeStatus] = useState<MemeStatus>("pending");
  const [reportStatus, setReportStatus] = useState<ReportStatus>("open");
  const [memes, setMemes] = useState<ApiMeme[]>([]);
  const [reports, setReports] = useState<ApiModerationReport[]>([]);
  const [blacklist, setBlacklist] = useState<ApiBlacklistTerm[]>([]);
  const [newBlacklistTerm, setNewBlacklistTerm] = useState("");
  const [memeReasons, setMemeReasons] = useState<Record<number, string>>({});
  const [reportNotes, setReportNotes] = useState<Record<number, string>>({});
  const [loadingMemes, setLoadingMemes] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);

  const loadMemes = async () => {
    try {
      setLoadingMemes(true);
      const response = await getModerationMemesApi(token, {
        status: memeStatus,
        limit: 40,
      });
      setMemes(response.items);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load moderation memes");
    } finally {
      setLoadingMemes(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const response = await getModerationReportsApi(token, {
        status: reportStatus,
        limit: 60,
      });
      setReports(response.items);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  };

  const loadBlacklist = async () => {
    try {
      setLoadingBlacklist(true);
      const response = await getModerationBlacklistApi(token);
      setBlacklist(response.items);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load blacklist");
    } finally {
      setLoadingBlacklist(false);
    }
  };

  useEffect(() => {
    void loadMemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, memeStatus]);

  useEffect(() => {
    void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, reportStatus]);

  useEffect(() => {
    void loadBlacklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const moderateMeme = async (id: number, status: MemeStatus) => {
    try {
      await moderateMemeApi(token, id, {
        status,
        reason: memeReasons[id]?.trim() || undefined,
      });
      setMemes((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to update meme moderation");
    }
  };

  const moderateFromReport = async (report: ApiModerationReport, status: MemeStatus) => {
    try {
      await moderateMemeApi(token, report.meme_id, {
        status,
        reason:
          reportNotes[report.id]?.trim() ||
          `Action from report #${report.id}`,
      });
      await reviewModerationReportApi(token, report.id, {
        status: "reviewed",
        resolution_note:
          reportNotes[report.id]?.trim() || `Meme set to ${status}`,
      });
      setReports((prev) =>
        prev.map((item) =>
          item.id === report.id ? { ...item, status: "reviewed" } : item
        )
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to moderate from report");
    }
  };

  const updateReport = async (id: number, status: "open" | "reviewed" | "dismissed") => {
    try {
      await reviewModerationReportApi(token, id, {
        status,
        resolution_note: reportNotes[id]?.trim() || undefined,
      });
      setReports((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to update report");
    }
  };

  const addBlacklistTerm = async () => {
    const term = newBlacklistTerm.trim().toLowerCase();
    if (!term) return;
    try {
      await createModerationBlacklistApi(token, { term });
      setNewBlacklistTerm("");
      await loadBlacklist();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to add blacklist term");
    }
  };

  const removeBlacklistTerm = async (id: number) => {
    try {
      await deleteModerationBlacklistApi(token, id);
      setBlacklist((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to remove blacklist term");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-sm font-semibold text-slate-100">{labels.title}</p>
      <p className="mt-1 text-xs text-slate-400">{labels.subtitle}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("memes")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tab === "memes"
              ? "bg-fuchsia-500/20 text-fuchsia-100"
              : "border border-white/10 bg-slate-950/70 text-slate-300"
          }`}
        >
          {labels.tabs.memes}
        </button>
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tab === "reports"
              ? "bg-fuchsia-500/20 text-fuchsia-100"
              : "border border-white/10 bg-slate-950/70 text-slate-300"
          }`}
        >
          {labels.tabs.reports}
        </button>
        <button
          type="button"
          onClick={() => setTab("blacklist")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tab === "blacklist"
              ? "bg-fuchsia-500/20 text-fuchsia-100"
              : "border border-white/10 bg-slate-950/70 text-slate-300"
          }`}
        >
          {labels.tabs.blacklist}
        </button>
      </div>

      {tab === "memes" && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{labels.memesStatus}</span>
            <select
              value={memeStatus}
              onChange={(event) => setMemeStatus(event.target.value as MemeStatus)}
              className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-slate-100"
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
          {loadingMemes ? (
            <p className="text-xs text-slate-400">{labels.loading}</p>
          ) : memes.length === 0 ? (
            <p className="text-xs text-slate-400">{labels.empty}</p>
          ) : (
            <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
              {memes.map((meme) => (
                <div
                  key={meme.id}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-200"
                >
                  <p className="truncate font-semibold text-slate-100">{meme.title}</p>
                  <p className="mt-1 text-slate-400">
                    #{meme.id} · {meme.username ?? "unknown"} · {meme.moderation_status}
                  </p>
                  <input
                    value={memeReasons[meme.id] ?? ""}
                    onChange={(event) =>
                      setMemeReasons((prev) => ({
                        ...prev,
                        [meme.id]: event.target.value,
                      }))
                    }
                    placeholder={labels.reason}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 outline-none"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moderateMeme(meme.id, "approved")}
                      className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-200"
                    >
                      {labels.approve}
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateMeme(meme.id, "pending")}
                      className="rounded-full border border-amber-300/40 bg-amber-500/10 px-2 py-1 font-semibold text-amber-200"
                    >
                      {labels.pending}
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateMeme(meme.id, "rejected")}
                      className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-1 font-semibold text-rose-200"
                    >
                      {labels.reject}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{labels.reportsStatus}</span>
            <select
              value={reportStatus}
              onChange={(event) => setReportStatus(event.target.value as ReportStatus)}
              className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-slate-100"
            >
              <option value="open">open</option>
              <option value="reviewed">reviewed</option>
              <option value="dismissed">dismissed</option>
              <option value="all">all</option>
            </select>
          </div>
          {loadingReports ? (
            <p className="text-xs text-slate-400">{labels.loading}</p>
          ) : reports.length === 0 ? (
            <p className="text-xs text-slate-400">{labels.empty}</p>
          ) : (
            <div className="flex max-h-[30rem] flex-col gap-2 overflow-y-auto pr-1">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-200"
                >
                  <p className="font-semibold text-slate-100">
                    {labels.reportReason}: {report.reason}
                  </p>
                  {report.details ? (
                    <p className="mt-1 text-slate-300">
                      {labels.reportDetails}: {report.details}
                    </p>
                  ) : null}
                  <p className="mt-1 text-slate-400">
                    {labels.reporter}: {report.reporter_username ?? "anonymous"}
                  </p>
                  <p className="text-slate-400">
                    {labels.meme}: #{report.meme_id} · {report.title ?? "Untitled"}
                  </p>
                  <p className="text-slate-400">
                    {labels.createdAt}: {new Date(report.created_at).toLocaleString()}
                  </p>
                  <p className="text-slate-400">status: {report.status}</p>

                  <input
                    value={reportNotes[report.id] ?? ""}
                    onChange={(event) =>
                      setReportNotes((prev) => ({
                        ...prev,
                        [report.id]: event.target.value,
                      }))
                    }
                    placeholder={labels.reportNote}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 outline-none"
                  />

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateReport(report.id, "reviewed")}
                      className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-2 py-1 font-semibold text-cyan-200"
                    >
                      {labels.review}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReport(report.id, "dismissed")}
                      className="rounded-full border border-slate-300/40 bg-slate-500/10 px-2 py-1 font-semibold text-slate-200"
                    >
                      {labels.dismiss}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReport(report.id, "open")}
                      className="rounded-full border border-amber-300/40 bg-amber-500/10 px-2 py-1 font-semibold text-amber-200"
                    >
                      {labels.reopen}
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateFromReport(report, "approved")}
                      className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-200"
                    >
                      {labels.approveMeme}
                    </button>
                    <button
                      type="button"
                      onClick={() => moderateFromReport(report, "rejected")}
                      className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-1 font-semibold text-rose-200"
                    >
                      {labels.rejectMeme}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "blacklist" && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={newBlacklistTerm}
              onChange={(event) => setNewBlacklistTerm(event.target.value)}
              placeholder={labels.termPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none"
            />
            <button
              type="button"
              onClick={addBlacklistTerm}
              className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100"
            >
              {labels.add}
            </button>
          </div>
          {loadingBlacklist ? (
            <p className="text-xs text-slate-400">{labels.loading}</p>
          ) : blacklist.length === 0 ? (
            <p className="text-xs text-slate-400">{labels.empty}</p>
          ) : (
            <div className="flex max-h-[24rem] flex-col gap-2 overflow-y-auto pr-1">
              {blacklist.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
                >
                  <span>{term.term}</span>
                  <button
                    type="button"
                    onClick={() => removeBlacklistTerm(term.id)}
                    className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-1 font-semibold text-rose-200"
                  >
                    {labels.remove}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
