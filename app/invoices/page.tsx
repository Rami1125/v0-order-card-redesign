"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LayoutDashboard, FileText, ArrowRight, Download } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// טעינה דינמית של העורך כדי למנוע קריסות שרת
const InvoiceEditor = dynamic(() => import("@/components/invoice-editor"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96 text-emerald-500 font-bold animate-pulse">טוען קנבס עריכה...</div>
});

// נתוני דמה לבדיקה (בהמשך יגיע מה-Firebase שמושך את ה-Drive ID)
const mockInvoices = [
  { id: "1", orderNumber: "10023", customerName: "ח. סבן", driveFileId: "1A2B3C_example_id_1" },
  { id: "2", orderNumber: "10024", customerName: "אחים כהן", driveFileId: "1A2B3C_example_id_2" }
];

export default function InvoicesPage() {
  const router = useRouter();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

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

        <main className="flex-1 p-6 overflow-hidden">
          {selectedFileId ? (
            // תצוגת העורך (כשנבחר קובץ)
            <div className="space-y-4">
              <Button onClick={() => setSelectedFileId(null)} variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold">
                <ArrowRight className="w-4 h-4 ml-2" /> חזור לרשימה
              </Button>
              <InvoiceEditor fileId={selectedFileId} />
            </div>
          ) : (
            // תצוגת הרשימה (ברירת מחדל)
            <>
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h1 className="text-3xl font-black text-white">מאגר תעודות משלוח</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockInvoices.map((invoice) => (
                  <Card key={invoice.id} className="bg-slate-900 border-slate-800 hover:border-emerald-500 transition-colors cursor-pointer" onClick={() => setSelectedFileId(invoice.driveFileId)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-lg">תעודה #{invoice.orderNumber}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-400 mb-4">{invoice.customerName}</p>
                      <Button className="w-full bg-slate-800 hover:bg-emerald-600 text-white font-bold">
                        <FileText className="w-4 h-4 mr-2" /> פתח לעריכה וחתימה
                      </Button>
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
