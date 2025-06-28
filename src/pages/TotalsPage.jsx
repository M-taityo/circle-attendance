import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as XLSX from "xlsx";

function TotalsPage() {
  const [totals, setTotals] = useState({});
  const [participantsList, setParticipantsList] = useState([]);
  const [grades, setGrades] = useState({});
  const [selectedName, setSelectedName] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const navigate = useNavigate();

  const getLatestRankDate = (name) => {
    const rankList = grades[name];
    if (!Array.isArray(rankList) || rankList.length === 0) return null;
    const dates = rankList
      .map((entry) => new Date(entry.date))
      .filter((d) => !isNaN(d));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates));
  };

  useEffect(() => {
    const storedParticipants = localStorage.getItem("participants");
    if (storedParticipants) {
      try {
        setParticipantsList(JSON.parse(storedParticipants));
      } catch {}
    }

    const storedRanks = localStorage.getItem("ranks");
    if (storedRanks) {
      try {
        setGrades(JSON.parse(storedRanks));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const totalsData = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const dateStr = key.replace("attendance-", "");
          const dateObj = new Date(dateStr);
          if (isNaN(dateObj) || dateObj > today) continue;

          const data = JSON.parse(localStorage.getItem(key));
          if (data?.participants) {
            for (const [name, info] of Object.entries(data.participants)) {
              if (!info.isPresent || isNaN(info.units)) continue;

              const thresholdDate = getLatestRankDate(name);
              if (thresholdDate) {
                const cloneDate = new Date(dateObj);
                cloneDate.setHours(0, 0, 0, 0);
                thresholdDate.setHours(0, 0, 0, 0);
                if (cloneDate < thresholdDate) continue;
              }

              totalsData[name] = (totalsData[name] || 0) + Number(info.units);
            }
          }
        } catch {}
      }
    }

    setTotals(totalsData);
  }, [grades]);

  const onClickName = (name) => {
    const list = [];
    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const dateStr = key.replace("attendance-", "");
          const dateObj = new Date(dateStr);
          if (isNaN(dateObj)) continue;

          const data = JSON.parse(localStorage.getItem(key));
          if (data?.participants?.[name]?.isPresent) {
            const info = data.participants[name];
            list.push({ date: dateStr, units: info.units });
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

    const totalsSheet = [["名前", "入学年度", "合計単位数"]];
    for (const { name, year, total } of sortedEntries) {
      totalsSheet.push([name, year === 9999 ? "" : year, total]);
    }

    // 出席履歴シート（名前ごとにまとめ、日付降順）
    const attendanceData = {};

    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const dateStr = key.replace("attendance-", "");
          const dateObj = new Date(dateStr);
          if (isNaN(dateObj) || dateObj > today) continue;

          const data = JSON.parse(localStorage.getItem(key));
          if (data?.participants) {
            for (const [name, info] of Object.entries(data.participants)) {
              if (!info.isPresent) continue;

              if (!attendanceData[name]) attendanceData[name] = [];
              attendanceData[name].push({
                date: dateStr,
                weekday: getWeekday(dateStr),
                units: info.units,
              });
            }
          }
        } catch {}
      }
    }

    const attendanceSheet = [[]];
  Object.entries(attendanceData)
    .sort(([a], [b]) => a.localeCompare(b, "ja"))
    .forEach(([name, records]) => {
      attendanceSheet.push([`${name} さんの出席履歴`]);
      attendanceSheet.push(["名前", "日付", "曜日", "単位数"]);

      records
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(({ date, weekday, units }) => {
          attendanceSheet.push([name, date, weekday, units]);
        });

      attendanceSheet.push([]); // 空行で区切る（お好みで）
    });


    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(totalsSheet);
    const ws2 = XLSX.utils.aoa_to_sheet(attendanceSheet);
    XLSX.utils.book_append_sheet(wb, ws1, "合計単位数");
    XLSX.utils.book_append_sheet(wb, ws2, "出席履歴");

    const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
    const url = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_data.xlsx";
    a.click();
  };

  return (
    <div>
      <h1>合計単位数</h1>

      <button onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
        ← 戻る
      </button>

      <button
        onClick={exportExcel}
        style={{ marginLeft: "10px", marginBottom: "20px" }}
      >
        Excelファイルでエクスポート
      </button>

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
                        style={{
                          color: "blue",
                          textDecoration: "underline",
                        }}
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