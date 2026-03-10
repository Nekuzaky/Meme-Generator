import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import MemeProvider from "./context/MemeContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";

import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import { trackEngagement } from "./lib/engagement";

const Home = lazy(() => import("./pages/Home"));
const ImageEditor = lazy(() => import("./pages/ImageEditor"));
const Landing = lazy(() => import("./pages/Landing"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicMeme = lazy(() => import("./pages/PublicMeme"));
const TemplatesGallery = lazy(() => import("./pages/TemplatesGallery"));

function TitleManager() {
  const location = useLocation();
  const { language, t } = useLanguage();

  useEffect(() => {
    if (location.pathname.startsWith("/m/")) {
      return;
    }

    const routeTitle =
      location.pathname === "/creator"
        ? t("navbar.creator")
        : location.pathname === "/templates"
          ? t("navbar.templates")
        : location.pathname === "/editor"
          ? t("navbar.editor")
          : location.pathname === "/profile"
            ? t("navbar.profile")
            : t("navbar.home");

    document.title = `${routeTitle} | ${t("brand.name")}`;
    document.documentElement.lang = language;
  }, [language, location.pathname, t]);

  return null;
}

export default function App() {
  useEffect(() => {
    trackEngagement("session");
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <MemeProvider>
          <Router>
            <TitleManager />
            <div className="flex min-h-screen flex-col">
              <a
                href="#main-content"
                className="skip-link"
              >
                Aller au contenu
              </a>
              <Navbar />
              <main
                id="main-content"
                className="flex-1"
              >
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-3 pb-14 pt-6 sm:px-4 md:gap-12 md:px-6 md:pb-16 md:pt-10">
                  <Suspense
                    fallback={
                      <div className="glass-card w-full p-6 text-sm text-slate-300">
                        Chargement du studio...
                      </div>
                    }
                  >
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/creator" element={<Home />} />
                      <Route path="/templates" element={<TemplatesGallery />} />
                      <Route path="/editor" element={<ImageEditor />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/m/:id" element={<PublicMeme />} />
                    </Routes>
                  </Suspense>
                </div>
              </main>
              <Footer />
              <PwaInstallPrompt />
              <CookieConsent />
            </div>
          </Router>
        </MemeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
