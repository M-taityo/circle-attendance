import { useState, useEffect } from "react";
import { db } from "../firebase"; // firebase.jsの場所に合わせて調整してください
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

function RanksPage() {
  const [participants, setParticipants] = useState([]);
  const [ranksData, setRanksData] = useState({});
  const [selectedName, setSelectedName] = useState("");
  const [calendarDate, setCalendarDate] = useState("");
  const [selectedRank, setSelectedRank] = useState("");

  const rankOptions = ["無級", "三級", "一級", "初段", "二段", "三段"];

  // 参加者をFirestoreから読み込む
  useEffect(() => {
    async function fetchParticipants() {
      try {
        const querySnapshot = await getDocs(collection(db, "participants"));
        const loadedParticipants = [];
        querySnapshot.forEach((doc) => {
          loadedParticipants.push(doc.data());
        });

        // 入学年度（year）で昇順ソート
        loadedParticipants.sort((a, b) => a.year - b.year);

        setParticipants(loadedParticipants);
      } catch (error) {
        console.error("参加者の読み込みに失敗しました", error);
      }
    }

    fetchParticipants();
  }, []);

  // 選択された参加者の級・段データをFirestoreから読み込む
  useEffect(() => {
    if (!selectedName) {
      setRanksData({});
      return;
    }

    async function fetchRanks() {
      try {
        const docRef = doc(db, "ranks", selectedName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRanksData((prev) => ({
            ...prev,
            [selectedName]: docSnap.data().ranks || [],
          }));
        } else {
          setRanksData((prev) => ({
            ...prev,
            [selectedName]: [],
          }));
        }
      } catch (error) {
        console.error("昇級データの読み込みに失敗しました", error);
      }
    }

    fetchRanks();
  }, [selectedName]);

  // 昇級データの保存（Firestoreに書き込み）
  const saveRank = async () => {
    if (!selectedName || !selectedRank || !calendarDate) {
      alert("すべての項目を入力してください。");
      return;
    }

    try {
      const prevRanks = ranksData[selectedName] || [];
      const updatedRanks = [...prevRanks, { rank: selectedRank, date: calendarDate }].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      const docRef = doc(db, "ranks", selectedName);
      await setDoc(docRef, { ranks: updatedRanks });

      setRanksData((prev) => ({
        ...prev,
        [selectedName]: updatedRanks,
      }));

      setCalendarDate("");
      setSelectedRank("");
    } catch (error) {
      console.error("昇級データの保存に失敗しました", error);
      alert("保存に失敗しました。再度お試しください。");
    }
  };

  // 履歴削除（Firestore上の配列から該当要素を除外して更新）
  const deleteRankEntry = async (indexToDelete) => {
    if (!window.confirm("この履歴を削除しますか？")) return;

    try {
      const prevRanks = ranksData[selectedName] || [];
      const updatedRanks = prevRanks.filter((_, i) => i !== indexToDelete);

      const docRef = doc(db, "ranks", selectedName);
      await setDoc(docRef, { ranks: updatedRanks });

      setRanksData((prev) => ({
        ...prev,
        [selectedName]: updatedRanks,
      }));
    } catch (error) {
      console.error("削除に失敗しました", error);
      alert("削除に失敗しました。再度お試しください。");
    }
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