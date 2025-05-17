import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function DatePage() {
  const { date } = useParams();
  const navigate = useNavigate(); // ← 戻るボタン用

  const [attendanceData, setAttendanceData] = useState({ participants: {} });
  const [participantsList, setParticipantsList] = useState([]);

  const [participantName, setParticipantName] = useState("");
  const [isPresent, setIsPresent] = useState(true); // デフォルト〇
  const [units, setUnits] = useState(2);
  const [customUnits, setCustomUnits] = useState("");
  const [editingName, setEditingName] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(`attendance-${date}`);
    if (stored) {
      setAttendanceData(JSON.parse(stored));
    } else {
      setAttendanceData({ participants: {} });
    }

    const storedParticipants = localStorage.getItem("participants");
    if (storedParticipants) {
      setParticipantsList(JSON.parse(storedParticipants));
    } else {
      setParticipantsList([]);
    }

    resetForm();
  }, [date]);

  const resetForm = () => {
  setParticipantName("");
  setIsPresent(true); // デフォルト〇

  // 日付を元に土曜日なら2.5単位、それ以外は2単位をデフォルト
  const selectedDate = new Date(date);
  if (selectedDate.getDay() === 6) {
    setUnits(2.5); // 土曜日
  } else {
    setUnits(2); // 平日や日曜など
  }

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

    const newData = { participants: newParticipants };
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
  };

  return (
    <div>
      <h2>{date} の出席登録</h2>

      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "20px",
          padding: "6px 12px",
          fontSize: "16px",
          backgroundColor: "#eee",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ← 戻る
      </button>

      <p>出席者リストの名前をクリックすると編集モードになります。</p>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>
          参加者名：
          <select
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            disabled={editingName !== null}
          >
            <option value="">-- 参加者を選択 --</option>
            {participantsList.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>出席する：</label>
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
            const newData = { participants: newParticipants };
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
