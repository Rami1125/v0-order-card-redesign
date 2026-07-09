"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // שליחה לצינור השרת המאובטח שלנו
      const response = await fetch("/api/upload-to-drive", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`הקובץ ${file.name} הועלה ישירות לדרייב ולמאגר!`);
      } else {
        throw new Error(result.error || "שגיאה בשרת העלאה");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "כשל בהעלאת התעודה");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white" dir="rtl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2 tracking-tight">שער העלאת תעודות משלוח</h1>
        <p className="text-slate-400 text-sm">הקובץ נשלח ישירות לתיקיית המאגר המרכזית ב-Google Drive</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-16 rounded-2xl cursor-pointer transition-all text-center w-full max-w-xl bg-slate-900 shadow-2xl ${
          isDragActive ? "border-emerald-500 bg-slate-900/50 scale-[1.01]" : "border-slate-800 hover:border-slate-700"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="animate-spin size-12 mx-auto text-emerald-500" />
            <p className="text-lg font-bold text-emerald-400 animate-pulse">מזרים קובץ לשרת ולדרייב...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className={`size-12 mx-auto transition-colors ${isDragActive ? "text-emerald-500" : "text-slate-500"}`} />
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-200">
                {isDragActive ? "שחרר את הקובץ כאן..." : "גרור לכאן תעודת משלוח (PDF)"}
              </p>
              <p className="text-xs text-slate-500">או לחץ לבחירת קובץ מהמכשיר</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
