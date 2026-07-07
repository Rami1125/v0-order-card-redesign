"use client";

import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase"; // נתיב חסין ומעודכן לפרויקט החדש
import { motion, AnimatePresence } from "motion/react";
import {
  Package, Clock, MapPin, Search, Volume2, VolumeX, Sun, Moon, MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// ממשק הזמנה תואם ב-100% לצינור המידע מה-Apps Script
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  time: string;
  destination: string;
  items: string;
  driverId: string;
  warehouse: string;
  status: "pending" | "preparing" | "ready" | "on_the_way" | "delivered" | "cancelled";
  eta: string;
  notes?: string;
  createdAt: string;
}

// מילון תרגום סטטוסים לעברית מלאה ומקצועית
const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "ממתין",
  preparing: "בהכנה",
  ready: "מוכן להעמסה",
  on_the_way: "בדרך לשטח",
  delivered: "נמסר",
  cancelled: "בוטל",
};

// מיפוי צבעי תגית לכל סטטוס לשליטה ויזואלית חדה
const STATUS_BADGE_CLASSES: Record<Order["status"], string> = {
  pending: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  preparing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  on_the_way: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  delivered: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  cancelled: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<"live" | "history">("live");

  const prevOrdersCount = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // אתחול קובץ השמע להתראה קולית
  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
  }, []);

  // האזנה בזמן אמת לפרויקט ה-Firebase החדש (whatsapp-8ffd1)
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });

        // מנגנון הפעלת צלצול בכניסת הזמנה חדשה
        if (prevOrdersCount.current !== null && fetchedOrders.length > prevOrdersCount.current) {
          if (isSoundEnabled && audioRef.current) {
            audioRef.current.play().catch((err) => console.log("Sound play blocked:", err));
            toast.success("הזמנה חדשה נכנסה למערכת ח.סבן!");
          }
        }

        setOrders(fetchedOrders);
        prevOrdersCount.current = fetchedOrders.length;
      },
      (error) => {
        console.error("Firestore listen error:", error);
      }
    );

    return () => unsubscribe();
  }, [isSoundEnabled]);

  // עדכון סטטוס, נהג או ETA ישירות לתוך Firebase
  const handleUpdateOrder = async (orderId: string, field: string, value: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updates: Record<string, string> = { [field]: value };

      if (field === "status" || field === "driverId") {
        updates.eta = "";
      }

      await updateDoc(orderRef, updates);
      toast.info("הכרטיס עודכן בהצלחה");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("שגיאה בעדכון הנתונים");
    }
  };

  // הפקת "דוח בוקר" לוואטסאפ של כל הזמנות פתוחות (ללא סינון תאריך)
  const handleMorningReport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const reportOrders = orders.filter((order) => order.status !== "delivered");

    if (reportOrders.length === 0) {
      toast.info("לא נמצאו הזמנות פתוחות שטרם נמסרו.");
      return;
    }

    const header = "☀️ *דוח סידור עבודה - ח.סבן לוגיסטיקה* ☀️\n---------------------------------------";

    const blocks = reportOrders.map((order) => {
      const driver = order.driverId && order.driverId !== "unassigned" ? order.driverId : "לא משויך";
      const eta = order.eta ? order.eta : "לא נקבעה";
      return (
        `📦 *הזמנה #${order.orderNumber}* | ${order.customerName}\n` +
        `📅 *תאריך:* ${order.date}\n` +
        `📍 *יעד:* ${order.destination}\n` +
        `🚚 *סטטוס:* ${STATUS_LABELS[order.status]} | *נהג:* ${driver}\n` +
        `⏰ *שעת אספקה:* ${eta}\n` +
        `📝 *תכולה:* ${order.items}\n` +
        `---------------------------------------`
      );
    });

    const fullMessage = `${header}\n${blocks.join("\n")}`;
    const encodedText = encodeURIComponent(fullMessage);
    
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
    toast.success(`הופק דוח עבור ${reportOrders.length} הזמנות פתוחות`);
  };

  // חישוב מוני ה-KPI לכרטיסי המדדים העליונים
  const stats = {
    total: orders.length,
    preparing: orders.filter((o) => o.status === "preparing" || o.status === "pending").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    noDriver: orders.filter((o) => !o.driverId || o.driverId === "unassigned").length,
  };

  // סינון קשוח: פיצול הזמנות פעילות בשטח מול דף היסטוריה (נמסר/בוטל)
  const viewFilteredOrders = orders.filter((order) => {
    if (viewMode === "live") {
      return order.status !== "delivered" && order.status !== "cancelled";
    } else {
      return order.status === "delivered" || order.status === "cancelled";
    }
  });

  // סינון משני לפי חיפוש וסלקטור הסטטוסים
  const filteredOrders = viewFilteredOrders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.orderNumber.includes(search) ||
      order.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ערכת נושא דינמית: משטחים וצבעים מתחלפים בין כהה לבהיר
  const t = isDarkMode
    ? {
        page: "bg-slate-950 text-slate-100",
        heading: "text-white",
        subtle: "text-slate-400",
        border: "border-slate-800",
        cardBg: "bg-slate-900",
        cardBorder: "border-slate-800",
        cardHover: "hover:border-slate-700",
        innerBg: "bg-slate-950",
        innerBorder: "border-slate-800/80",
        controlBg: "bg-slate-900/40",
        inputBg: "bg-slate-900",
        inputBorder: "border-slate-800",
        inputText: "text-white",
        controlInputBg: "bg-slate-950",
        muted: "text-slate-500",
        label: "text-slate-500",
        value: "text-slate-300",
      }
    : {
        page: "bg-slate-50 text-slate-900",
        heading: "text-slate-900",
        subtle: "text-slate-500",
        border: "border-slate-200",
        cardBg: "bg-white",
        cardBorder: "border-slate-200",
        cardHover: "hover:border-slate-300",
        innerBg: "bg-slate-100",
        innerBorder: "border-slate-200",
        controlBg: "bg-slate-100/60",
        inputBg: "bg-white",
        inputBorder: "border-slate-300",
        inputText: "text-slate-900",
        controlInputBg: "bg-white",
        muted: "text-slate-400",
        label: "text-slate-500",
        value: "text-slate-700",
      };

  return (
    <div className={`p-6 min-h-screen transition-colors duration-500 ${t.page}`} dir="rtl">
      {/* סרגל כלים עליון קבוע מעל האנימציות למניעת חסימת לחיצות */}
      <div className="relative z-50 flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-8 border-b border-slate-800/60 pb-4">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${t.heading}`}>
            {viewMode === "live" ? "לוח בקרה ח.סבן לוגיסטיקה" : "היסטוריית ארכיון הזמנות"}
          </h1>
          <p className={`${t.subtle} text-sm mt-1`}>
            {viewMode === "live" 
              ? "ניהול והפצת הזמנות לוגיסטיות בזמן אמת | מחובר ל-SabanOS" 
              : "מעקב וסיכום הזמנות שבוצעו או בוטלו במערכת"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* כפתור דף חדש: מעבר בין לוח פעיל להיסטוריית ארכיון */}
          <Button
            onClick={() => setViewMode((m) => (v => v === "live" ? "history" : "live")(m))}
            variant="outline"
            className="flex items-center gap-2 font-bold shadow-sm cursor-pointer"
          >
            {viewMode === "live" ? <Archive className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
            {viewMode === "live" ? "לצפייה בהיסטוריית הזמנות" : "חזרה ללוח זמנים פעיל"}
          </Button>

          <Button
            onClick={handleMorningReport}
            className="flex items-center gap-2 font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            הפקת דוח בוקר לוואטסאפ
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDarkMode((v) => !v)}
            className="flex items-center gap-2 font-bold cursor-pointer"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDarkMode ? "מצב בהיר" : "מצב כהה"}
          </Button>
          <Button
            variant={isSoundEnabled ? "default" : "destructive"}
            onClick={() => setIsSoundEnabled((v) => !v)}
            className="flex items-center gap-2 font-bold cursor-pointer"
          >
            {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {isSoundEnabled ? "התראות קוליות: פעיל" : "התראות קוליות: כבוי"}
          </Button>
        </div>
      </div>

      {/* כרטיסי KPI / מדדים עליונים */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className={`${t
