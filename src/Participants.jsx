import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ← 追加

function Participants() {
  const [participants, setParticipants] = useState([]);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate(); // ← 戻る機能用

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('participants')) || [];
    setParticipants(saved);
  }, []);

  const saveParticipants = (list) => {
    localStorage.setItem('participants', JSON.stringify(list));
  };

  const addParticipant = () => {
    if (newName.trim() === '') return;
    const updated = [...participants, newName.trim()];
    setParticipants(updated);
    saveParticipants(updated);
    setNewName('');
  };

  const removeParticipant = (name) => {
    const updated = participants.filter(p => p !== name);
    setParticipants(updated);
    saveParticipants(updated);
  };

  return (
    <div>
      <h2>参加者リスト管理</h2>

      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '20px',
          padding: '6px 12px',
          fontSize: '16px',
          backgroundColor: '#eee',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ← 戻る
      </button>

      <input
        type="text"
        placeholder="名前を入力"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <button onClick={addParticipant}>追加</button>

      <ul>
        {participants.map(name => (
          <li key={name}>
            {name} <button onClick={() => removeParticipant(name)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Participants;
