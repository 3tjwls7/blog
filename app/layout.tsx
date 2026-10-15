import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOI — 나다운 이야기가 모이는 곳",
  description: "읽고, 쓰고, 연결되는 새로운 블로그 커뮤니티",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
