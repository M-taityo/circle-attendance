import { Link, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState, useEffect } from "react";
import "./Home.css"; // CSS を読み込み

function Home() {
  const [date, setDate] = useState(new Date());
  const [markedDates, setMarkedDates] = useState(new Set());
  const navigate = useNavigate();

  // 出席済みの日付を取得
  useEffect(() => {
    const datesWithAttendance = new Set();

    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.participants) {
            // 誰かが出席していたらマーク
            const someonePresent = Object.values(data.participants).some(
              (info) => info.isPresent
            );
            if (someonePresent) {
              const dateStr = key.replace("attendance-", "");
              datesWithAttendance.add(dateStr);
            }
          }
        } catch {}
      }
    }

    setMarkedDates(datesWithAttendance);
  }, []);

  const onDateChange = (selectedDate) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    navigate(`/date/${formatted}`);
  };

  return (
    <div>
      <h1>合気道　出席管理</h1>
      <nav>
        <Link to="/participants">「参加者管理」ページへ</Link><br />
        <Link to="/totals">「合計単位数」ページへ</Link>
      </nav>

      <Calendar
        onChange={onDateChange}
        value={date}
        formatDay={(locale, date) => date.getDate()}
        tileClassName={({ date, view }) => {
          if (view === "month") {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            if (markedDates.has(dateStr)) {
              return "highlight";
            }
          }
          return null;
        }}
      />
    </div>
  );
}

export default Home;