// LoginPage.jsx
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function LoginPage() {
  const [email, setEmail] = useState("");       // メールアドレス入力
  const [password, setPassword] = useState(""); // パスワード入力
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 認証成功時、App.jsx側の onAuthStateChanged が反応して画面が切り替わる
    } catch (e) {
      setError("ログインに失敗しました：" + e.message);
    }
  };

  return (
    <div>
      <h2>ログイン</h2>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /><br />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br />
      <button onClick={handleLogin}>ログイン</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default LoginPage;