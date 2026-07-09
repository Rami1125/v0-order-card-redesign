"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytes } from "firebase/storage";
import { storage, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      // העלאה ישירה ובטוחה ל-Firebase Storage (עוקף בעיות CORS)
      const storageRef = ref(storage, `invoices/${file.name}`);
      await uploadBytes(storageRef, file);
      
      // עדכון מאגר הנתונים ב-SabanOS
      await setDoc(doc(db, "invoices", file.name), {
        name: file.name,
        path: `invoices/${file.name}`,
        uploadedAt: new Date().toISOString(),
        status: "pending"
      });

      toast.success("התעודה הועלתה בהצלחה!");
    } catch (e) {
      console.error("Upload error:", e);
      toast.error("שגיאה בהעלאת התעודה");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white" dir="rtl">
      <h1 className="text-3xl font-black mb-8">העלאת תעודת משלוח</h1>
      
      <div 
        {...getRootProps()} 
        className="border-2 border-dashed border-slate-700 p-20 rounded-xl cursor-pointer hover:border-emerald-500 transition-all text-center w-full max-w-xl bg-slate-900"
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="animate-spin size-12 mx-auto mb-4 text-emerald-500" />
        ) : (
          <Upload className="size-12 mx-auto mb-4 text-slate-400" />
        )}
        <p className="text-lg font-medium text-slate-300">
          {uploading ? "מעלה תעודה, אנא המתן..." : "גרור לכאן תעודת משלוח (PDF) או לחץ לבחירה"}
        </p>
      </div>
    </div>
  );
}
