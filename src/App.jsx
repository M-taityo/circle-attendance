import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import DatePage from './DatePage';
import Participants from './Participants';
import TotalsPage from './TotalsPage';  // ここを追加

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/date/:date" element={<DatePage />} />
        <Route path="/participants" element={<Participants />} />
        <Route path="/totals" element={<TotalsPage />} />  {/* 追加 */}
      </Routes>
    </Router>
  );
}

export default App;
