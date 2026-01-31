import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Meme from "./components/Meme";
import MemeProvider from "./context/MemeContext";

import OwnMeme from "./pages/OwnMeme";
import Footer from "./components/Footer";

export default function App() {
  return (
    <MemeProvider>
      <Router>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-10 md:px-6">
              <Meme />
              <Routes>
                <Route path="/" element={<OwnMeme />} />
              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </Router>
    </MemeProvider>
  );
}
