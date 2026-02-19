import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  API_TOKEN_KEY,
  deleteMemeApi,
  getMeApi,
  getModerationMemesApi,
  getMyMemesApi,
  loginApi,
  moderateMemeApi,
  logoutApi,
  registerApi,
  updateMemeApi,
  type ApiMeme,
  type ApiUser,
} from "../lib/api";

export default function Profile() {
  const { language } = useLanguage();
  const labels = useMemo(
    () =>
      language === "fr"
        ? {
            title: "Profil",
            subtitle: "Inscris-toi pour sauvegarder et gerer tes memes.",
            login: "Connexion",
            register: "Inscription",
            username: "Nom d'utilisateur",
            email: "Email",
            password: "Mot de passe",
            submitLogin: "Se connecter",
            submitRegister: "Creer un compte",
            logout: "Se deconnecter",
            totalMemes: "Memes sauvegardes",
            publicMemes: "Memes publics",
            mine: "Mes memes",
            empty: "Aucun meme sauvegarde pour le moment.",
            makePublic: "Rendre public",
            makePrivate: "Rendre prive",
            delete: "Supprimer",
            loading: "Chargement...",
            authError: "Impossible de se connecter pour le moment.",
            profileError: "Impossible de charger le profil.",
            moderation: "Moderation",
            moderationEmpty: "Aucun contenu en attente.",
            approve: "Approuver",
            reject: "Rejeter",
            status: "Statut",
          }
        : {
            title: "Profile",
            subtitle: "Create an account to save and manage your memes.",
            login: "Login",
            register: "Register",
            username: "Username",
            email: "Email",
            password: "Password",
            submitLogin: "Sign in",
            submitRegister: "Create account",
            logout: "Sign out",
            totalMemes: "Saved memes",
            publicMemes: "Public memes",
            mine: "My memes",
            empty: "No saved memes yet.",
            makePublic: "Make public",
            makePrivate: "Make private",
            delete: "Delete",
            loading: "Loading...",
            authError: "Unable to authenticate right now.",
            profileError: "Unable to load profile.",
            moderation: "Moderation",
            moderationEmpty: "No content pending review.",
            approve: "Approve",
            reject: "Reject",
            status: "Status",
          },
    [language]
  );

  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [stats, setStats] = useState<{ total_memes: number; public_memes: number } | null>(
    null
  );
  const [memes, setMemes] = useState<ApiMeme[]>([]);
  const [moderationQueue, setModerationQueue] = useState<ApiMeme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModerationLoading, setIsModerationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (activeToken: string) => {
    const [me, mine] = await Promise.all([getMeApi(activeToken), getMyMemesApi(activeToken)]);
    setUser(me.user);
    setStats(me.stats);
    setMemes(mine.items);
    if (me.user.is_admin) {
      setIsModerationLoading(true);
      try {
        const moderation = await getModerationMemesApi(activeToken, { status: "pending", limit: 20 });
        setModerationQueue(moderation.items);
      } finally {
        setIsModerationLoading(false);
      }
    } else {
      setModerationQueue([]);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(API_TOKEN_KEY);
    if (!stored) return;
    setToken(stored);
    setIsLoading(true);
    loadProfile(stored)
      .catch(() => {
        localStorage.removeItem(API_TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response =
        mode === "register"
          ? await registerApi({ username, email, password })
          : await loginApi({ email, password });
      localStorage.setItem(API_TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      setPassword("");
      await loadProfile(response.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.authError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!token) return;
    try {
      await logoutApi(token);
    } catch {
      // ignore logout failure
    }
    localStorage.removeItem(API_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStats(null);
    setMemes([]);
    setModerationQueue([]);
  };

  const toggleVisibility = async (meme: ApiMeme) => {
    if (!token) return;
    try {
      await updateMemeApi(token, meme.id, { is_public: !meme.is_public });
      setMemes((prev) =>
        prev.map((item) =>
          item.id === meme.id ? { ...item, is_public: !item.is_public } : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.profileError);
    }
  };

  const removeMeme = async (id: number) => {
    if (!token) return;
    try {
      await deleteMemeApi(token, id);
      setMemes((prev) => prev.filter((item) => item.id !== id));
      setStats((prev) =>
        prev
          ? {
              total_memes: Math.max(0, prev.total_memes - 1),
              public_memes: prev.public_memes,
            }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.profileError);
    }
  };

  const moderateItem = async (id: number, status: "approved" | "rejected") => {
    if (!token) return;
    try {
      await moderateMemeApi(token, id, { status });
      setModerationQueue((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.profileError);
    }
  };

  return (
    <section className="glass-card w-full p-6 md:p-8">
      <div className="space-y-2">
        <h2 className="rgb-text text-2xl md:text-3xl">{labels.title}</h2>
        <p className="text-sm text-slate-300">{labels.subtitle}</p>
      </div>

      {!user ? (
        <form
          onSubmit={handleAuthSubmit}
          className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:max-w-xl"
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                mode === "register"
                  ? "bg-fuchsia-500/20 text-fuchsia-200"
                  : "border border-white/10 bg-slate-950/70 text-slate-300"
              }`}
            >
              {labels.register}
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                mode === "login"
                  ? "bg-fuchsia-500/20 text-fuchsia-200"
                  : "border border-white/10 bg-slate-950/70 text-slate-300"
              }`}
            >
              {labels.login}
            </button>
          </div>

          {mode === "register" && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={labels.username}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
              required
              minLength={3}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={labels.email}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={labels.password}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {isLoading
              ? labels.loading
              : mode === "register"
                ? labels.submitRegister
                : labels.submitLogin}
          </button>
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <p className="text-xs text-slate-400">{labels.username}</p>
              <p className="text-sm font-semibold text-slate-100">{user.username}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <p className="text-xs text-slate-400">{labels.totalMemes}</p>
              <p className="text-sm font-semibold text-slate-100">{stats?.total_memes ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <p className="text-xs text-slate-400">{labels.publicMemes}</p>
              <p className="text-sm font-semibold text-slate-100">{stats?.public_memes ?? 0}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
            >
              {labels.logout}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-sm font-semibold text-slate-100">{labels.mine}</p>
            {isLoading ? (
              <p className="mt-3 text-xs text-slate-400">{labels.loading}</p>
            ) : memes.length === 0 ? (
              <p className="mt-3 text-xs text-slate-400">{labels.empty}</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {memes.map((meme) => (
                  <div
                    key={meme.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-300 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-100">{meme.title}</p>
                      <p>{new Date(meme.created_at).toLocaleString()}</p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        {labels.status}: {meme.moderation_status ?? "pending"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleVisibility(meme)}
                        className="rounded-full border border-white/10 bg-slate-900/70 px-2 py-1 font-semibold text-slate-200"
                      >
                        {meme.is_public ? labels.makePrivate : labels.makePublic}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMeme(meme.id)}
                        className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-1 font-semibold text-rose-200"
                      >
                        {labels.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {user?.is_admin && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-slate-100">{labels.moderation}</p>
              {isModerationLoading ? (
                <p className="mt-3 text-xs text-slate-400">{labels.loading}</p>
              ) : moderationQueue.length === 0 ? (
                <p className="mt-3 text-xs text-slate-400">{labels.moderationEmpty}</p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {moderationQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-300 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-100">{item.title}</p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          {labels.status}: {item.moderation_status ?? "pending"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => moderateItem(item.id, "approved")}
                          className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-200"
                        >
                          {labels.approve}
                        </button>
                        <button
                          type="button"
                          onClick={() => moderateItem(item.id, "rejected")}
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
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
      )}
    </section>
  );
}
