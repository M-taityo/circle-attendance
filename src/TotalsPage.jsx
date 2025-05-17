import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function TotalsPage() {
  const [totals, setTotals] = useState({});
  const [selectedName, setSelectedName] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const totalsData = {};
    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.participants) {
            for (const [name, info] of Object.entries(data.participants)) {
              if (info.isPresent && !isNaN(info.units)) {
                totalsData[name] = (totalsData[name] || 0) + Number(info.units);
              }
            }
          }
        } catch {
          // ignore JSON parse errors
        }
      }
    }
    setTotals(totalsData);
  }, []);

  const onClickName = (name) => {
    const list = [];
    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.participants && data.participants[name]) {
            const info = data.participants[name];
            if (info.isPresent) {
              const date = key.replace("attendance-", "");
              list.push({ date, units: info.units });
            }
          }
        } catch {}
      }
    }
    list.sort((a, b) => (a.date < b.date ? 1 : -1));
    setSelectedName(name);
    setAttendanceList(list);
  };

  // 曜日を取得する関数
  const getWeekday = (dateStr) => {
    const date = new Date(dateStr);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return weekdays[date.getDay()];
  };

  // エクスポート処理
  const exportExcel = () => {
    // シート1：合計単位数一覧
    const totalsSheetData = [["名前", "合計単位数"]];
    for (const [name, total] of Object.entries(totals)) {
      totalsSheetData.push([name, total]);
    }

    // シート2：全参加者の出席履歴
    const attendanceSheetData = [["名前", "日付", "曜日", "単位数"]];
    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const date = key.replace("attendance-", "");
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.participants) {
            for (const [name, info] of Object.entries(data.participants)) {
              if (info.isPresent) {
                attendanceSheetData.push([
                  name,
                  date,
                  getWeekday(date),
                  info.units,
                ]);
              }
            }
          }
        } catch {}
      }
    }

    // ブック作成
    const wb = XLSX.utils.book_new();

    // 合計単位数シート追加
    const wsTotals = XLSX.utils.aoa_to_sheet(totalsSheetData);
    XLSX.utils.book_append_sheet(wb, wsTotals, "合計単位数");

    // 出席履歴シート追加
    const wsAttendance = XLSX.utils.aoa_to_sheet(attendanceSheetData);
    XLSX.utils.book_append_sheet(wb, wsAttendance, "出席履歴");

    // バイナリデータ作成
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // ファイル保存
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "attendance_totals.xlsx");
  };

  return (
    <div>
      <h1>合計単位数</h1>

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

      <button
        onClick={exportExcel}
        style={{
          marginLeft: "10px",
          marginBottom: "20px",
          padding: "6px 12px",
          fontSize: "16px",
          backgroundColor: "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        出席履歴と合計単位数をエクスポート
      </button>

      {Object.keys(totals).length === 0 && <p>出席記録がありません</p>}
      <ul>
        {Object.entries(totals).map(([name, total]) => (
          <li
            key={name}
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => onClickName(name)}
          >
            {name} : {total} 単位
          </li>
        ))}
      </ul>

      {selectedName && (
        <div>
          <h2>{selectedName} さんの出席履歴</h2>
          {attendanceList.length === 0 ? (
            <p>出席履歴がありません</p>
          ) : (
            <table
              border="1"
              cellPadding="5"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th>日付</th>
                  <th>単位数</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map(({ date, units }) => (
                  <tr key={date}>
                    <td>{date}（{getWeekday(date)}）</td>
                    <td>{units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default TotalsPage;
