"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function TerminalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (token) {
      try {
        // מפענח את הלינק המאובטח
        const decoded = atob(token); 
        const [id, role] = decoded.split(":");
        setUserData({ id, role });
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, [token]);

  if (!userData) return <div className="p-10 text-center text-white">טוען ממשק נהג...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white" dir="rtl">
      <h1 className="text-4xl font-black mb-8">שלום {userData.role === 'driver' ? 'נהג' : 'איש צוות'}</h1>
      {/* כאן נציג את ההזמנות שמשויכות ל-userData.id */}
      <div className="grid gap-4">
        <p>ממשק טאבלט מותאם אישית יופיע כאן בקרוב...</p>
      </div>
    </div>
  );
}
