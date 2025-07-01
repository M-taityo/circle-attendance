import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as XLSX from "xlsx";

function TotalsPage() {
  const [totals, setTotals] = useState({});
  const [cumulativeTotals, setCumulativeTotals] = useState({});
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
    const cumulativeData = {};
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

              const units = Number(info.units);
              cumulativeData[name] = (cumulativeData[name] || 0) + units;

              const thresholdDate = getLatestRankDate(name);
              if (thresholdDate) {
                const cloneDate = new Date(dateObj);
                cloneDate.setHours(0, 0, 0, 0);
                thresholdDate.setHours(0, 0, 0, 0);
                if (cloneDate < thresholdDate) continue;
              }

              totalsData[name] = (totalsData[name] || 0) + units;
            }
          }
        } catch {}
      }
    }

    for (const p of participantsList) {
      if (!(p.name in totalsData)) totalsData[p.name] = 0;
      if (!(p.name in cumulativeData)) cumulativeData[p.name] = 0;
    }

    setTotals(totalsData);
    setCumulativeTotals(cumulativeData);
  }, [grades]);

  const onClickName = (name) => {
    const list = [];

    // 出席記録
    for (let key in localStorage) {
      if (key.startsWith("attendance-")) {
        try {
          const dateStr = key.replace("attendance-", "");
          const dateObj = new Date(dateStr);
          if (isNaN(dateObj)) continue;

          const data = JSON.parse(localStorage.getItem(key));
          if (data?.participants?.[name]?.isPresent) {
            const info = data.participants[name];
            list.push({ type: "attendance", date: dateStr, units: info.units });
          }
        } catch {}
      }
    }

    // 昇級・昇段記録
    const ranks = grades[name] || [];
    for (const { date, rank } of ranks) {
      list.push({ type: "rank", date, rank });
    }

    // 両方まとめて日付順（降順）でソート
    list.sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;

      if (a.type === "attendance" && b.type === "rank") return -1;
      if (a.type === "rank" && b.type === "attendance") return 1;

      return 0;
    });
  
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

    const totalsSheet = [["名前", "入学年度", "合計単位数", "累計単位数"]];
    for (const { name, year, total } of sortedEntries) {
      const cumulative = cumulativeTotals[name] ?? total;
      totalsSheet.push([
        name,
        year === 9999 ? "" : year,
        total,
        cumulative,
      ]);
    }

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
       
        let total = 0;

        records
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach(({ date, weekday, units }) => {
            total += Number(units);
            attendanceSheet.push([name, date, weekday, units]);
          });

        // 累計（トータル）を追加
        attendanceSheet.push(["", "", "累計", total]);
      
        attendanceSheet.push([]);
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
                  <th>内容</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map((entry, idx) => {
                  const dateDisplay = `${entry.date}（${getWeekday(entry.date)}）`;

                  if (entry.type === "rank") {
                    return (
                      <tr
                        key={idx}
                        style={{ backgroundColor: "#ffd" }}
                      >
                        <td colSpan="2">{dateDisplay}：{entry.rank}</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={idx}>
                      <td>
                        <Link
                          to={`/date/${entry.date}`}
                          style={{ color: "blue", textDecoration: "underline" }}
                        >
                          {dateDisplay}
                        </Link>
                      </td>
                      <td>{entry.units}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default TotalsPage;