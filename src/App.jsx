import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import ParticipantsPage from "./pages/ParticipantsPage";
import TotalsPage from "./pages/TotalsPage";
import DatePage from "./DatePage";
import RanksPage from "./pages/RanksPage"; // ← 追加

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/participants" element={<ParticipantsPage />} />
        <Route path="/totals" element={<TotalsPage />} />
        <Route path="/date/:date" element={<DatePage />} />
        <Route path="/ranks" element={<RanksPage />} /> {/* ← 追加 */}
      </Routes>
    </Router>
  );
}

export default App;
