"use client";

import React, { useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { Save, Eraser, AlertCircle } from "lucide-react";

// CSS חובה לתצוגה תקינה של ה-PDF
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// הגדרת Worker מדויקת ל-Next.js למניעת קריסות טעינה
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function InvoiceEditor() {
  const [lines, setLines] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl relative flex flex-col items-center">
      
      {/* סרגל כלים - מוכן למובייל */}
      <div className="w-full flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 mb-4">
        <div className="flex gap-3">
          <Button onClick={() => setLines([])} variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold">
            <Eraser className="w-4 h-4 mr-2" /> נקה שרבוט
          </Button>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-lg">
          <Save className="w-4 h-4 mr-2" /> שמור חתימה
        </Button>
      </div>

      {/* אזור העבודה - הקנבס וה-PDF */}
      <div className="relative border border-slate-700 shadow-xl overflow-hidden bg-white rounded-lg" style={{ width: 800, height: 1000 }}>
        
        {/* שכבת ה-PDF */}
        {!pdfError ? (
          <Document 
            file="/invoice-sample.pdf" // שנה לנתיב הקובץ מהפיירבייס בעתיד
            onLoadError={() => setPdfError(true)}
          >
            <Page pageNumber={1} width={800} />
          </Document>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-100 z-0">
            <AlertCircle className="w-16 h-16 mb-4 text-slate-400" />
            <h2 className="text-xl font-bold">לא נמצא קובץ PDF לתצוגה</h2>
            <p>הקנבס פתוח לציור, אך התעודה חסרה.</p>
          </div>
        )}

        {/* שכבת הציור - מעל ה-PDF, תומך טאצ' */}
        <Stage
          width={800}
          height={1000}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="absolute top-0 left-0 cursor-crosshair touch-none z-10"
        >
          <Layer>
            {lines.map((line, i) => (
              <Line key={i} points={line.points} stroke="#10b981" strokeWidth={4} tension={0.5} lineCap="round" />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
