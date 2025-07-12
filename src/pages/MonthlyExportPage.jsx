import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";

function MonthlyExportPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exportDone, setExportDone] = useState(false);
  const hasRun = useRef(false); // 二重実行防止

  const selectedMonth = searchParams.get("month"); // 例: "2024-07"
  if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) {
    return <p>URLの月指定が正しくありません。</p>;
  }

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function fetchAndExport() {
      try {
        const participantsSnapshot = await getDocs(collection(db, "participants"));
        const participantList = [];
        participantsSnapshot.forEach((doc) => {
          participantList.push(doc.data());
        });

        const ranksSnapshot = await getDocs(collection(db, "ranks"));
        const rankMap = {};
        ranksSnapshot.forEach((doc) => {
          rankMap[doc.id] = doc.data().ranks || [];
        });

        const getLatestRankDate = (name) => {
          const list = rankMap[name] || [];
          const dates = list.map((r) => new Date(r.date)).filter((d) => !isNaN(d));
          if (dates.length === 0) return null;
          return new Date(Math.max(...dates));
        };

        const attendanceSnapshot = await getDocs(collection(db, "attendance"));
        const filtered = {};
        const [year, month] = selectedMonth.split("-").map(Number);

      attendanceSnapshot.forEach((doc) => {
       const monthData = doc.data(); // 各月ドキュメントの内容（例: { '2025-07-01': {...}, ... }）
       console.log("doc.id:", doc.id, "→ keys:", Object.keys(monthData)); // デバッグ用

       for (const dateStr in monthData) {
         const dateObj = new Date(dateStr);
         console.log("  date:", dateStr, "→", dateObj); // デバッグ用

         if (
           dateObj.getFullYear() === year &&
           dateObj.getMonth() + 1 === month
         ) {
           const { participants } = monthData[dateStr];
           if (!participants) continue;

           for (const [name, info] of Object.entries(participants)) {
             if (!info.isPresent) continue;

             const latestRankDate = getLatestRankDate(name);
             if (latestRankDate && dateObj < latestRankDate) continue;

             if (!filtered[name]) filtered[name] = [];
             filtered[name].push({
               date: dateStr,
               weekday: ["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()],
               units: Number(info.units || 0),
             });
           }
         }
       }
     });


        // Excel作成
        const sheetData = [];
        Object.entries(filtered)
          .sort(([a], [b]) => a.localeCompare(b, "ja"))
          .forEach(([name, records]) => {
            const participant = participantList.find((p) => p.name === name);
            const year = participant ? participant.year : "";
            sheetData.push([`${name} さん（${year}年入学）の出席履歴`]);
            sheetData.push(["名前", "日付", "曜日", "単位数"]);

            let total = 0;
            records
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .forEach(({ date, weekday, units }) => {
                total += Number(units);
                sheetData.push([name, date, weekday, units]);
              });

            sheetData.push(["", "", "合計", total]);
            sheetData.push([]);
          });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, selectedMonth);

        XLSX.writeFile(wb, `attendance_${selectedMonth}.xlsx`);
        setExportDone(true);
      } catch (error) {
        console.error("エクスポート中にエラーが発生しました", error);
        alert("エクスポートに失敗しました。");
      } finally {
        setLoading(false); // 最後に実行
      }
    }

    fetchAndExport();
  }, []);

  return (
    <div style={{ padding: "1em" }}>
      <h2>月別エクスポート</h2>
      {loading && <p>{selectedMonth} のデータをエクスポート中です...</p>}
      {!loading && exportDone && (
        <>
          <p>✅ {selectedMonth} のExcel出力が完了しました。</p>
          <button onClick={() => navigate(-1)}>← 合計ページに戻る</button>
        </>
      )}
    </div>
  );
}

export default MonthlyExportPage;