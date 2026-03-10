import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminModerationPanel from "../components/AdminModerationPanel";
import { useLanguage } from "../context/LanguageContext";
import {
  API_TOKEN_KEY,
  deleteMemeApi,
  forgotPasswordApi,
  getMeApi,
  getMyMemesApi,
  loginApi,
  logoutApi,
  registerApi,
  resetPasswordApi,
  sendVerificationEmailApi,
  updateMemeApi,
  verifyEmailApi,
  type ApiMeme,
  type ApiUser,
} from "../lib/api";

export default function Profile() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const labels = useMemo(
    () =>
      language === "fr"
        ? {
            title: "Profile",
            subtitle: "Compte, verification email, reset password et gestion de tes memes.",
            login: "Connexion",
            register: "Inscription",
            forgot: "Mot de passe oublie",
            username: "Nom d'utilisateur",
            email: "Email",
            password: "Mot de passe",
            newPassword: "Nouveau mot de passe",
            submitLogin: "Se connecter",
            submitRegister: "Creer le compte",
            submitForgot: "Envoyer le lien reset",
            submitReset: "Enregistrer le nouveau mot de passe",
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
            status: "Statut",
            verifyTitle: "Verification email",
            verifyPending:
              "Verifie ton email pour publier tes memes sur le site et les partager dans la galerie publique.",
            verifyDone: "Email verifie. Le partage public est debloque.",
            sendVerify: "Renvoyer le mail de verification",
            verifySending: "Envoi...",
            verifySent: "Mail de verification envoye.",
            verifySuccess: "Ton email est maintenant verifie.",
            verifyInvalid: "Le lien de verification est invalide ou expire.",
            forgotHint: "On t'envoie un lien de reset si le compte existe.",
            forgotSent: "Si le compte existe, le mail de reset est parti.",
            resetTitle: "Reset password",
            resetHint: "Choisis un nouveau mot de passe pour terminer le reset.",
            resetDone: "Mot de passe mis a jour. Tu peux te connecter.",
            resetInvalid: "Le lien reset est invalide ou expire.",
            registerSent: "Compte cree. Verifie maintenant ton email pour publier tes memes en public.",
            publicBlocked: "Email verification requise avant de publier un meme en public.",
            createdAt: "Compte cree",
          }
        : {
            title: "Profile",
            subtitle: "Account, email verification, reset password, and meme management.",
            login: "Login",
            register: "Register",
            forgot: "Forgot password",
            username: "Username",
            email: "Email",
            password: "Password",
            newPassword: "New password",
            submitLogin: "Sign in",
            submitRegister: "Create account",
            submitForgot: "Send reset link",
            submitReset: "Save new password",
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
            status: "Status",
            verifyTitle: "Email verification",
            verifyPending:
              "Verify your email to publish memes on the site and share them in the public gallery.",
            verifyDone: "Email verified. Public sharing is now unlocked.",
            sendVerify: "Resend verification email",
            verifySending: "Sending...",
            verifySent: "Verification email sent.",
            verifySuccess: "Your email is now verified.",
            verifyInvalid: "This verification link is invalid or expired.",
            forgotHint: "We will send a reset link if the account exists.",
            forgotSent: "If the account exists, the reset email has been sent.",
            resetTitle: "Reset password",
            resetHint: "Choose a new password to finish the reset.",
            resetDone: "Password updated. You can now sign in.",
            resetInvalid: "This reset link is invalid or expired.",
            registerSent:
              "Account created. Verify your email now before publishing memes publicly.",
            publicBlocked: "Email verification is required before publishing publicly.",
            createdAt: "Account created",
          },
    [language]
  );

  const [mode, setMode] = useState<"login" | "register" | "forgot">("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [stats, setStats] = useState<{ total_memes: number; public_memes: number } | null>(null);
  const [memes, setMemes] = useState<ApiMeme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const verifyToken = searchParams.get("verify")?.trim() ?? "";
  const resetToken = searchParams.get("reset")?.trim() ?? "";

  const clearTokenQuery = (key: "verify" | "reset") => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const loadProfile = async (activeToken: string) => {
    const [me, mine] = await Promise.all([getMeApi(activeToken), getMyMemesApi(activeToken)]);
    setUser(me.user);
    setStats(me.stats);
    setMemes(mine.items);
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

  useEffect(() => {
    if (!verifyToken) return;
    let cancelled = false;

    verifyEmailApi(verifyToken)
      .then(async (response) => {
        if (cancelled) return;
        setVerificationNotice(labels.verifySuccess);
        setUser((prev) => ({ ...(prev ?? response.user), ...response.user }));
        const stored = localStorage.getItem(API_TOKEN_KEY);
        if (stored) {
          setToken(stored);
          await loadProfile(stored).catch(() => undefined);
        }
        clearTokenQuery("verify");
      })
      .catch(() => {
        if (cancelled) return;
        setVerificationNotice(labels.verifyInvalid);
        clearTokenQuery("verify");
      });

    return () => {
      cancelled = true;
    };
  }, [labels.verifyInvalid, labels.verifySuccess, verifyToken]);

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
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
      if (mode === "register") {
        setInfo(labels.registerSent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.authError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      await forgotPasswordApi(forgotEmail);
      setInfo(labels.forgotSent);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.authError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetToken) return;
    setError(null);
    setResetNotice(null);
    setIsResettingPassword(true);
    try {
      await resetPasswordApi({ token: resetToken, password: newPassword });
      setResetNotice(labels.resetDone);
      setNewPassword("");
      clearTokenQuery("reset");
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.resetInvalid);
    } finally {
      setIsResettingPassword(false);
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
  };

  const handleSendVerification = async () => {
    if (!token) return;
    setError(null);
    setVerificationNotice(null);
    setIsSendingVerification(true);
    try {
      await sendVerificationEmailApi(token);
      setVerificationNotice(labels.verifySent);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.profileError);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const toggleVisibility = async (meme: ApiMeme) => {
    if (!token) return;
    setError(null);
    try {
      const nextPublic = !meme.is_public;
      await updateMemeApi(token, meme.id, { is_public: nextPublic });
      setMemes((prev) =>
        prev.map((item) =>
          item.id === meme.id ? { ...item, is_public: nextPublic } : item
        )
      );
      setStats((prev) =>
        prev
          ? {
              ...prev,
              public_memes: Math.max(
                0,
                prev.public_memes + (nextPublic ? 1 : -1)
              ),
            }
          : prev
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : user?.email_verified ? labels.profileError : labels.publicBlocked;
      setError(message);
    }
  };

  const removeMeme = async (id: number) => {
    if (!token) return;
    try {
      const meme = memes.find((item) => item.id === id);
      await deleteMemeApi(token, id);
      setMemes((prev) => prev.filter((item) => item.id !== id));
      setStats((prev) =>
        prev
          ? {
              total_memes: Math.max(0, prev.total_memes - 1),
              public_memes:
                meme?.is_public && prev.public_memes > 0
                  ? prev.public_memes - 1
                  : prev.public_memes,
            }
          : prev
      );
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

      {verificationNotice && (
        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {verificationNotice}
        </div>
      )}

      {resetToken && (
        <form
          onSubmit={handleResetPassword}
          className="mt-6 grid gap-4 rounded-2xl border border-cyan-400/30 bg-slate-900/60 p-4 md:max-w-xl"
        >
          <div>
            <p className="font-smash-slice text-xl text-white">{labels.resetTitle}</p>
            <p className="mt-1 text-sm text-slate-300">{labels.resetHint}</p>
          </div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={labels.newPassword}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={isResettingPassword}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {isResettingPassword ? labels.loading : labels.submitReset}
          </button>
          {resetNotice && <p className="text-xs text-emerald-300">{resetNotice}</p>}
        </form>
      )}

      {!user ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form
            onSubmit={mode === "forgot" ? handleForgotPassword : handleAuthSubmit}
            className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4"
          >
            <div className="flex flex-wrap gap-2">
              {(["register", "login", "forgot"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value);
                    setError(null);
                    setInfo(null);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    mode === value
                      ? "bg-fuchsia-500/20 text-fuchsia-200"
                      : "border border-white/10 bg-slate-950/70 text-slate-300"
                  }`}
                >
                  {labels[value]}
                </button>
              ))}
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

            {mode === "forgot" ? (
              <>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder={labels.email}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                  required
                />
                <p className="text-xs text-slate-400">{labels.forgotHint}</p>
              </>
            ) : (
              <>
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
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {isLoading
                ? labels.loading
                : mode === "register"
                  ? labels.submitRegister
                  : mode === "login"
                    ? labels.submitLogin
                    : labels.submitForgot}
            </button>
            {info && <p className="text-xs text-emerald-300">{info}</p>}
            {error && <p className="text-xs text-rose-300">{error}</p>}
          </form>

          <aside className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <p className="font-smash-slice text-xl text-white">{labels.verifyTitle}</p>
            <p className="mt-2 text-sm text-slate-300">{labels.verifyPending}</p>
          </aside>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
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
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <p className="text-xs text-slate-400">{labels.createdAt}</p>
              <p className="text-sm font-semibold text-slate-100">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-smash-slice text-xl text-white">{labels.verifyTitle}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {user.email_verified ? labels.verifyDone : labels.verifyPending}
                </p>
              </div>
              {!user.email_verified && (
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isSendingVerification}
                  className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/80 disabled:opacity-50"
                >
                  {isSendingVerification ? labels.verifySending : labels.sendVerify}
                </button>
              )}
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
          {user.is_admin && token && (
            <AdminModerationPanel
              token={token}
              language={language}
              onError={(message) => setError(message)}
            />
          )}
          {info && <p className="text-xs text-emerald-300">{info}</p>}
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
      )}
    </section>
  );
}
