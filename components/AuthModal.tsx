"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthModal({ onClose, initialMessage = "" }: { onClose: () => void; initialMessage?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!supabase || !email || password.length < 6) return;
    setLoading(true); setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: name || email.split("@")[0], username: `user_${Date.now().toString().slice(-6)}` } } });
    setLoading(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) return setMessage("메일함에서 가입 확인 링크를 눌러주세요.");
    onClose();
  };

  const signInWithGoogle = async () => {
    if (!supabase) return setMessage("Supabase 연결 정보를 확인해주세요.");
    setLoading(true); setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { access_type: "offline", prompt: "consent" } },
    });
    if (error) { setLoading(false); setMessage(error.message); }
  };

  return <div className="auth-backdrop" onMouseDown={onClose}>
    <section className="auth-modal" onMouseDown={(event) => event.stopPropagation()}>
      <button className="auth-close" onClick={onClose} aria-label="닫기"><X size={21} /></button>
      <div className="auth-logo">moi<span>.</span></div>
      <h2>{mode === "login" ? "다시 만나 반가워요" : "나만의 이야기를 시작해요"}</h2>
      <p>{mode === "login" ? "로그인하고 좋아하는 이야기를 이어서 읽어보세요." : "간단한 정보만 입력하면 바로 시작할 수 있어요."}</p>
      <button className="google-button" onClick={signInWithGoogle} disabled={loading}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.5 14.1a6 6 0 0 1 0-4.1V7.4H3.2a10 10 0 0 0 0 9.3l3.3-2.6Z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.2 7.4L6.5 10A5.8 5.8 0 0 1 12 6.1Z"/></svg>
        Google로 계속하기
      </button>
      <div className="auth-divider"><span>또는 이메일로 계속</span></div>
      {mode === "signup" && <label>이름<input value={name} onChange={(event) => setName(event.target.value)} placeholder="어떻게 불러드릴까요?" /></label>}
      <label>이메일<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="hello@example.com" /></label>
      <label>비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6자 이상 입력해주세요" onKeyDown={(event) => event.key === "Enter" && submit()} /></label>
      {message && <div className="auth-message">{message}</div>}
      <button className="auth-submit" disabled={loading || !email || password.length < 6} onClick={submit}>{loading ? "잠시만요…" : mode === "login" ? "로그인" : "회원가입"}</button>
      <button className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "처음이신가요? 회원가입" : "이미 계정이 있나요? 로그인"}</button>
    </section>
  </div>;
}
