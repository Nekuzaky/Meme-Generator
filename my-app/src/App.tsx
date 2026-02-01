import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import MemeProvider from "./context/MemeContext";
import { LanguageProvider } from "./context/LanguageContext";

import Footer from "./components/Footer";
import Home from "./pages/Home";
import ImageEditor from "./pages/ImageEditor";

export default function App() {
  return (
    <LanguageProvider>
      <MemeProvider>
        <Router>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-10 md:px-6">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/editor" element={<ImageEditor />} />
                </Routes>
              </div>
            </main>
            <Footer />
          </div>
        </Router>
      </MemeProvider>
    </LanguageProvider>
  );
}
