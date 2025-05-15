import { Link } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();

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
      />
    </div>
  );
}

export default Home;
