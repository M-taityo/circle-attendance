import { useState, useEffect } from "react";

function ParticipantsPage() {
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState("");
  const [year, setYear] = useState("");

  // 読み込み
  useEffect(() => {
    const stored = localStorage.getItem("participants");
    if (stored) {
      setParticipants(JSON.parse(stored));
    }
  }, []);

  // 保存処理
  const addParticipant = () => {
    if (!name.trim() || !year.trim()) {
      alert("氏名と入学年度の両方を入力してください");
      return;
    }

    const newParticipant = { name: name.trim(), year };
    const updated = [...participants, newParticipant];

    setParticipants(updated);
    localStorage.setItem("participants", JSON.stringify(updated));
    setName("");
    setYear("");
  };

  // 削除処理
  const deleteParticipant = (targetName) => {
    if (!window.confirm(`${targetName} を削除しますか？`)) return;
    const updated = participants.filter((p) => p.name !== targetName);
    setParticipants(updated);
    localStorage.setItem("participants", JSON.stringify(updated));
  };

  return (
    <div>
      <h2>参加者管理ページ</h2>

      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <label>
          氏名：
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="氏名を入力"
          />
        </label>
        <label style={{ marginLeft: "20px" }}>
          入学年度：
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">-- 選択 --</option>
            {Array.from({ length: 6 }, (_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </label>
        <button onClick={addParticipant} style={{ marginLeft: "10px" }}>
          登録
        </button>
      </div>

      <h3>参加者一覧</h3>
      <ul>
        {participants.map((p) => (
          <li key={p.name}>
            {p.name}（{p.year}年入学）{" "}
            <button onClick={() => deleteParticipant(p.name)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ParticipantsPage;