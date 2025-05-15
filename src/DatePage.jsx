import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

function DatePage() {
  const { date } = useParams();

  const [attendanceData, setAttendanceData] = useState({ participants: {} });

  // 参加者名リストを保持する状態
  const [participantsList, setParticipantsList] = useState([]);

  // フォーム入力用の状態
  const [participantName, setParticipantName] = useState("");
  const [isPresent, setIsPresent] = useState(false);
  const [units, setUnits] = useState(1);

  // 「その他」の自由入力用
  const [customUnits, setCustomUnits] = useState("");

  const [editingName, setEditingName] = useState(null);

  useEffect(() => {
    // 出席データ読み込み
    const stored = localStorage.getItem(`attendance-${date}`);
    if (stored) {
      setAttendanceData(JSON.parse(stored));
    } else {
      setAttendanceData({ participants: {} });
    }

    // 参加者名リスト読み込み
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
    setIsPresent(false);
    setUnits(1);
    setCustomUnits("");
    setEditingName(null);
  };

  const saveAttendance = () => {
    if (!participantName.trim()) {
      alert("参加者名を入力してください");
      return;
    }

    // 単位数を決定（出席しない場合は0）
    let savedUnits = 0;
    if (isPresent) {
      if (units === "") {
        // 「その他」選択時は customUnits を数値変換
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
      [participantName]: { isPresent, units: savedUnits }
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
    // unitsがリストのどれにも当てはまらなければcustomUnitsにセット
    if ([1, 1.5, 2].includes(info.units)) {
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
      <p>出席者リストの名前をクリックすると編集モードになります。</p>

      <div>
        <label>
          参加者名：
          <input
            type="text"
            list="participants-list"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            disabled={editingName !== null}
          />
          <datalist id="participants-list">
            {participantsList.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
      </div>

      <div>
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
      </div>

      {isPresent && (
        <div>
          <label>
            単位数：
            <select
              value={units}
              onChange={(e) => {
                setUnits(e.target.value);
                if (e.target.value !== "") {
                  setCustomUnits("");
                }
              }}
            >
              <option value={1}>1単位</option>
              <option value={1.5}>1.5単位</option>
              <option value={2}>2単位</option>
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

      <button onClick={saveAttendance}>
        {editingName ? "更新" : "保存"}
      </button>

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
        {Object.entries(attendanceData.participants).map(([name, info]) => (
          <li
            key={name}
            onClick={() => startEdit(name)}
            style={{ cursor: "pointer" }}
          >
            {name} - 出席: {info.isPresent ? "〇" : "×"} - 単位数: {info.units}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DatePage;
