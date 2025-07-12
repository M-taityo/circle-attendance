import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./firebase";

function DatePage() {
  const { date } = useParams(); // "2025-07-08"
  const navigate = useNavigate();

  const [attendanceData, setAttendanceData] = useState({ participants: {} });
  const [participantsList, setParticipantsList] = useState([]);
  const [isPracticeDay, setIsPracticeDay] = useState(false);

  const [participantName, setParticipantName] = useState("");
  const [isPresent, setIsPresent] = useState(true);
  const [units, setUnits] = useState(2);
  const [customUnits, setCustomUnits] = useState("");
  const [editingName, setEditingName] = useState(null);

  // 月単位ドキュメントID取得（例：2025-07）
  const getDocId = (dateStr) => {
    const [year, month] = dateStr.split("-");
    return `${year}-${month}`;
  };

  // 月ドキュメントから日付データ取得
  const getDateData = (docData, dateStr) => {
    if (docData && docData[dateStr]) {
      return docData[dateStr];
    }
    // なければ空データ＋デフォルト練習日判定
    const dayOfWeek = new Date(dateStr).getDay();
    return {
      participants: {},
      isPracticeDay: [1, 4, 6].includes(dayOfWeek),
    };
  };

  // 日付を日本語形式で表示
  const formatJapaneseDate = (dateStr) => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[d.getDay()];
    return `${y}年${m}月${day}日（${weekday}）の出席登録`;
  };

  // 前日取得
  const getPrevDate = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  // 翌日取得
  const getNextDate = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  // Firestoreから月ドキュメント読み込み＋当日データセット
  useEffect(() => {
    async function fetchData() {
      try {
        const docId = getDocId(date);
        const docRef = doc(db, "attendance", docId);
        const docSnap = await getDoc(docRef);
        let allMonthData = {};
        if (docSnap.exists()) {
          allMonthData = docSnap.data();
        } else {
          await setDoc(docRef, {}); // 空の月データを作成
        }

        const dayData = getDateData(allMonthData, date);
        setAttendanceData(dayData);
        setIsPracticeDay(dayData.isPracticeDay);

        // 参加者リスト読み込み（participants コレクション）
        const participantsSnapshot = await getDocs(collection(db, "participants"));
        let participants = [];
        participantsSnapshot.forEach((doc) => {
          participants.push(doc.data());
        });
        participants.sort((a, b) => a.year - b.year);
        setParticipantsList(participants);
      } catch (e) {
        alert("データの読み込みに失敗しました");
        console.error(e);
      }
    }
    fetchData();
  }, [date]);

  const resetForm = () => {
    setParticipantName("");
    setIsPresent(true);
    const selectedDate = new Date(date);
    setUnits(selectedDate.getDay() === 6 ? 2.5 : 2);
    setCustomUnits("");
    setEditingName(null);
  };
  useEffect(() => {
    if (participantsList.length > 0) {
      resetForm();
    }
  }, [participantsList]);

  // 出席情報保存
  const saveAttendance = async () => {
    if (!participantName.trim()) {
      alert("参加者名を入力してください");
      return;
    }

    let savedUnits = 0;
    if (isPresent === true) {
      if (units === "") {
        const parsed = parseFloat(customUnits);
        if (isNaN(parsed) || parsed <= 0) {
          alert("有効な単位数を入力してください");
          return;
        }
        savedUnits = parsed;
      } else {
        savedUnits = Number(units);
      }
    }

    const newParticipants = {
      ...attendanceData.participants,
      [participantName]: { isPresent, units: savedUnits },
    };

    const newDataForDate = {
      ...attendanceData,
      participants: newParticipants,
      isPracticeDay,
    };

    try {
      const docId = getDocId(date);
      const docRef = doc(db, "attendance", docId);
      await updateDoc(docRef, {
        [date]: newDataForDate,
      });
      setAttendanceData(newDataForDate);
      alert("出席情報を保存しました！");
      resetForm();
    } catch (e) {
      // ドキュメントが存在しない場合は作成
      try {
        const docId = getDocId(date);
        const docRef = doc(db, "attendance", docId);
        await setDoc(docRef, {
          [date]: newDataForDate,
        });
        setAttendanceData(newDataForDate);
        alert("出席情報を保存しました！");
        resetForm();
      } catch (error) {
        alert("保存に失敗しました");
        console.error(error);
      }
    }
  };

  // 練習日設定切替
  const togglePracticeDay = async (checked) => {
    setIsPracticeDay(checked);

    const updatedData = {
      ...attendanceData,
      isPracticeDay: checked,
    };

    try {
      const docId = getDocId(date);
      const docRef = doc(db, "attendance", docId);
      await updateDoc(docRef, {
        [date]: updatedData,
      });
      setAttendanceData(updatedData);
    } catch (e) {
      alert("練習日設定の保存に失敗しました");
      console.error(e);
    }
  };

  // 編集開始
  const startEdit = (name) => {
    const info = attendanceData.participants[name];
    setParticipantName(name);
    setIsPresent(info.isPresent);
    if ([2, 2.5].includes(info.units)) {
      setUnits(info.units);
      setCustomUnits("");
    } else {
      setUnits("");
      setCustomUnits(info.units);
    }
    setEditingName(name);
  };

  // 削除処理
  const deleteAttendance = async (name) => {
    if (!window.confirm(`${name} さんの出席情報を削除しますか？`)) return;

    const newParticipants = { ...attendanceData.participants };
    delete newParticipants[name];

    const newDataForDate = {
      ...attendanceData,
      participants: newParticipants,
    };

    try {
      const docId = getDocId(date);
      const docRef = doc(db, "attendance", docId);
      await updateDoc(docRef, {
        [date]: newDataForDate,
      });
      setAttendanceData(newDataForDate);
      alert(`${name} さんの出席情報を削除しました。`);
      resetForm();
    } catch (e) {
      alert("削除に失敗しました");
      console.error(e);
    }
  };

  return (
    <div>
      <h2>{formatJapaneseDate(date)}</h2>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => navigate(`/date/${getPrevDate()}`)} style={{ marginRight: "10px", padding: "6px 12px" }}>
          ← 前の日
        </button>
        <button onClick={() => navigate(`/date/${getNextDate()}`)} style={{ marginRight: "10px", padding: "6px 12px" }}>
          次の日 →
        </button>
        <button onClick={() => navigate("/")} style={{ padding: "6px 12px" }}>
          ホームへ戻る
        </button>
      </div>

      <button onClick={() => navigate(-1)} style={{ marginBottom: "20px", padding: "6px 12px", fontSize: "16px" }}>
        ← 戻る
      </button>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>
          <input type="checkbox" checked={isPracticeDay} onChange={(e) => togglePracticeDay(e.target.checked)} />
          この日は練習日ですか？
        </label>
      </div>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>
          参加者名：
          <select
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            disabled={editingName !== null}
          >
            <option value="">-- 参加者を選択 --</option>
            {participantsList.map((p) => (
              <option key={p.name} value={p.name}>
                {p.year}年入学 - {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>
          出席する：
          <label style={{ marginRight: "1ch" }} className="attendance-option">
            <input
              type="radio"
              name="isPresent"
              value="true"
              checked={isPresent === true}
              onChange={() => setIsPresent(true)}
            />
            〇
          </label>
          <label style={{ marginRight: "1ch" }} className="attendance-option">
            <input
              type="radio"
              name="isPresent"
              value="false"
              checked={isPresent === false}
              onChange={() => setIsPresent(false)}
            />
            ×
          </label>
          <label className="attendance-option">
            <input
              type="radio"
              name="isPresent"
              value="pending"
              checked={isPresent === "pending"}
              onChange={() => setIsPresent("pending")}
            />
            保留
          </label>
        </label>
      </div>

      {isPresent === true && (
        <div style={{ fontSize: "18px", marginBottom: "10px" }}>
          <label>
            単位数：
            <select
              value={units}
              onChange={(e) => {
                const val = e.target.value;
                setUnits(val);
                if (val !== "") {
                  setCustomUnits("");
                }
              }}
            >
              <option value={2}>2単位</option>
              <option value={2.5}>2.5単位</option>
              <option value="">その他</option>
            </select>
          </label>
          {units === "" && (
            <input
              type="number"
              min="0"
              step="0.1"
              value={customUnits}
              onChange={(e) => setCustomUnits(e.target.value)}
              placeholder="単位数を入力"
              style={{ marginLeft: "10px" }}
            />
          )}
        </div>
      )}

      <button onClick={saveAttendance}>{editingName ? "更新" : "保存"}</button>
      <button onClick={resetForm} disabled={!editingName}>
        キャンセル
      </button>

      {editingName && (
        <button
          onClick={() => deleteAttendance(editingName)}
          style={{ marginLeft: "10px", color: "red" }}
        >
          削除
        </button>
      )}

      <h3>この日の出席状況</h3>
      <ul>
        {Object.entries(attendanceData.participants || {})
          .sort(([nameA, infoA], [nameB, infoB]) => {
            const order = { true: 0, false: 1, pending: 2 };
            return order[infoA.isPresent] - order[infoB.isPresent];
          })
          .map(([name, info]) => (
            <li key={name} onClick={() => startEdit(name)} style={{ cursor: "pointer" }}>
              {name} - 出席:{" "}
              {info.isPresent === true ? "〇" : info.isPresent === false ? "×" : "保留"} - 単位数: {info.units}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default DatePage;