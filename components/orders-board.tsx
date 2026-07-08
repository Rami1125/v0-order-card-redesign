"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase"; 
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Clock, MapPin, Search, Volume2, VolumeX, Sun, Moon, MessageCircle, Archive, LayoutDashboard, AlertCircle, Truck, Settings, Lock, X, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
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

const PIPELINE_STAGES = [
  { id: "pending", label: "ממתין" },
  { id: "preparing", label: "בהכנה" },
  { id: "ready", label: "מוכן" },
  { id: "on_the_way", label: "בדרך" },
  { id: "delivered", label: "נמסר" },
];

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export default function OrdersBoard() {
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<"live" | "history">("live");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Admin Auth State
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPwd, setAdminPwd] = useState("");

  const isInitialLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
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

        if (!isInitialLoad.current && hasNewDoc) {
          if (isSoundEnabled && audioRef.current) {
            audioRef.current.play().catch((err) => console.log("Sound play blocked:", err));
          }
          toast.success("הזמנה חדשה נכנסה למערכת!");
          
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 1500);
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

  const handleToggleSound = async () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);

    if (newState && audioRef.current) {
      try {
        audioRef.current.volume = 0;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.volume = 1;
        audioRef.current.currentTime = 0;
        toast.success("התראות קוליות אושרו על ידי הדפדפן");
      } catch (e) {
        console.log("Audio unlock failed", e);
      }
    }
  };

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

  const getEtaStatus = (order: Order) => {
    if (!order.eta || order.status === "delivered" || order.status === "cancelled") return "normal";

    const [etaHours, etaMinutes] = order.eta.split(":").map(Number);
    if (isNaN(etaHours) || isNaN(etaMinutes)) return "normal";

    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    const totalEta = etaHours * 60 + etaMinutes;
    const totalCurrent = currentHours * 60 + currentMinutes;
    const diff = totalEta - totalCurrent;

    if (diff < 0) return "overdue";
    if (diff <= 15) return "warning";
    return "normal";
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPwd === "1125") {
      setShowAdminAuth(false);
      setAdminPwd("");
      toast.success("גישה אושרה בהצלחה!");
      router.push("/management"); 
    } else {
      toast.error("סיסמה שגויה, הגישה נדחתה");
      setAdminPwd("");
    }
  };

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const driverWorkload = {
    hikmat: activeOrders.filter(o => o.driverId === "hikmat").length,
    ali: activeOrders.filter(o => o.driverId === "ali").length,
    yoav: activeOrders.filter(o => o.driverId === "yoav").length,
    unassigned: activeOrders.filter(o => !o.driverId || o.driverId === "unassigned").length,
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
        pipelineBg: "bg-slate-800",
        pipelineEmpty: "bg-slate-900",
        pipelineBorder: "border-slate-700",
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
        pipelineBg: "bg-slate-200",
        pipelineEmpty: "bg-white",
        pipelineBorder: "border-slate-300",
      };

  const getKpiCardStyle = (targetStatus: string, ringColor: string) => {
    const isActive = filterStatus === targetStatus;
    return `cursor-pointer transition-all duration-200 select-none active:scale-95 ${
      isActive ? `ring-2 ${ringColor} shadow-md` : "hover:-translate-y-1 hover:shadow-sm opacity-80 hover:opacity-100"
    } ${t.cardBg} ${t.cardBorder}`;
  };

  return (
    <SidebarProvider>
      <div className={`flex min-h-screen w-full ${t.page}`} dir="rtl">
        <Sidebar className="border-r border-slate-800">
          <SidebarContent className="bg-slate-900 pt-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/management')}>
                  <LayoutDashboard className="size-4" /> לוח סידור
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/invoices')}>
                  <FileText className="size-4" /> תעודות משלוח
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        
        <main className="flex-1 p-6 transition-colors duration-500 relative">
          <AnimatePresence>
            {showAdminAuth && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
                >
                  <button 
                    onClick={() => { setShowAdminAuth(false); setAdminPwd(""); }}
                    className="absolute top-4 left-4 text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  
                  <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-emerald-500" />
                    גישת מנהל
                  </h2>
                  <p className="text-sm text-slate-400 mb-6">הזן סיסמת הרשאה למעבר לדף ניהול המערכת.</p>
                  
                  <form onSubmit={handleAdminAuth} className="space-y-4">
                    <div>
                      <input
                        type="password"
                        autoFocus
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-center tracking-[1em] text-xl font-mono"
                        placeholder="****"
                        value={adminPwd}
                        onChange={(e) => setAdminPwd(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
                      כניסה לניהול צוות
                    </Button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center backdrop-blur-[2px]"
              >
                <div className="bg-emerald-500/90 text-white px-10 py-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.5)] flex flex-col items-center gap-4">
                  <span className="text-7xl animate-bounce">📦🎉</span>
                  <h2 className="text-3xl font-black tracking-tight">הזמנה חדשה נחתה!</h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                onClick={() => setShowAdminAuth(true)}
                variant="outline"
                size="icon"
                className="flex items-center justify-center font-bold shadow-sm cursor-pointer border-slate-700 hover:bg-slate-800"
                title="ניהול מערכת ומשתמשים"
              >
                <Settings className="h-5 w-5 text-slate-300" />
              </Button>

              <Button
                onClick={() => setViewMode(viewMode === "live" ? "history" : "live")}
                variant="outline"
                className="flex items-center gap-2 font-bold shadow-sm cursor-pointer border-slate-700 hover:bg-slate-800"
              >
                {viewMode === "live" ? <Archive className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
                {viewMode === "live" ? "לצפייה בהיסטוריית הזמנות" : "חזרה ללוח זמנים פעיל"}
              </Button>

              <Button
                onClick={() => router.push('/invoices')}
                className="bg-blue-600 hover:bg-blue-700 font-bold flex items-center gap-2"
              >
                <FileText className="size-4" /> תעודות משלוח
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
                className="flex items-center gap-2 font-bold cursor-pointer border-slate-700 hover:bg-slate-800"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? "מצב בהיר" : "מצב כהה"}
              </Button>
              <Button
                variant={isSoundEnabled ? "default" : "destructive"}
                onClick={handleToggleSound}
                className="flex items-center gap-2 font-bold cursor-pointer"
              >
                {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {isSoundEnabled ? "התראות קוליות: פעיל" : "התראות קוליות: כבוי"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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

          <div className={`mb-6 p-4 rounded-xl border ${t.cardBg} ${t.cardBorder} flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm`}>
            <div className={`text-sm font-bold ${t.heading} flex items-center gap-2`}>
              <Truck className="h-5 w-5 text-emerald-500" />
              מאזן עומס נהגים (משלוחים פעילים בדרך):
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className={`px-3 py-1.5 font-bold ${t.cardBorder} ${t.heading}`}>
                חכמת: <span className="text-blue-500 ml-1 text-base">{driverWorkload.hikmat}</span>
              </Badge>
              <Badge variant="outline" className={`px-3 py-1.5 font-bold ${t.cardBorder} ${t.heading}`}>
                עלי: <span className="text-emerald-500 ml-1 text-base">{driverWorkload.ali}</span>
              </Badge>
              <Badge variant="outline" className={`px-3 py-1.5 font-bold ${t.cardBorder} ${t.heading}`}>
                יואב: <span className="text-amber-500 ml-1 text-base">{driverWorkload.yoav}</span>
              </Badge>
              {driverWorkload.unassigned > 0 && (
                <Badge variant="outline" className={`px-3 py-1.5 font-bold bg-rose-500/10 text-rose-500 border-rose-500/30`}>
                  ממתינים לשיבוץ: <span className="ml-1 text-base">{driverWorkload.unassigned}</span>
                </Badge>
              )}
            </div>
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
              {filteredOrders.map((order) => {
                const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === order.status);
                const isCancelled = order.status === "cancelled";
                const progressPercentage = currentStageIndex > 0 ? (currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100 : 0;
                const etaStatus = getEtaStatus(order);

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={spring}
                  >
                    <Card className={`relative overflow-hidden ${t.cardBg} ${t.cardBorder} ${t.cardHover} flex flex-col justify-between transition-colors h-full`}>
                      
                      {etaStatus === "overdue" && (
                        <div className="absolute inset-0 rounded-xl border-2 border-rose-500 animate-pulse pointer-events-none z-10" />
                      )}
                      {etaStatus === "warning" && (
                        <div className="absolute inset-0 rounded-xl border-2 border-amber-500 pointer-events-none z-10" />
                      )}

                      <div className="relative z-20">
                        <CardHeader className={`border-b ${t.innerBorder} pb-3 flex flex-row justify-between items-start space-y-0`}>
                          <div>
                            <span className={`text-xs ${t.muted} block font-mono font-bold`}>#{order.orderNumber}</span>
                            <CardTitle className={`text-lg font-black ${t.heading} mt-1 flex items-center gap-2`}>
                              {order.customerName}
                              {etaStatus === "overdue" && <AlertCircle className="h-4 w-4 text-rose-500 animate-pulse" />}
                            </CardTitle>
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

                          <div className="py-2 mb-2 select-none">
                            {isCancelled ? (
                              <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-md h-8 flex items-center justify-center text-xs text-rose-500 font-bold">
                                הזמנה בוטלה
                              </div>
                            ) : (
                              <div className="flex items-center justify-between relative px-2">
                                <div className={`absolute left-4 right-4 top-[10px] h-1 ${t.pipelineBg} rounded-full z-0`} />
                                <div
                                  className="absolute right-4 top-[10px] h-1 bg-emerald-500 rounded-full z-0 transition-all duration-700 ease-in-out"
                                  style={{ width: `calc(${progressPercentage}% - 16px)` }}
                                />
                                {PIPELINE_STAGES.map((stage, idx) => {
                                  const isCompleted = currentStageIndex >= idx;
                                  const isCurrent = currentStageIndex === idx;
                                  return (
                                    <div key={stage.id} className="relative z-10 flex flex-col items-center gap-1.5 w-10">
                                      <div
                                        className={`w-3.5 h-3.5 rounded-full border-[3px] transition-all duration-500 ${
                                          isCompleted
                                            ? "bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                            : `${t.pipelineEmpty} ${t.pipelineBorder}`
                                        } ${isCurrent ? "scale-150 ring-2 ring-emerald-500/30" : ""}`}
                                      />
                                      <span className={`text-[10px] font-bold whitespace-nowrap ${isCurrent ? "text-emerald-500" : t.muted}`}>
                                        {stage.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
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

                      <div className={`relative z-20 p-4 border-t ${t.innerBorder} ${t.controlBg} grid grid-cols-2 gap-3`}>
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

                        <div className={`col-span-2 flex items-center justify-between mt-1 ${
                          etaStatus === "overdue" ? "bg-rose-500/10 border-rose-500/30" : 
                          etaStatus === "warning" ? "bg-amber-500/10 border-amber-500/30" : 
                          t.innerBg
                        } p-2 rounded border ${etaStatus === "normal" ? t.innerBorder : "border"}`}>
                          <label htmlFor={`eta-${order.id}`} className={`flex items-center gap-1.5 text-xs ${t.subtle} font-bold`}>
                            <Clock className={`h-3.5 w-3.5 ${
                              etaStatus === "overdue" ? "text-rose-500" : 
                              etaStatus === "warning" ? "text-amber-500" : 
                              t.muted
                            }`} />
                            <span className={
                              etaStatus === "overdue" ? "text-rose-500 font-black" : 
                              etaStatus === "warning" ? "text-amber-500 font-bold" : ""
                            }>שעת אספקה מתוכננת:</span>
                          </label>
                          <input
                            id={`eta-${order.id}`}
                            type="time"
                            className={`h-7 ${t.inputBg} border ${t.inputBorder} rounded px-2 text-xs font-mono text-center ${
                              etaStatus === "overdue" ? "text-rose-500 font-bold" : 
                              etaStatus === "warning" ? "text-amber-500 font-bold" : 
                              t.inputText
                            } focus:outline-none focus:border-slate-500`}
                            value={order.eta || ""}
                            onChange={(e) => handleUpdateOrder(order.id, "eta", e.target.value)}
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </SidebarProvider>
  );
}
