import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function DatePage() {
  const { date } = useParams();
  const navigate = useNavigate();

  const [attendanceData, setAttendanceData] = useState({ participants: {} });
  const [participantsList, setParticipantsList] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  const [participantName, setParticipantName] = useState("");
  const [isPresent, setIsPresent] = useState(true);
  const [units, setUnits] = useState(2);
  const [customUnits, setCustomUnits] = useState("");
  const [editingName, setEditingName] = useState(null);

  const [isPracticeDay, setIsPracticeDay] = useState(false);

  // 日付の前日を計算
  const getPrevDate = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  // 日付の翌日を計算
  const getNextDate = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  useEffect(() => {
    const stored = localStorage.getItem(`attendance-${date}`);
    if (stored) {
      const data = JSON.parse(stored);
      setAttendanceData(data);
      setIsPracticeDay(data.isPracticeDay ?? false);
    } else {
      setAttendanceData({ participants: {} });
      setIsPracticeDay(false);
    }

    const storedParticipants = localStorage.getItem("participants");
    if (storedParticipants) {
      const parsed = JSON.parse(storedParticipants);
      parsed.sort((a, b) => b.year - a.year);
      setParticipantsList(parsed);
    } else {
      setParticipantsList([]);
    }

    resetForm();
  }, [date]);

  const resetForm = () => {
    setParticipantName("");
    setSelectedYear("");
    setIsPresent(true);

    const selectedDate = new Date(date);
    setUnits(selectedDate.getDay() === 6 ? 2.5 : 2);
    setCustomUnits("");
    setEditingName(null);
  };

  const saveAttendance = () => {
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

    const newData = {
      ...attendanceData,
      participants: newParticipants,
      isPracticeDay,
    };

    setAttendanceData(newData);
    localStorage.setItem(`attendance-${date}`, JSON.stringify(newData));

    alert("出席情報を保存しました！");
    resetForm();
  };

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

    const participant = participantsList.find((p) => p.name === name);
    if (participant) {
      setSelectedYear(participant.year.toString());
    }
  };

  const togglePracticeDay = (checked) => {
    setIsPracticeDay(checked);

    const updated = {
      ...attendanceData,
      isPracticeDay: checked,
    };

    setAttendanceData(updated);
    localStorage.setItem(`attendance-${date}`, JSON.stringify(updated));
  };

  return (
    <div>
      <h2>{date} の出席登録</h2>

      {/* 前の日・次の日・ホームへ戻るリンク */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => navigate(`/date/${getPrevDate()}`)}
          style={{ marginRight: "10px", padding: "6px 12px" }}
        >
          ← 前の日
        </button>
        <button
          onClick={() => navigate(`/date/${getNextDate()}`)}
          style={{ marginRight: "10px", padding: "6px 12px" }}
        >
          次の日 →
        </button>
        <button
          onClick={() => navigate("/")}
          style={{ padding: "6px 12px" }}
        >
          ホームへ戻る
        </button>
      </div>

      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: "20px", padding: "6px 12px", fontSize: "16px" }}
      >
        ← 戻る
      </button>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>
          <input
            type="checkbox"
            checked={isPracticeDay}
            onChange={(e) => togglePracticeDay(e.target.checked)}
          />
          この日は練習日ですか？
        </label>
      </div>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>
          入学年度：
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setParticipantName("");
            }}
            disabled={editingName !== null}
          >
            <option value="">-- 年度を選択 --</option>
            {[...new Set(participantsList.map((p) => p.year))].map((year) => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>
          参加者名：
          <select
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            disabled={editingName !== null || selectedYear === ""}
          >
            <option value="">-- 参加者を選択 --</option>
            {participantsList
              .filter((p) => p.year.toString() === selectedYear)
              .map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>
          出席する：
          <label>
            <input
              type="radio"
              name="isPresent"
              value="true"
              checked={isPresent === true}
              onChange={() => setIsPresent(true)}
            />
            〇
          </label>
          <label>
            <input
              type="radio"
              name="isPresent"
              value="false"
              checked={isPresent === false}
              onChange={() => setIsPresent(false)}
            />
            ×
          </label>
          <label>
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
          onClick={() => {
            if (!window.confirm(`${editingName} さんの出席情報を削除しますか？`)) return;
            const newParticipants = { ...attendanceData.participants };
            delete newParticipants[editingName];
            const newData = {
              ...attendanceData,
              participants: newParticipants,
            };
            setAttendanceData(newData);
            localStorage.setItem(`attendance-${date}`, JSON.stringify(newData));
            alert(`${editingName} さんの出席情報を削除しました。`);
            resetForm();
          }}
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
            <li
              key={name}
              onClick={() => startEdit(name)}
              style={{ cursor: "pointer" }}
            >
              {name} - 出席:{" "}
              {info.isPresent === true
                ? "〇"
                : info.isPresent === false
                ? "×"
                : "保留"}{" "}
              - 単位数: {info.units}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default DatePage;