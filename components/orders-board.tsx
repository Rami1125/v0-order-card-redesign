"use client";

import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase'; // נתיב חסין ומעודכן לפרויקט החדש
import { 
  Package, Clock, Truck, CheckCircle2, AlertTriangle, 
  MapPin, User, FileText, Search, Volume2, VolumeX 
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
  status: 'ממתין' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
  eta: string;
  notes?: string;
  createdAt: string;
}

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  // שימוש ב-useRef כדי לעקוב אחרי כמות ההזמנות הקודמת ולזהות הזמנה חדשה
  const prevOrdersCount = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // אתחול קובץ השמע להתראה (צליל דיגיטלי נקי וקצר)
  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
  }, []);

  // האזנה בזמן אמת לפרויקט ה-Firebase החדש (whatsapp-8ffd1)
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });

      // מנגנון הפעלת צלצול: אם זו לא הטעינה הראשונה וכמות ההזמנות גדלה -> תשמיע צליל
      if (prevOrdersCount.current !== null && fetchedOrders.length > prevOrdersCount.current) {
        if (isSoundEnabled && audioRef.current) {
          audioRef.current.play().catch(err => console.log("Sound play blocked:", err));
          toast.success("🔔 הזמנה חדשה נכנסה למערכת ח.סבן!");
        }
      }

      setOrders(fetchedOrders);
      prevOrdersCount.current = fetchedOrders.length;
    }, (error) => {
      console.error("Firestore listen error:", error);
    });

    return () => unsubscribe();
  }, [isSoundEnabled]);

  // עדכון סטטוס, נהג או ETA ישירות לתוך Firebase Firestore
  const handleUpdateOrder = async (orderId: string, field: string, value: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updates: any = { [field]: value };
      
      // חוק לוגיסטי: אם משנים סטטוס או נהג, מאפסים את ה-ETA כדי שהנהג החדש יעדכן מחדש
      if (field === 'status' || field === 'driverId') {
        updates.eta = '';
      }

      await updateDoc(orderRef, updates);
      toast.info("הכרטיס עודכן בהצלחה");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("שגיאה בעדכון הנתונים");
    }
  };

  // חישוב מוני ה-KPI לכרטיסי המדדים העליונים
  const stats = {
    total: orders.length,
    preparing: orders.filter(o => o.status === 'preparing' || o.status === 'pending').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    noDriver: orders.filter(o => !o.driverId || o.driverId === 'unassigned').length
  };

  // סינון וחיפוש הזמנות בלייב
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          order.orderNumber.includes(search) || 
                          order.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100" dir="rtl">
      {/* כותרת ראשית + כפתור שליטה בסאונד של ההתראות */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">סידור ח.סבן </h1>
          <p className="text-slate-400 text-sm mt-1">ניהול והפצת הזמנות לוגיסטיות בזמן אמת | סניפי הוד השרון</p>
        </div>
        <Button 
          variant={isSoundEnabled ? "default" : "destructive"}
          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          className="flex items-center gap-2 font-bold"
        >
          {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {isSoundEnabled ? "התראות קוליות: פעיל" : "התראות קוליות: כבוי"}
        </Button>
      </div>

      {/* כרטיסי KPI / מדדים עליונים */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">כל ההזמנות</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black">{stats.total}</p></CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-amber-400">בהכנה / ממתין</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-amber-400">{stats.preparing}</p></CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-emerald-400">מוכן להעמסה</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-emerald-400">{stats.ready}</p></CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-blue-400">נמסר ללקוח</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-blue-400">{stats.delivered}</p></CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-rose-400">חסר נהג משובץ</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-rose-400">{stats.noDriver}</p></CardContent>
        </Card>
      </div>

      {/* סרגל סינון וחיפוש דינמי */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="חפש לפי שם לקוח, מספר הזמנה או כתובת אספקה..." 
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pr-10 pl-4 py-2 text-white focus:outline-none focus:border-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[200px] bg-slate-900 border-slate-800 text-white">
            <SelectValue placeholder="סנן לפי סטטוס" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="pending">ממתין</SelectItem>
            <SelectItem value="preparing">בהכנה</SelectItem>
            <SelectItem value="ready">מוכן</SelectItem>
            <SelectItem value="on_the_way">בדרך</SelectItem>
            <SelectItem value="delivered">נמסר</SelectItem>
            <SelectItem value="cancelled">בוטל</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* רשת כרטיסי ההזמנות החיה */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="bg-slate-900 border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all text-white">
            <div>
              <CardHeader className="border-b border-slate-800/60 pb-3 flex flex-row justify-between items-start space-y-0">
                <div>
                  <span className="text-xs text-slate-500 block font-mono">#{order.orderNumber}</span>
                  <CardTitle className="text-lg font-bold text-white mt-1">{order.customerName}</CardTitle>
                </div>
                <Badge variant={order.status === 'ready' ? 'success' : order.status === 'on_the_way' ? 'default' : 'secondary'} className="capitalize font-bold">
                  {order.status}
                </Badge>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-4 text-sm">
                {/* כתובת יעד */}
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="h-4 w-4 mt-0.5 text-slate-500 flex-shrink-0" />
                  <span>{order.destination}</span>
                </div>

                {/* תכולת המשלוח - תצוגת Whitespace pre-wrap תואמת לטקסט המנורמל מה-AI */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-2">
                    <Package className="h-3.5 w-3.5" />
                    <span>תכולת המשלוח</span>
                  </div>
                  <div className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {order.items}
                  </div>
                </div>

                {/* הערות מיוחדות אם יש */}
                {order.notes && (
                  <div className="text-xs text-amber-400 bg-amber-950/20 border border-amber-900/30 p-2 rounded">
                    <strong>🏭 :</strong> {order.notes}
                  </div>
                )}
              </CardContent>
            </div>

            {/* בקרי שליטה ושינוי בשטח (נהג, סטטוס, ETA) */}
            <div className="p-4 border-t border-slate-800/60 bg-slate-900/40 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">נהג משובץ</label>
                <Select 
                  value={order.driverId || "unassigned"} 
                  onValueChange={(val) => handleUpdateOrder(order.id, 'driverId', val)}
                >
                  <SelectTrigger className="h-8 bg-slate-950 border-slate-800 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-white">
                    <SelectItem value="unassigned">לא משויך</SelectItem>
                    <SelectItem value="hikmat">חכמת (מנוף)</SelectItem>
                    <SelectItem value="ali">עלי (משאית)</SelectItem>          
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">עדכון סטטוס</label>
                <Select 
                  value={order.status} 
                  onValueChange={(val) => handleUpdateOrder(order.id, 'status', val)}
                >
                  <SelectTrigger className="h-8 bg-slate-950 border-slate-800 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-white">
                    <SelectItem value="pending">ממתין</SelectItem>
                    <SelectItem value="preparing">בהכנה</SelectItem>
                    <SelectItem value="ready">מוכן</SelectItem>
                    <SelectItem value="on_the_way">בדרך</SelectItem>
                    <SelectItem value="delivered">נמסר</SelectItem>
                    <SelectItem value="cancelled">בוטל</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 flex items-center justify-between mt-1 bg-slate-950/60 p-2 rounded border border-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>שעת הגעה משוערת:</span>
                </div>
                <input 
                  type="text" 
                  placeholder="לדוגמה: 11:30" 
                  className="w-20 h-6 bg-slate-900 border border-slate-800 rounded text-center text-xs text-white focus:outline-none focus:border-slate-600"
                  value={order.eta || ""}
                  onChange={(e) => handleUpdateOrder(order.id, 'eta', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
