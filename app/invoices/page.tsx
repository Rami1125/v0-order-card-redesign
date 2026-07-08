"use client";
import React, { useState, useRef } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Stage, Layer, Line } from 'react-konva';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, LayoutDashboard, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Worker ל-PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function InvoicesPage() {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const router = useRouter();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-950 text-white">
        {/* ה-Sidebar המעוצב שלך */}
        <Sidebar className="bg-gray-900 border-r border-gray-800">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => router.push('/management')}>
                    <LayoutDashboard className="size-4" /> <span>לוח סידור</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <FileText className="size-4" /> <span>תעודות משלוח</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* תוכן הדף */}
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">עריכת תעודה - SabanOS</h1>
          
          <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-white shadow-2xl">
            <Document file="/invoice-sample.pdf">
              <Page pageNumber={1} width={800} />
            </Document>

            <Stage
              width={800}
              height={1000}
              onMouseDown={() => setIsDrawing(true)}
              onMouseMove={(e) => {
                if (!isDrawing) return;
                const pos = e.target.getStage().getPointerPosition();
                setLines([...lines, { points: [pos.x, pos.y] }]);
              }}
              onMouseUp={() => setIsDrawing(false)}
              className="absolute top-0 left-0 cursor-crosshair"
            >
              <Layer>
                {lines.map((line, i) => (
                  <Line key={i} points={line.points} stroke="#ef4444" strokeWidth={3} tension={0.5} />
                ))}
              </Layer>
            </Stage>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
