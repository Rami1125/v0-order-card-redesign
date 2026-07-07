"use client";

import React, { useState, useEffect } from "react";
import { Download, BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // רישום ה-Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW Registration failed:", err);
      });
    }

    // תפיסת אירוע ההתקנה (Add to Home Screen)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallAndPermissions = async () => {
    // 1. בקשת הרשאת התראות
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("התראות אושרו בהצלחה");
      }
    }

    // 2. פתיחת ערוץ סאונד (כדי לעקוף חסימת Autoplay בדפדפן)
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
      audio.volume = 0.01; // סאונד שקט רק לשחרור הנעילה
      await audio.play();
    } catch (e) {
      console.log("Audio unlock failed, will retry on interaction", e);
    }

    // 3. הקפצת חלונית ההתקנה למסך הבית
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("SabanOS מותקנת על המכשיר!");
      }
      setDeferredPrompt(null);
    }
    
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:right-4 md:w-96">
      <Card className="p-4 bg-slate-900 border-slate-700 shadow-2xl flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              התקנת אפליקציית לוגיסטיקה
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              התקן את המערכת למסך הבית ואשר התראות כדי לקבל עדכוני נהגים בזמן אמת.
            </p>
          </div>
          <button onClick={() => setShowPrompt(false)} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <Button 
          onClick={handleInstallAndPermissions} 
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2"
        >
          <BellRing className="w-4 h-4" />
          התקן ואשר קבלת התראות
        </Button>
      </Card>
    </div>
  );
}
