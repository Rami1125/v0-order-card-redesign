"use client";

import React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LayoutDashboard, FileText } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

// פתרון הקסם: טוען את כל הקנבס וה-PDF רק אחרי שהדפדפן מוכן לחלוטין!
const InvoiceEditor = dynamic(() => import("@/components/invoice-editor"), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[600px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
      <p className="text-slate-400 font-bold">טוען עורך תעודות מתקדם...</p>
    </div>
  )
});

export default function InvoicesPage() {
  const router = useRouter();

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
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h1 className="text-3xl font-black text-white">עריכת תעודות משלוח</h1>
          </div>
          
          {/* הזרקת קומפוננטת העריכה בצורה מאובטחת */}
          <InvoiceEditor />
        </main>
      </div>
    </SidebarProvider>
  );
}
