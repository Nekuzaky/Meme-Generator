import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  API_TOKEN_KEY,
  getPublicMemeApi,
  reportMemeApi,
  type ApiMeme,
} from "../lib/api";
import AdBanner from "../components/AdBanner";
import { useLanguage } from "../context/LanguageContext";

type SharePayload = {
  version: 1;
  activeImageUrl: string;
  activeImageName: string;
  boxesCount: number;
  boxes: {
    index: number;
    text: string;
    color: string;
    outline_color: string;
    fontSize: number;
    fontFamily: string;
    effect: "none" | "arc" | "shake" | "outline" | "gradient";
  }[];
  textLayers: {
    id: string;
    index: number;
    locked: boolean;
    zIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  stickers: {
    id: string;
    emoji?: string;
    src?: string;
    kind: "emoji" | "image";
    x: number;
    y: number;
    size: number;
    locked: boolean;
    zIndex: number;
  }[];
};

const SHARE_QUERY_KEY = "memeShare";

const encodeSharePayload = (payload: SharePayload) =>
  encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));

const upsertMeta = (selector: string, attr: "content" | "href", value: string) => {
  let el = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!el) {
    if (selector.startsWith('meta[property="og:')) {
      const property = selector.split('"')[1];
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      document.head.appendChild(meta);
      el = meta;
    } else if (selector.startsWith('meta[name="')) {
      const name = selector.split('"')[1];
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      document.head.appendChild(meta);
      el = meta;
    } else if (selector === 'link[rel="canonical"]') {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
      el = link;
    }
  }
  if (el) {
    el.setAttribute(attr, value);
  }
};

const buildFallbackSharePayload = (meme: ApiMeme): SharePayload | null => {
  const image = meme.source_image_url || meme.generated_image_url || "";
  if (!image) return null;
  return {
    version: 1,
    activeImageUrl: image,
    activeImageName: meme.title || "meme",
    boxesCount: 2,
    boxes: [
      {
        index: 0,
        text: meme.title || "",
        color: "#ffffff",
        outline_color: "#111111",
        fontSize: 50,
        fontFamily: "Impact",
        effect: "none",
      },
      {
        index: 1,
        text: "",
        color: "#ffffff",
        outline_color: "#111111",
        fontSize: 50,
        fontFamily: "Impact",
        effect: "none",
      },
    ],
    textLayers: [
      { id: "text-0", index: 0, locked: false, zIndex: 1, x: 20, y: 20, width: 220, height: 110 },
      { id: "text-1", index: 1, locked: false, zIndex: 2, x: 20, y: 110, width: 220, height: 110 },
    ],
    stickers: [],
  };
};

const toSharePayload = (meme: ApiMeme): SharePayload | null => {
  const payload = meme.payload as Partial<SharePayload> | null | undefined;
  if (
    payload &&
    payload.version === 1 &&
    typeof payload.activeImageUrl === "string" &&
    Array.isArray(payload.boxes) &&
    Array.isArray(payload.textLayers) &&
    Array.isArray(payload.stickers)
  ) {
    return payload as SharePayload;
  }
  return buildFallbackSharePayload(meme);
};

export default function PublicMeme() {
  const { language } = useLanguage();
  const params = useParams();
  const navigate = useNavigate();
  const [meme, setMeme] = useState<ApiMeme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  const id = params.id ? Number(params.id) : NaN;
  const labels = useMemo(
    () =>
      language === "fr"
        ? {
            title: "Meme public",
            remix: "Remixer ce meme",
            report: "Signaler",
            copy: "Copier le lien",
            back: "Retour au createur",
            reportSent: "Signalement envoye.",
            needLogin: "Connecte-toi pour signaler un contenu.",
            notFound: "Meme introuvable ou prive.",
            loading: "Chargement...",
            reason: "Raison",
            details: "Details",
            submitReport: "Envoyer le signalement",
          }
        : {
            title: "Public meme",
            remix: "Remix this meme",
            report: "Report",
            copy: "Copy link",
            back: "Back to creator",
            reportSent: "Report submitted.",
            needLogin: "Sign in to report content.",
            notFound: "Meme not found or private.",
            loading: "Loading...",
            reason: "Reason",
            details: "Details",
            submitReport: "Submit report",
          },
    [language]
  );

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError(labels.notFound);
      setLoading(false);
      return;
    }

    setLoading(true);
    getPublicMemeApi(id)
      .then((res) => {
        setMeme(res.item);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : labels.notFound);
      })
      .finally(() => setLoading(false));
  }, [id, labels.notFound]);

  useEffect(() => {
    if (!meme) return;
    const title = `${meme.title} | Meme Creator`;
    const description =
      meme.description?.slice(0, 140) ||
      `${meme.username ?? "Creator"} shared a public meme. Remix it in one click.`;
    const image = meme.generated_image_url || meme.source_image_url || "https://meme.altcore.fr/logo.png";
    const url = `${window.location.origin}/m/${meme.id}`;

    document.title = title;
    upsertMeta('meta[name="description"]', "content", description);
    upsertMeta('meta[property="og:title"]', "content", title);
    upsertMeta('meta[property="og:description"]', "content", description);
    upsertMeta('meta[property="og:image"]', "content", image);
    upsertMeta('meta[property="og:url"]', "content", url);
    upsertMeta('meta[name="twitter:title"]', "content", title);
    upsertMeta('meta[name="twitter:description"]', "content", description);
    upsertMeta('meta[name="twitter:image"]', "content", image);
    upsertMeta('link[rel="canonical"]', "href", url);
  }, [meme]);

  const remixUrl = useMemo(() => {
    if (!meme) return "";
    const payload = toSharePayload(meme);
    if (!payload) return "";
    return `/creator?${SHARE_QUERY_KEY}=${encodeSharePayload(payload)}`;
  }, [meme]);

  const currentUrl = useMemo(() => {
    if (!meme) return "";
    return `${window.location.origin}/m/${meme.id}`;
  }, [meme]);

  const report = async () => {
    if (!meme) return;
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (!token) {
      setReportStatus(labels.needLogin);
      return;
    }

    try {
      await reportMemeApi(
        meme.id,
        {
          reason: reportReason,
          details: reportDetails,
        },
        token
      );
      setReportStatus(labels.reportSent);
      setReportDetails("");
    } catch (err) {
      setReportStatus(err instanceof Error ? err.message : labels.notFound);
    }
  };

  if (loading) {
    return (
      <section className="glass-card w-full p-6 md:p-8">
        <p className="text-sm text-slate-300">{labels.loading}</p>
      </section>
    );
  }

  if (error || !meme) {
    return (
      <section className="glass-card w-full p-6 md:p-8">
        <p className="text-sm text-rose-300">{error || labels.notFound}</p>
        <div className="mt-4">
          <Link
            to="/creator"
            className="inline-flex rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100"
          >
            {labels.back}
          </Link>
        </div>
      </section>
    );
  }

  const image = meme.generated_image_url || meme.source_image_url || "";

  return (
    <section className="glass-card w-full p-6 md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
            {labels.title}
          </p>
          <h1 className="rgb-text text-2xl md:text-4xl">{meme.title}</h1>
          <p className="text-sm text-slate-300">
            {meme.description || `${meme.username ?? "Creator"} shared this meme.`}
          </p>
        </div>

        {image ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
            <img
              src={image}
              alt={meme.title}
              className="max-h-[560px] w-full object-contain"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => remixUrl && navigate(remixUrl)}
            disabled={!remixUrl}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            {labels.remix}
          </button>
          <button
            type="button"
            onClick={() => currentUrl && navigator.clipboard.writeText(currentUrl)}
            className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60"
          >
            {labels.copy}
          </button>
          <Link
            to="/creator"
            className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60"
          >
            {labels.back}
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <p className="text-sm font-semibold text-slate-100">{labels.report}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={labels.reason}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            />
            <input
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder={labels.details}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={report}
              className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100"
            >
              {labels.submitReport}
            </button>
            {reportStatus ? <p className="text-xs text-slate-300">{reportStatus}</p> : null}
          </div>
        </div>

        <AdBanner slot="5741036671" />
      </div>
    </section>
  );
}
