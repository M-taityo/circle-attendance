// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// ログイン機能を使うために以下も追加
import { getAuth } from "firebase/auth";

// Firebase 設定情報（そのまま貼ってOK）
const firebaseConfig = {
  apiKey: "AIzaSyB_0ui_PMILdC7N8GjjvkkNOOunplsvH1E",
  authDomain: "circleattendance.firebaseapp.com",
  projectId: "circleattendance",
  storageBucket: "circleattendance.firebasestorage.app",
  messagingSenderId: "908788109933",
  appId: "1:908788109933:web:c9764cfc35ee511d206564",
  measurementId: "G-ECTX9VKG11"
};

// 初期化
const app = initializeApp(firebaseConfig);

// Firestore のインスタンスを取得
export const db = getFirestore(app);

// 認証（ログイン機能）を使う場合はこちらも export
export const auth = getAuth(app);