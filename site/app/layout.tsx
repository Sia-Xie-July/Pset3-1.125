import type { Metadata } from "next";
import "./globals.css";
import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from './chatgpt-auth';
import { Navigation } from './navigation';

export const metadata: Metadata = {
  title: "Global Datacenter Design Explorer",
  description: "Evidence, assumptions and an initial university AI datacenter design comparing Finland, Canada and Singapore.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getChatGPTUser();
  return (
    <html lang="en">
      <body><a className="skip" href="#main">Skip to content</a><div className="shell"><aside className="sidebar"><a className="brand" href="/"><span className="brand-mark">D</span><span><small>GLOBAL</small>Datacenter<br/>Design Explorer</span></a><Navigation/><div className="sidebar-bottom"><span className="eyebrow">Design case</span><strong>Kajaani, Finland</strong><p>University consortium<br/>Initial concept · October 2026</p></div></aside><div className="workspace"><header className="topbar"><span>Investment committee workspace</span><div>{user?<><a className="account-name" href="/account">{user.displayName}</a><a className="button secondary" href={chatGPTSignOutPath()} target="_top">Sign out</a></>:<><a className="button" href={chatGPTSignInPath('/register')} target="_top">Sign in with ChatGPT</a></>}</div></header><main id="main">{children}</main><footer>Initial design concept. Site capacity, performance and investment feasibility remain subject to verification.</footer></div></div></body>
    </html>
  );
}
