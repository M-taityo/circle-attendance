import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as XLSX from "xlsx";

function TotalsPage() {
  const [totals, setTotals] = useState({});
  const [participantsList, setParticipantsList] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null); // ダウンロードURL保存
  const navigate = useNavigate();

  useEffect(() => {
    const storedParticipants = localStorage.getItem("participants");
    if (storedParticipants) {
      try {
        const parsed = JSON.parse(storedParticipants);
        setParticipantsList(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const totalsData = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const dateStr = key.replace("attendance-", "");
          const dateObj = new Date(dateStr);
          if (dateObj > today) continue;

          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.participants) {
            for (const [name, info] of Object.entries(data.participants)) {
              if (info.isPresent && !isNaN(info.units)) {
                totalsData[name] = (totalsData[name] || 0) + Number(info.units);
              }
            }
          }
        } catch {}
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

  const getWeekday = (dateStr) => {
    const date = new Date(dateStr);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return weekdays[date.getDay()];
  };

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

  const exportExcel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalsSheetData = [["名前", "入学年度", "合計単位数"]];
    for (const { name, year, total } of sortedEntries) {
      totalsSheetData.push([name, year === 9999 ? "" : year, total]);
    }

    const attendanceSheetData = [["名前", "日付", "曜日", "単位数"]];
    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const dateStr = key.replace("attendance-", "");
          const dateObj = new Date(dateStr);
          if (dateObj > today) continue;

          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.participants) {
            for (const [name, info] of Object.entries(data.participants)) {
              if (info.isPresent) {
                attendanceSheetData.push([
                  name,
                  dateStr,
                  getWeekday(dateStr),
                  info.units,
                ]);
              }
            }
          }
        } catch {}
      }
    }

    const wb = XLSX.utils.book_new();
    const wsTotals = XLSX.utils.aoa_to_sheet(totalsSheetData);
    XLSX.utils.book_append_sheet(wb, wsTotals, "合計単位数");
    const wsAttendance = XLSX.utils.aoa_to_sheet(attendanceSheetData);
    XLSX.utils.book_append_sheet(wb, wsAttendance, "出席履歴");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    // 以前のURLを解放
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    const url = URL.createObjectURL(blob);
    setDownloadUrl(url); // 👈 URLをセット
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

      {/* スマホ対応ダウンロードリンク表示 */}
      {downloadUrl && (
        <div style={{ marginTop: "10px" }}>
          <a
            href={downloadUrl}
            download="attendance_totals.xlsx"
            style={{
              display: "inline-block",
              padding: "8px 12px",
              backgroundColor: "#4caf50",
              color: "white",
              borderRadius: "4px",
              textDecoration: "none",
            }}
          >
            Excelファイルをダウンロード
          </a>
        </div>
      )}

      {sortedEntries.length === 0 && <p>出席記録がありません</p>}
      <ul>
        {sortedEntries.map(({ name, total, year }) => (
          <li
            key={name}
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => onClickName(name)}
          >
            {name}（{year === 9999 ? "年度不明" : year}年入学） : {total} 単位
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
                    <td>
                      <Link
                        to={`/date/${date}`}
                        style={{ color: "blue", textDecoration: "underline" }}
                      >
                        {date}（{getWeekday(date)}）
                      </Link>
                    </td>
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