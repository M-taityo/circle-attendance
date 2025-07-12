import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

function TotalsPage() {
  const [totals, setTotals] = useState({});
  const [cumulativeTotals, setCumulativeTotals] = useState({});
  const [participantsList, setParticipantsList] = useState([]);
  const [ranks, setRanks] = useState({});
  const [selectedName, setSelectedName] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const navigate = useNavigate();

  // 最新の級取得日を取得
  const getLatestRankDate = (name) => {
    const rankList = ranks[name];
    if (!Array.isArray(rankList) || rankList.length === 0) return null;
    const dates = rankList
      .map((entry) => new Date(entry.date))
      .filter((d) => !isNaN(d));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates));
  };

  // 参加者情報と級情報の取得
  useEffect(() => {
    async function fetchParticipants() {
      const snapshot = await getDocs(collection(db, "participants"));
      const list = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      setParticipantsList(list);
    }

    async function fetchRanks() {
      const snapshot = await getDocs(collection(db, "ranks"));
      const rankMap = {};
      snapshot.forEach((doc) => {
        rankMap[doc.id] = doc.data().ranks || [];
      });
      setRanks(rankMap);
    }

    fetchParticipants();
    fetchRanks();
  }, []);

  useEffect(() => {
  async function testFetchAttendance() {
    const snapshot = await getDocs(collection(db, "attendance"));
    console.log("attendance docs数:", snapshot.size);
    snapshot.forEach(doc => {
      console.log("attendance doc.id:", doc.id, "data:", doc.data());
    });
  }
  testFetchAttendance();
}, []);

  // 出席データ取得・合計計算・月リスト作成
  useEffect(() => {
    if (participantsList.length === 0 || Object.keys(ranks).length === 0) return;

 async function fetchAttendanceAndCalculate() {
  const totalsData = {};
  const cumulativeData = {};
  const monthSet = new Set();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // attendanceコレクションの月単位ドキュメントを取得
  const snapshot = await getDocs(collection(db, "attendance"));

  snapshot.forEach((doc) => {
    const monthDocId = doc.id; // 例: "2025-07"
    const monthData = doc.data();

    // 月ドキュメント内の日付単位データをループ
    Object.entries(monthData).forEach(([dateStr, dayData]) => {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj) || dateObj > today) return;

      // 月単位のセットに追加（yyyy-mm）
      monthSet.add(dateStr.slice(0, 7));

      if (!dayData?.participants) return;

      for (const [name, info] of Object.entries(dayData.participants)) {
        if (!info.isPresent) continue;
        const units = Number(info.units || 0);
        if (isNaN(units)) continue;

        cumulativeData[name] = (cumulativeData[name] || 0) + units;

        const thresholdDate = getLatestRankDate(name);
        if (thresholdDate) {
          const d = new Date(dateObj);
          d.setHours(0, 0, 0, 0);
          thresholdDate.setHours(0, 0, 0, 0);
          if (d < thresholdDate) continue;
        }

        totalsData[name] = (totalsData[name] || 0) + units;
      }
    });
  });

  // 参加者全員の初期化（データなしの人用）
  for (const p of participantsList) {
    if (!(p.name in totalsData)) totalsData[p.name] = 0;
    if (!(p.name in cumulativeData)) cumulativeData[p.name] = 0;
  }

  setTotals(totalsData);
  setCumulativeTotals(cumulativeData);
  setAvailableMonths(Array.from(monthSet).sort().reverse());
}

    fetchAttendanceAndCalculate();
  }, [participantsList, ranks]);

  // 名前クリックで出席履歴取得
const onClickName = async (name) => {
  const snapshot = await getDocs(collection(db, "attendance"));
  const records = [];

  snapshot.forEach((doc) => {
    const monthData = doc.data(); // 月単位のデータオブジェクト
    Object.entries(monthData).forEach(([dateStr, dailyData]) => {
      if (dailyData?.participants?.[name]?.isPresent) {
        records.push({
          type: "attendance",
          date: dateStr,
          units: Number(dailyData.participants[name].units || 0),
        });
      }
    });
  });

  // ランク情報も追加
  const rankList = ranks[name] || [];
  for (const { date, rank } of rankList) {
    records.push({ type: "rank", date, rank });
  }

  // 日付で降順ソート
  records.sort((a, b) => b.date.localeCompare(a.date));
  setSelectedName(name);
  setAttendanceList(records);
};

  // 曜日取得
  const getWeekday = (dateStr) => {
    const date = new Date(dateStr);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return weekdays[date.getDay()];
  };

  // 合計単位数を年度→単位数でソート
  const sortedEntries = Object.entries(totals)
    .map(([name, total]) => {
      const participant = participantsList.find((p) => p.name === name);
      const year = participant ? participant.year : 9999;
      return { name, total, year };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return b.total - a.total;
    });

  // 月別Excel出力
  const onExportMonthly = () => {
    if (!selectedMonth) return;
    navigate(`/monthly-export?month=${selectedMonth}`);
  };

  return (
    <div>
      <h1>合計単位数</h1>
      <button onClick={() => navigate(-1)}>← 戻る</button>

      <h2 style={{ marginTop: "20px" }}>📅 月別Excel出力</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="">-- 月を選択 --</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button onClick={onExportMonthly} disabled={!selectedMonth}>
          月別出力
        </button>
      </div>

      <ul>
        {sortedEntries.map(({ name, total, year }) => (
          <li
            key={name}
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => onClickName(name)}
          >
            {name}（{year === 9999 ? "年度不明" : year}年入学） : {total} 単位
            {cumulativeTotals[name] != null &&
              cumulativeTotals[name] !== total && (
                <>（累計：{cumulativeTotals[name]}単位）</>
              )}
          </li>
        ))}
      </ul>

      {selectedName && (
        <div>
          <h2>{selectedName} さんの出席履歴</h2>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>日付</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((entry, idx) => {
                const dateDisplay = `${entry.date}（${getWeekday(entry.date)}）`;
                if (entry.type === "rank") {
                  return (
                    <tr key={idx} style={{ backgroundColor: "#ffd" }}>
                      <td colSpan="2">{dateDisplay}：{entry.rank}</td>
                    </tr>
                  );
                }
                return (
                  <tr key={idx}>
                    <td>
                      <Link to={`/date/${entry.date}`}>{dateDisplay}</Link>
                    </td>
                    <td>{entry.units != null ? entry.units : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TotalsPage;