"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Upload, FileCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setUploading(true);
    
    try {
      // 1. העלאה ל-Storage
      const storageRef = ref(storage, `invoices/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // 2. רישום ב-Firestore
      await setDoc(doc(db, "invoices", `${Date.now()}`), {
        name: file.name,
        driveId: url, // כאן נשמור את הלינק הישיר
        uploadedAt: new Date().toISOString(),
        status: "pending"
      });

      toast.success("התעודה הועלתה בהצלחה!");
    } catch (e) {
      toast.error("שגיאה בהעלאה");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
      <h1 className="text-3xl font-black mb-8">העלאת תעודת משלוח</h1>
      <div {...getRootProps()} className="border-2 border-dashed border-slate-700 p-20 rounded-xl cursor-pointer hover:border-emerald-500 transition-all">
        <input {...getInputProps()} />
        {uploading ? <Loader2 className="animate-spin size-12" /> : <Upload className="size-12 mb-4" />}
        <p>גרור לכאן קובץ או לחץ לבחירה</p>
      </div>
    </div>
  );
}
