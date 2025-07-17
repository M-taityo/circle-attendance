import { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { db } from "../firebase"; // firebase.js のパスに合わせて調整してください

function ParticipantsPage() {
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState("");
  const [year, setYear] = useState("");

  // Firestoreから参加者を読み込む
  const loadParticipants = async () => {
    try {
      const participantsCol = collection(db, "participants");
      const snapshot = await getDocs(participantsCol);
      const list = snapshot.docs.map(doc => doc.data());
  
      // 入学年度（year）で昇順ソート
      list.sort((a, b) => Number(a.year) - Number(b.year));

      setParticipants(list);
    } catch (error) {
      console.error("参加者の読み込みエラー:", error);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, []);

  // 参加者追加（Firestoreに書き込み）
  const addParticipant = async () => {
    if (!name.trim() || !year.trim()) {
      alert("氏名と入学年度の両方を入力してください");
      return;
    }
    const newParticipant = { name: name.trim(), year, ranks: [] };

    try {
      // ドキュメントIDに氏名を使う例。ユニークIDなら better
      await setDoc(doc(db, "participants", newParticipant.name), newParticipant);

      // ローカルステート更新（再読み込みでも良い）
      setParticipants((prev) => [...prev, newParticipant]);

      setName("");
      setYear("");
    } catch (error) {
      console.error("参加者の追加エラー:", error);
      alert("参加者の追加に失敗しました");
    }
  };

  // 参加者削除（Firestoreからも削除）
  const deleteParticipant = async (targetName) => {
    if (!window.confirm(`${targetName} を削除しますか？`)) return;

    try {
      await deleteDoc(doc(db, "participants", targetName));
      setParticipants((prev) => prev.filter((p) => p.name !== targetName));
    } catch (error) {
      console.error("参加者の削除エラー:", error);
      alert("参加者の削除に失敗しました");
    }
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
            {Array.from({ length: 8 }, (_, i) => {
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