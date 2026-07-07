"use client";

import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
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

export interface Order {
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

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "ממתין",
  preparing: "בהכנה",
  ready: "מוכן להעמסה",
  on_the_way: "בדרך לשטח",
  delivered: "נמסר",
  cancelled: "בוטל",
};

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

  const isInitialLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(150));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let hasNewDoc = false;
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            hasNewDoc = true;
          }
        });

        const fetchedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });

        if (!isInitialLoad.current && hasNewDoc && isSoundEnabled && audioRef.current) {
          audioRef.current.play().catch((err) => console.log("Sound play blocked:", err));
          toast.success("הזמנה חדשה נכנסה למערכת!");
        }

        setOrders(fetchedOrders);
        isInitialLoad.current = false;
      },
      (error) => {
        console.error("Firestore listen error:", error);
        toast.error("שגיאה במשיכת נתונים מהשרת");
      }
    );

    return () => unsubscribe();
  }, [isSoundEnabled]);

  const handleUpdateOrder = async (orderId: string, field: keyof Order, value: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updates: Partial<Order> = { [field]: value as any };

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

  const handleMorningReport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const reportOrders = orders.filter((order) => order.status !== "delivered");

    if (reportOrders.length === 0) {
      toast.info("לא נמצאו הזמנות פתוחות שטרם נמסרו.");
      return;
    }

    const header = "☀️ *דוח סידור עבודה - לוגיסטיקה* ☀️\n---------------------------------------";

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

  const stats = {
    total: orders.length,
    preparing: orders.filter((o) => o.status === "preparing" || o.status === "pending").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    noDriver: orders.filter((o) => !o.driverId || o.driverId === "unassigned").length,
  };

  const viewFilteredOrders = orders.filter((order) => {
    if (viewMode === "live") {
      return order.status !== "delivered" && order.status !== "cancelled";
    } else {
      return order.status === "delivered" || order.status === "cancelled";
    }
  });

  // לוגיקת הסינון הורחבה כדי לתמוך בכפתורי ה-KPI המרוכזים
  const filteredOrders = viewFilteredOrders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.orderNumber.includes(search) ||
      order.destination.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = 
      filterStatus === "all" || 
      order.status === filterStatus ||
      (filterStatus === "preparing_pending" && (order.status === "preparing" || order.status === "pending")) ||
      (filterStatus === "no_driver" && (!order.driverId || order.driverId === "unassigned"));

    return matchesSearch && matchesStatus;
  });

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

  // פונקציית עזר לייצור הסטייל של כפתורי הסטטוס הלחיצים
  const getKpiCardStyle = (targetStatus: string, ringColor: string) => {
    const isActive = filterStatus === targetStatus;
    return `cursor-pointer transition-all duration-200 select-none active:scale-95 ${
      isActive ? `ring-2 ${ringColor} shadow-md` : "hover:-translate-y-1 hover:shadow-sm opacity-80 hover:opacity-100"
    } ${t.cardBg} ${t.cardBorder}`;
  };

  return (
    <div className={`p-6 min-h-screen transition-colors duration-500 ${t.page}`} dir="rtl">
      <div className="relative z-50 flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-8 border-b border-slate-800/60 pb-4">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${t.heading}`}>
            {viewMode === "live" ? "לוח בקרה לוגיסטיקה" : "היסטוריית ארכיון הזמנות"}
          </h1>
          <p className={`${t.subtle} text-sm mt-1`}>
            {viewMode === "live" 
              ? "ניהול והפצת הזמנות בזמן אמת" 
              : "מעקב וסיכום הזמנות שבוצעו או בוטלו במערכת"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setViewMode(viewMode === "live" ? "history" : "live")}
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
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-2 font-bold cursor-pointer"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDarkMode ? "מצב בהיר" : "מצב כהה"}
          </Button>
          <Button
            variant={isSoundEnabled ? "default" : "destructive"}
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="flex items-center gap-2 font-bold cursor-pointer"
          >
            {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {isSoundEnabled ? "התראות קוליות: פעיל" : "התראות קוליות: כבוי"}
          </Button>
        </div>
      </div>

      {/* כרטיסי KPI לחיצים המשמשים כסינון מהיר */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card onClick={() => setFilterStatus("all")} className={getKpiCardStyle("all", "ring-slate-400")}>
          <CardHeader className="pb-2"><CardTitle className={`text-xs ${t.subtle}`}>כל ההזמנות</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-black ${t.heading}`}>{stats.total}</p></CardContent>
        </Card>
        <Card onClick={() => setFilterStatus("preparing_pending")} className={getKpiCardStyle("preparing_pending", "ring-amber-500")}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-amber-500">בהכנה / ממתין</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-amber-500">{stats.preparing}</p></CardContent>
        </Card>
        <Card onClick={() => setFilterStatus("ready")} className={getKpiCardStyle("ready", "ring-emerald-500")}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-emerald-500">מוכן להעמסה</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-emerald-500">{stats.ready}</p></CardContent>
        </Card>
        <Card onClick={() => setFilterStatus("delivered")} className={getKpiCardStyle("delivered", "ring-blue-500")}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-blue-500">נמסר ללקוח</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-blue-500">{stats.delivered}</p></CardContent>
        </Card>
        <Card onClick={() => setFilterStatus("no_driver")} className={getKpiCardStyle("no_driver", "ring-rose-500")}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-rose-500">חסר נהג משובץ</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-rose-500">{stats.noDriver}</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className={`absolute right-3 top-3 h-4 w-4 ${t.muted}`} />
          <input
            type="text"
            placeholder="חפש לפי שם לקוח, מספר הזמנה או כתובת אספקה..."
            className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-lg pr-10 pl-4 py-2 ${t.inputText} focus:outline-none focus:border-slate-500`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className={`w-full md:w-[200px] ${t.inputBg} ${t.inputBorder} ${t.inputText}`}>
            <SelectValue placeholder="סנן לפי סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="preparing_pending">בהכנה / ממתין</SelectItem>
            <SelectItem value="no_driver">חסר נהג משובץ</SelectItem>
            <SelectItem value="pending">{STATUS_LABELS.pending}</SelectItem>
            <SelectItem value="preparing">{STATUS_LABELS.preparing}</SelectItem>
            <SelectItem value="ready">{STATUS_LABELS.ready}</SelectItem>
            <SelectItem value="on_the_way">{STATUS_LABELS.on_the_way}</SelectItem>
            <SelectItem value="delivered">{STATUS_LABELS.delivered}</SelectItem>
            <SelectItem value="cancelled">{STATUS_LABELS.cancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={spring}
            >
              <Card className={`${t.cardBg} ${t.cardBorder} ${t.cardHover} flex flex-col justify-between transition-colors h-full`}>
                <div>
                  <CardHeader className={`border-b ${t.innerBorder} pb-3 flex flex-row justify-between items-start space-y-0`}>
                    <div>
                      <span className={`text-xs ${t.muted} block font-mono font-bold`}>#{order.orderNumber}</span>
                      <CardTitle className={`text-lg font-black ${t.heading} mt-1`}>{order.customerName}</CardTitle>
                    </div>
                    <Badge variant="outline" className={`font-bold px-2.5 py-1 ${STATUS_BADGE_CLASSES[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4 text-sm">
                    <div className={`flex items-start gap-2 ${t.value}`}>
                      <MapPin className={`h-4 w-4 mt-0.5 ${t.muted} flex-shrink-0`} />
                      <span className="font-medium">{order.destination}</span>
                    </div>

                    <div className={`${t.innerBg} p-3 rounded-lg border ${t.innerBorder}`}>
                      <div className={`flex items-center gap-1.5 text-xs ${t.subtle} font-bold mb-2`}>
                        <Package className="h-3.5 w-3.5" />
                        <span>תכולת המשלוח</span>
                      </div>
                      <div className={`font-mono text-xs ${t.value} whitespace-pre-wrap leading-relaxed`}>
                        {order.items}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="text-xs text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 p-2 rounded">
                        ℹ️ {order.notes}
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className={`p-4 border-t ${t.innerBorder} ${t.controlBg} grid grid-cols-2 gap-3`}>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider ${t.label} font-bold block mb-1`}>נהג משובץ</label>
                    <Select
                      value={order.driverId || "unassigned"}
                      onValueChange={(val) => handleUpdateOrder(order.id, "driverId", val)}
                    >
                      <SelectTrigger className={`h-8 ${t.controlInputBg} ${t.inputBorder} text-xs font-medium ${t.inputText}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">לא משויך</SelectItem>
                        <SelectItem value="hikmat">חכמת (מנוף)</SelectItem>
                        <SelectItem value="ali">עלי (משאית)</SelectItem>
                        <SelectItem value="yoav">יואב (פיזור מהיר)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className={`text-[10px] uppercase tracking-wider ${t.label} font-bold block mb-1`}>עדכון סטטוס</label>
                    <Select
                      value={order.status}
                      onValueChange={(val) => handleUpdateOrder(order.id, "status", val)}
                    >
                      <SelectTrigger className={`h-8 ${t.controlInputBg} ${t.inputBorder} text-xs font-medium ${t.inputText}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">ממתין</SelectItem>
                        <SelectItem value="preparing">בהכנה</SelectItem>
                        <SelectItem value="ready">מוכן להעמסה</SelectItem>
                        <SelectItem value="on_the_way">בדרך לשטח</SelectItem>
                        <SelectItem value="delivered">נמסר</SelectItem>
                        <SelectItem value="cancelled">בוטל</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={`col-span-2 flex items-center justify-between mt-1 ${t.innerBg} p-2 rounded border ${t.innerBorder}`}>
                    <label htmlFor={`eta-${order.id}`} className={`flex items-center gap-1.5 text-xs ${t.subtle} font-bold`}>
                      <Clock className={`h-3.5 w-3.5 ${t.muted}`} />
                      <span>שעת אספקה מתוכננת:</span>
                    </label>
                    <input
                      id={`eta-${order.id}`}
                      type="time"
                      className={`h-7 ${t.inputBg} border ${t.inputBorder} rounded px-2 text-xs font-mono text-center ${t.inputText} focus:outline-none focus:border-slate-500`}
                      value={order.eta || ""}
                      onChange={(e) => handleUpdateOrder(order.id, "eta", e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
