import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import MemeProvider from "./context/MemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";

import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import Home from "./pages/Home";
import ImageEditor from "./pages/ImageEditor";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import { trackEngagement } from "./lib/engagement";

export default function App() {
  useEffect(() => {
    trackEngagement("session");
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <MemeProvider>
          <Router>
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
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-10 md:px-6">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/creator" element={<Home />} />
                    <Route path="/editor" element={<ImageEditor />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </div>
              </main>
              <Footer />
              <CookieConsent />
            </div>
          </Router>
        </MemeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
