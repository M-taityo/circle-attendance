// App.jsx
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import Home from "./Home";
import ParticipantsPage from "./pages/ParticipantsPage";
import TotalsPage from "./pages/TotalsPage";
import DatePage from "./DatePage";
import RanksPage from "./pages/RanksPage";
import LoginPage from "./LoginPage";
import MonthlyExportPage from "./pages/MonthlyExportPage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ローディング状態を追加

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // 認証確認が終わったらローディング終了
    });
    return () => unsubscribe(); // クリーンアップ
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return <p>読み込み中...</p>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Router>
      <div style={{ position: "fixed", top: 10, right: 10 }}>
        <button onClick={handleLogout}>ログアウト</button>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/participants" element={<ParticipantsPage />} />
        <Route path="/totals" element={<TotalsPage />} />
        <Route path="/monthly-export" element={<MonthlyExportPage />} />
        <Route path="/date/:date" element={<DatePage />} />
        <Route path="/ranks" element={<RanksPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;