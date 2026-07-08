"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// טעינה דינמית שמונעת מה-Build לנסות לקמפל את הקנבס בשרת
const Stage = dynamic(() => import('react-konva').then((mod) => mod.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then((mod) => mod.Layer), { ssr: false });
const Line = dynamic(() => import('react-konva').then((mod) => mod.Line), { ssr: false });

export default function InvoicesPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // מונע מ-Server להתבלבל

  return (
    <div className="p-6">
        {/* עכשיו ה-Stage ייטען רק כשהדפדפן יפתח את הדף */}
        <Stage width={800} height={1000}>
            <Layer>
                {/* הציור שלך כאן */}
            </Layer>
        </Stage>
    </div>
  );
}
