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

  // 練習日リストを生成
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

  // 月が変わったとき練習日を再計算
  const onActiveStartDateChange = ({ activeStartDate }) => {
    const year = activeStartDate.getFullYear();
    const month = activeStartDate.getMonth();
    const newPracticeDays = generatePracticeDays(year, month);
    setPracticeDays(newPracticeDays);
  };

  // 初回ロード時
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

  // 日付ごとのカスタムクラス設定
  const tileClassName = ({ date, view }) => {
    if (view !== "month") return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formatted = `${year}-${month}-${day}`;

    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    const isPractice = practiceDays.includes(formatted);

    const classes = [];
    if (isPractice) classes.push("tile-practice");
    if (isToday) classes.push("tile-today");

    return classes.join(" ");
  };

  return (
    <div>
      <h1>合気道 出席管理</h1>
      <nav>
        <Link to="/participants">「参加者管理」ページへ</Link>
        <br />
        <Link to="/totals">「合計単位数」ページへ</Link>
        <br />
        <Link to="/ranks">「級・段」ページへ</Link> {/* ← 追加 */}
      </nav>

      <Calendar
        onChange={onDateChange}
        value={date}
        formatDay={(locale, date) => date.getDate()}
        tileClassName={tileClassName}
        onActiveStartDateChange={onActiveStartDateChange}
      />
    </div>
  );
}

export default Home;