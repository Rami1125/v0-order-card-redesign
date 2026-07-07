"use client";

import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase"; 
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Clock, MapPin, Search, Volume2, VolumeX, Sun, Moon, MessageCircle, Archive, LayoutDashboard
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
      const updates: any = { [field]: value };

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

  // הפקת דוח לוואטסאפ ללא תכולה וללא סטטוס - כולל מחסן לכל ההזמנות הפתוחות
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
      const warehouse = order.warehouse || order.notes || "לא נקבע";

      return (
        `📦 *הזמנה #${order.orderNumber}* | ${order.customerName}\n` +
        `📅 *תאריך:* ${order.date}\n` +
        `🏭 *מחסן יוצא:* ${warehouse}\n` +
        `📍 *יעד:* ${order.destination}\n` +
        `🚚 *נהג משובץ:* ${driver}\n` +
        `⏰ *שעת אספקה:* ${eta}\n` +
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
        controlBg
