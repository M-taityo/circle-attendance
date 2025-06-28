import { useState, useEffect } from "react";

function RanksPage() {
  const [participants, setParticipants] = useState([]);
  const [ranksData, setRanksData] = useState({});
  const [selectedName, setSelectedName] = useState("");
  const [calendarDate, setCalendarDate] = useState("");
  const [selectedRank, setSelectedRank] = useState("");

  const rankOptions = ["無級", "三級", "一級", "初段", "二段", "三段"];

  // 初期読み込み：参加者 & 昇級データ
  useEffect(() => {
    const storedParticipants = localStorage.getItem("participants");
    const storedRanks = localStorage.getItem("ranks");

    if (storedParticipants) {
      setParticipants(JSON.parse(storedParticipants));
    }
    if (storedRanks) {
      setRanksData(JSON.parse(storedRanks));
    }
  }, []);

  // 昇級データの保存
  const saveRank = () => {
    if (!selectedName || !selectedRank || !calendarDate) {
      alert("すべての項目を入力してください。");
      return;
    }

    const updated = {
      ...ranksData,
      [selectedName]: [
        ...(ranksData[selectedName] || []),
        { rank: selectedRank, date: calendarDate },
      ].sort((a, b) => new Date(a.date) - new Date(b.date)), // 昇順ソート
    };

    setRanksData(updated);
    localStorage.setItem("ranks", JSON.stringify(updated));

    // 入力初期化
    setCalendarDate("");
    setSelectedRank("");
  };

  // 特定の履歴を削除
  const deleteRankEntry = (indexToDelete) => {
    if (!window.confirm("この履歴を削除しますか？")) return;

    const updatedList = (ranksData[selectedName] || []).filter(
      (_, index) => index !== indexToDelete
    );

    const updated = {
      ...ranksData,
      [selectedName]: updatedList,
    };

    setRanksData(updated);
    localStorage.setItem("ranks", JSON.stringify(updated));
  };

  return (
    <div>
      <h2>級・段管理ページ</h2>

      <div>
        <label>
          参加者選択：
          <select
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
          >
            <option value="">--選択--</option>
            {participants.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedName && (
        <>
          <div style={{ marginTop: "10px" }}>
            <label>
              昇級日：
              <input
                type="date"
                value={calendarDate}
                onChange={(e) => setCalendarDate(e.target.value)}
              />
            </label>
            <label style={{ marginLeft: "10px" }}>
              級・段：
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
              >
                <option value="">--選択--</option>
                {rankOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={saveRank} style={{ marginLeft: "10px" }}>
              登録
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3>{selectedName} の昇級・昇段履歴</h3>
            <ul>
              {(ranksData[selectedName] || []).map((entry, i) => (
                <li key={i}>
                  {entry.date}：{entry.rank}{" "}
                  <button
                    style={{
                      marginLeft: "10px",
                      color: "white",
                      backgroundColor: "red",
                      border: "none",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      cursor: "pointer",
                    }}
                    onClick={() => deleteRankEntry(i)}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default RanksPage;