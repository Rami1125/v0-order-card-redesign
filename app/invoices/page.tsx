"use client";

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

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // ניסיון למשוך את הקבצים מה-API החדש שלנו
      const response = await fetch('/api/sync-drive', { method: 'POST' });
      const result = await response.json();
      
      console.log("SYNC RESULT:", result); // תראה ב-Console של הדפדפן אם הגיעו קבצים

      // אחרי הסנכרון, נמשוך מה-Firestore
      const querySnapshot = await getDocs(collection(db, "invoices"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setInvoices(data);
      if (data.length === 0) {
        toast.warning("הקולקציה ריקה - וודא שה-API של הדרייב מחזיר קבצים");
      }
    } catch (error) {
      toast.error("שגיאת סנכרון מול הדרייב");
    } finally {
      setLoading(false);
    }
  };
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "invoices"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(data);
      if (data.length === 0) toast.error("לא נמצאו תעודות במאגר");
    } catch (error) {
      toast.error("שגיאה במשיכת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950" dir="rtl">
        <Sidebar className="border-r border-slate-800">
          <SidebarContent className="bg-slate-900 pt-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/management')}>
                  <LayoutDashboard className="size-4" /> לוח סידור
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <FileText className="size-4" /> תעודות משלוח
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6 text-white">
          {selectedFileId ? (
            <div className="space-y-4">
              <Button onClick={() => setSelectedFileId(null)} variant="outline" className="border-slate-700 bg-slate-900 font-bold">
                <ArrowRight className="w-4 h-4 ml-2" /> חזור למאגר
              </Button>
              <InvoiceEditor fileId={selectedFileId} />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h1 className="text-3xl font-black">מאגר תעודות משלוח</h1>
                <Button onClick={fetchInvoices} variant="ghost" className="text-emerald-500 font-bold">
                  <RefreshCw className="w-4 h-4 ml-2" /> רענן
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {invoices.map((inv) => (
                  <Card key={inv.id} className="bg-slate-900 border-slate-800 hover:border-emerald-500 cursor-pointer" onClick={() => setSelectedFileId(inv.driveId)}>
                    <CardHeader><CardTitle className="text-lg">{inv.name}</CardTitle></CardHeader>
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
