import { useState, useEffect, useRef } from "react";
import { collection, doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import Calendar from "react-calendar";
import { useNavigate, Link } from "react-router-dom";
import "react-calendar/dist/Calendar.css";

function Home() {
  const [date, setDate] = useState(new Date());
  const [practiceDays, setPracticeDays] = useState([]);
  const [currentYearMonth, setCurrentYearMonth] = useState(null);
  const navigate = useNavigate();
  const unsubscribeRef = useRef(null);

  // カレンダーの色付け
  const tileClassName = ({ date, view }) => {
    if (view !== "month") return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const formatted = `${y}-${m}-${d}`;
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    const classes = [];
    if (isToday) classes.push("tile-today");          // ← 当日判定を先に行う（優先）
    else if (practiceDays.includes(formatted)) classes.push("practice-day");

    return classes.join(" ");
  };

  // 初期デフォルトデータが存在しなければ作成
  const initializeDefaultDataIfNeeded = async (year, month) => {
    const y = year;
    const m = String(month + 1).padStart(2, "0");
    const docId = `${y}-${m}`;
    const attendanceDocRef = doc(collection(db, "attendance"), docId);

    const docSnap = await getDoc(attendanceDocRef);
    if (!docSnap.exists()) {
      const defaultData = {};
      const firstDate = new Date(year, month, 1);
      const lastDate = new Date(year, month + 1, 0);
      for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const isPractice = [1, 4, 6].includes(dayOfWeek); // 月・木・土
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateStr = `${yy}-${mm}-${dd}`;
        defaultData[dateStr] = {
          participants: {},
          isPracticeDay: isPractice,
        };
      }
      await setDoc(attendanceDocRef, defaultData);
    }
  };

  // Firestoreのリアルタイム監視セットアップ
  const subscribeAttendanceMonth = (year, month) => {
    const y = year;
    const m = String(month + 1).padStart(2, "0");
    const docId = `${y}-${m}`;
    const attendanceDocRef = doc(collection(db, "attendance"), docId);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    unsubscribeRef.current = onSnapshot(attendanceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const daysWithPractice = Object.entries(data)
          .filter(([dateStr, dayData]) => dayData?.isPracticeDay === true)
          .map(([dateStr]) => dateStr);
        setPracticeDays(daysWithPractice);
      } else {
        // ここは空でも良い
        setPracticeDays([]);
      }
    });
  };

  // 月変更時の処理
  const onActiveStartDateChange = async ({ activeStartDate }) => {
    const year = activeStartDate.getFullYear();
    const month = activeStartDate.getMonth();
    const ymKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    if (ymKey !== currentYearMonth) {
      await initializeDefaultDataIfNeeded(year, month);
      subscribeAttendanceMonth(year, month);
      setCurrentYearMonth(ymKey);
    }
  };

  // 初回ロード時
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const ymKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    (async () => {
      await initializeDefaultDataIfNeeded(year, month);
      subscribeAttendanceMonth(year, month);
      setCurrentYearMonth(ymKey);
    })();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const onDateChange = (selectedDate) => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    const formatted = `${y}-${m}-${d}`;
    navigate(`/date/${formatted}`);
  };

  return (
    <div>
      <h1>合気道 出席管理</h1>
      <nav>
        <Link to="/participants">参加者管理ページへ</Link><br />
        <Link to="/totals">合計単位数ページへ</Link><br />
        <Link to="/ranks">級・段管理ページへ</Link>
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