"use client";
import React, { useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { Document, Page, pdfjs } from 'react-pdf';

// הגדרת ה-Worker עבור ה-PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function InvoicesPage() {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    setLines([...lines, { points: [e.evt.layerX, e.evt.layerY] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([e.evt.layerX, e.evt.layerY]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">תעודות משלוח - קנבס עריכה</h1>
      
      <div className="relative border border-gray-700 rounded-lg overflow-hidden">
        {/* שכבת ה-PDF */}
        <Document file="/path-to-your-invoice.pdf">
          <Page pageNumber={1} />
        </Document>

        {/* שכבת הציור (הקנבס) */}
        <Stage
          width={800}
          height={1000}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDrawing(false)}
          className="absolute top-0 left-0"
        >
          <Layer>
            {lines.map((line, i) => (
              <Line key={i} points={line.points} stroke="#ef4444" strokeWidth={3} />
            ))}
          </Layer>
        </Stage>
      </div>
      
      <button 
        className="mt-4 bg-blue-600 px-6 py-2 rounded-md hover:bg-blue-700 transition"
        onClick={() => console.log("שומר לקנבס Firebase...")}
      >
        שמור הערות חתומות
      </button>
    </div>
  );
}
