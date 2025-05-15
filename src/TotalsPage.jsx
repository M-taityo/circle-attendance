import { useState, useEffect } from "react";

function TotalsPage() {
  const [totals, setTotals] = useState({});
  const [selectedName, setSelectedName] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);

  useEffect(() => {
    // 参加者ごとの合計単位数を計算
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
          // JSON parse error等は無視
        }
      }
    }
    setTotals(totalsData);
  }, []);

  // 名前クリック時の処理：出席履歴一覧を作る
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

    // 日付順（降順）に並べ替え
    list.sort((a, b) => (a.date < b.date ? 1 : -1));
    setSelectedName(name);
    setAttendanceList(list);
  };

  return (
    <div>
      <h1>参加者ごとの合計単位数</h1>
      {Object.keys(totals).length === 0 && <p>出席記録がありません</p>}
      <ul>
        {Object.entries(totals).map(([name, total]) => (
          <li key={name} style={{ cursor: "pointer", color: "blue" }} onClick={() => onClickName(name)}>
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
            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>日付</th>
                  <th>単位数</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map(({ date, units }) => (
                  <tr key={date}>
                    <td>{date}</td>
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
