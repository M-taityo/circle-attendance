import { Link } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function Home() {
  const [date, setDate] = useState(new Date());
  const [practiceDays, setPracticeDays] = useState([]);
  const navigate = useNavigate();

  // 指定年月の全日付で練習日判定して配列を返す関数
  const generatePracticeDays = (year, month) => {
    const datesWithPractice = [];
    const firstDate = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0);

    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const formatted = `${y}-${m}-${day}`;

      const stored = localStorage.getItem(`attendance-${formatted}`);

      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.isPracticeDay) {
            datesWithPractice.push(formatted);
          }
        } catch {}
      } else {
        const dayOfWeek = d.getDay();
        if ([1, 4, 6].includes(dayOfWeek)) {
          datesWithPractice.push(formatted);
        }
      }
    }
    return datesWithPractice;
  };

  // カレンダーの表示月が変わったら練習日を更新
  const onActiveStartDateChange = ({ activeStartDate }) => {
    const year = activeStartDate.getFullYear();
    const month = activeStartDate.getMonth();
    const newPracticeDays = generatePracticeDays(year, month);
    setPracticeDays(newPracticeDays);
  };

  // 初回レンダリング時は現在の月の練習日を設定
  useEffect(() => {
    const now = new Date();
    const initialPracticeDays = generatePracticeDays(now.getFullYear(), now.getMonth());
    setPracticeDays(initialPracticeDays);
  }, []);

  const onDateChange = (selectedDate) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const formatted = `${year}-${month}-${day}`;
    navigate(`/date/${formatted}`);
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formatted = `${year}-${month}-${day}`;
    return practiceDays.includes(formatted) ? "practice-day" : null;
  };

  return (
    <div>
      <h1>合気道 出席管理</h1>
      <nav>
        <Link to="/participants">「参加者管理」ページへ</Link>
        <br />
        <Link to="/totals">「合計単位数」ページへ</Link>
      </nav>

      <Calendar
        onChange={onDateChange}
        value={date}
        formatDay={(locale, date) => date.getDate()}
        tileClassName={tileClassName}
        onActiveStartDateChange={onActiveStartDateChange} // ← ここを追加
      />
    </div>
  );
}

export default Home;