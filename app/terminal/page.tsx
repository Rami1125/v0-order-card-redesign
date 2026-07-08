"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// קומפוננטה פנימית שמטפלת בלוגיקה
function TerminalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [userData, setUserData] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = atob(token);
        const [id, role] = decoded.split(":");
        setUserData({ id, role });
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, [token]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-black">מסוף נהג</h1>
      {userData ? (
        <p className="mt-4">שלום, מזהה משתמש: {userData.id} | תפקיד: {userData.role}</p>
      ) : (
        <p className="mt-4">ממתין לטעינת נתונים...</p>
      )}
    </div>
  );
}

// ייצוא מפורש של הקומפוננטה הראשית שעוטפת את ה-Suspense
export default function TerminalPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white">טוען ממשק נהג...</div>}>
      <TerminalContent />
    </Suspense>
  );
}
