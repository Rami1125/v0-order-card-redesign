"use client";
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase"; 
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Clock, MapPin, Search, Volume2, VolumeX, Sun, Moon, MessageCircle, 
  Archive, LayoutDashboard, AlertCircle, Truck, Settings, Lock, X, FileText, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { toast } from "sonner";

export interface Order {
  id: string; orderNumber: string; customerName: string; date: string; time: string;
  destination: string; items: string; driverId: string; warehouse: string;
  status: "pending" | "preparing" | "ready" | "on_the_way" | "delivered" | "cancelled";
  eta: string; notes?: string; createdAt: string;
}

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "ממתין", preparing: "בהכנה", ready: "מוכן להעמסה", on_the_way: "בדרך לשטח", delivered: "נמסר", cancelled: "בוטל",
};

export default function OrdersBoard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(150));
    return onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setOrders(fetchedOrders);
    });
  }, []);

  const handleUpdateOrder = async (id: string, field: keyof Order, value: string) => {
    try {
      await updateDoc(doc(db, "orders", id), { [field]: value });
      toast.success("עודכן בהצלחה");
    } catch { toast.error("שגיאה בעדכון"); }
  };

  return (
    <SidebarProvider>
      <div className={`flex min-h-screen w-full ${isDarkMode ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`} dir="rtl">
        <Sidebar className="border-r border-slate-800">
          <SidebarContent className="bg-slate-900 pt-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive onClick={() => router.push('/management')}>
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

        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <h1 className="text-3xl font-black">לוח הזמנות</h1>
            <div className="flex gap-2">
               <Button variant="outline" onClick={() => setIsDarkMode(!isDarkMode)}>
                 {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
               </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence>
              {orders.map(order => (
                <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg">{order.customerName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-400">{order.destination}</p>
                      <Button className="w-full mt-4" onClick={() => handleUpdateOrder(order.id, "status", "ready")}>
                        עדכן למוכן
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LayoutDashboard, FileText, ArrowRight, RefreshCw } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

const InvoiceEditor = dynamic(() => import("@/components/invoice-editor"), { ssr: false });

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // משיכת התעודות מה-Firestore (אחרי שסונכרנו מהדרייב)
  const fetchInvoices = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "invoices"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950" dir="rtl">
        <Sidebar className="border-r border-slate-800">
          <SidebarContent className="bg-slate-900 pt-4">
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton onClick={() => router.push('/management')}><LayoutDashboard className="size-4" /> לוח סידור</SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton isActive><FileText className="size-4" /> תעודות משלוח</SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6">
          {selectedFileId ? (
            <div className="space-y-4">
              <Button onClick={() => setSelectedFileId(null)} variant="outline" className="border-slate-700 text-slate-300 font-bold">
                <ArrowRight className="w-4 h-4 ml-2" /> חזור למאגר
              </Button>
              <InvoiceEditor fileId={selectedFileId} />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h1 className="text-3xl font-black text-white">מאגר תעודות משלוח</h1>
                <Button onClick={fetchInvoices} variant="ghost" className="text-emerald-500 font-bold">
                  <RefreshCw className="w-4 h-4 ml-2" /> רענן נתונים
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {invoices.map((inv) => (
                  <Card key={inv.id} className="bg-slate-900 border-slate-800 hover:border-emerald-500 cursor-pointer" onClick={() => setSelectedFileId(inv.driveId)}>
                    <CardHeader><CardTitle className="text-white text-lg">{inv.name}</CardTitle></CardHeader>
                    <CardContent>
                      <Button className="w-full bg-slate-800 hover:bg-emerald-600 font-bold">פתח לעריכה</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
