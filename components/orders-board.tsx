"use client";

import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Clock, Truck, CheckCircle2, AlertTriangle, 
  MapPin, User, FileText, Search, Volume2, VolumeX, Moon, Sun 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/components/ui/badge";
import { Button } from "@/components/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/components/ui/select";
import { toast } from "sonner";

// תרגום שמות הסטטוסים לעברית מלאה ומקצועית
const STATUS_LABELS = {
  pending: "ממתין",
  preparing: "בהכנה",
  ready: "מוכן להעמסה",
  on_the_way: "בדרך לשטח",
  delivered: "נמסר",
  cancelled: "בוטל"
};

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
  status: 'pending' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
  eta: string;
  notes?: string;
  createdAt: string;
}

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const prevOrdersCount = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // טעינת קובץ שמע להתראה
  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
  }, []);

  // האזנה בזמן אמת ל-Firestore
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });

      // מפעיל צלצול אם נכנסה הזמנה חדשה
      if (prevOrdersCount.current !== null && fetchedOrders.length > prevOrdersCount.current) {
        if (isSoundEnabled && audioRef.current) {
          audioRef.current.play().catch(err => console.log("שמע נחסם בדפדפן:", err));
          toast.success("🔔 הזמנה חדשה נכנסה למערכת ח.סבן!");
        }
      }

      setOrders(fetchedOrders);
      prevOrdersCount.current = fetchedOrders.length;
    }, (error) => {
      console.error("שגיאת האזנה למאגר:", error);
    });

    return () => unsubscribe();
  }, [isSoundEnabled]);

  // עדכון שדות הזמנה ב-Firebase
  const handleUpdateOrder = async (orderId: string, field: string, value: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updates: any = { [field]: value };
      
      if (field === 'status' || field === 'driverId') {
        updates.eta = '';
      }

      await updateDoc(orderRef, updates);
      toast.info("הכרטיס עודכן בהצלחה");
    } catch (error) {
      console.error("עדכון נכשל:", error);
      toast.error("שגיאה בעדכון הנתונים");
    }
  };

  const stats = {
    total: orders.length,
    preparing: orders.filter(o => o.status === 'preparing' || o.status === 'pending').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    noDriver: orders.filter(o => !o.driverId || o.driverId === 'unassigned').length
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          order.orderNumber.includes(search) || 
                          order.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`p-6 min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      
      {/* סרגל עליון - כותרות, מצב בהיר/כהה, הפעלת צלצול */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>לוח בקרה ח.סבן לוגיסטיקה</h1>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-sm mt-1`}>ניהול, שיבוץ נהגים והפצת משלוחים בזמן אמת</p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0">
          {/* כפתור החלפת מצב בהיר / כהה */}
          <Button 
            variant="outline"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-2 font-bold ${isDarkMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'}`}
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            {isDarkMode ? "מצב בהיר" : "מצב כהה"}
          </Button>

          {/* כפתור הפעלת/השתקת צלצול */}
          <Button 
            variant={isSoundEnabled ? "default" : "destructive"}
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="flex items-center gap-2 font-bold"
          >
            {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {isSoundEnabled ? "התראות קוליות: פעיל" : "התראות קוליות: כבוי"}
          </Button>
        </div>
      </div>

      {/* כרטיסי KPI / מדדים עליונים בעברית צרופה */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className={`${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">סה"כ הזמנות</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black">{stats.total}</p></CardContent>
        </Card>
        <Card className={`${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-amber-500">בהכנה / ממתין</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-amber-500">{stats.preparing}</p></CardContent>
        </Card>
        <Card className={`${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-emerald-500">מוכן להעמסה</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-emerald-500">{stats.ready}</p></CardContent>
        </Card>
        <Card className={`${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-blue-500">נמסר בשטח</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-blue-500">{stats.delivered}</p></CardContent>
        </Card>
        <Card className={`${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-rose-500">חוסר נהג משובץ</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-rose-500">{stats.noDriver}</p></CardContent>
        </Card>
      </div>

      {/* סרגל סינון וחיפוש דינמי */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="חפש לפי שם לקוח, מספר הזמנה או כתובת אספקה..." 
            className={`w-full border rounded-lg pr-10 pl-4 py-2 focus:outline-none focus:border-slate-500 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className={`w-full md:w-[200px] ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <SelectValue placeholder="סנן לפי סטטוס" />
          </SelectTrigger>
          <SelectContent className={`${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* רשת כרטיסי ההזמנות החיה עם תמיכה באנימציות תנועה Layout מבוססות framer-motion */}
      <motion.div 
        layout 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Card className={`h-full flex flex-col justify-between hover:shadow-lg transition-all border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:border-slate-700' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'}`}>
                <div>
                  <CardHeader className={`border-b pb-3 flex flex-row justify-between items-start space-y-0 ${isDarkMode ? 'border-slate-800/60' : 'border-slate-100'}`}>
                    <div>
                      <span className="text-xs text-slate-500 block font-mono font-bold">הזמנה #{order.orderNumber}</span>
                      <CardTitle className={`text-lg font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{order.customerName}</CardTitle>
                    </div>
                    <Badge variant={order.status === 'ready' ? 'success' : order.status === 'on_the_way' ? 'default' : 'secondary'} className="font-bold px-2.5 py-1">
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="pt-4 space-y-4 text-sm">
                    {/* כתובת יעד */}
                    <div className="flex items-start gap-2 text-slate-400">
                      <MapPin className="h-4 w-4 mt-0.5 text-slate-500 flex-shrink-0" />
                      <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{order.destination}</span>
                    </div>

                    {/* תכולת המשלוח */}
                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-2">
                        <Package className="h-3.5 w-3.5" />
                        <span>תכולת המשלוח</span>
                      </div>
                      <div className={`font-mono text-xs whitespace-pre-wrap Regal-lines ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                        {order.items}
                      </div>
                    </div>

                    {/* מחסן יוצא מוזרק כהערה חסינה */}
                    {order.notes && (
                      <div className="text-xs text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 p-2 rounded">
                        ℹ️ {order.notes}
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* בקרי שליטה ושינוי בשטח */}
                <div className={`p-4 border-t grid grid-cols-2 gap-3 ${isDarkMode ? 'border-slate-800/60 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">נהג משובץ</label>
                    <Select 
                      value={order.driverId || "unassigned"} 
                      onValueChange={(val) => handleUpdateOrder(order.id, 'driverId', val)}
                    >
                      <SelectTrigger className={`h-8 text-xs font-medium ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={`${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <SelectItem value="unassigned">לא משויך</SelectItem>
                        <SelectItem value="hikmat">חכמת (מנוף)</SelectItem>
                        <SelectItem value="ali">עלי (משאית)</SelectItem>
                        <SelectItem value="yoav">יואב (פיזור מהיר)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">עדכון סטטוס</label>
                    <Select 
                      value={order.status} 
                      onValueChange={(val) => handleUpdateOrder(order.id, 'status', val)}
                    >
                      <SelectTrigger className={`h-8 text-xs font-medium ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={`${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* בורר שעות תקני (Time Picker Input) לבחירת שעת אספקה במקום הזנה חופשית */}
                  <div className={`col-span-2 flex items-center justify-between mt-1 p-2 rounded border ${isDarkMode ? 'bg-slate-950/60 border-slate-800/40' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>שעת אספקה מתוכננת:</span>
                    </div>
                    <input 
                      type="time" 
                      className={`h-7 px-2 border rounded font-mono text-xs text-center focus:outline-none focus:border-slate-500 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white color-scheme-dark' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      value={order.eta || ""}
                      onChange={(e) => handleUpdateOrder(order.id, 'eta', e.target.value)}
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
