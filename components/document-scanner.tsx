"use client"

import React, { useState, useRef } from 'react'
import { storage, db } from "@/lib/firebase" 
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { collection, addDoc } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, RefreshCw, Upload, CheckCircle2, AlertCircle } from "lucide-react"

interface DocumentScannerProps {
  deliveryNumber: string;
  driverName?: string;
}

export default function DocumentScanner({ deliveryNumber, driverName = "חכמת" }: DocumentScannerProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', text: string }>({ type: '', text: '' })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => processImage(img)
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const MAX_WIDTH = 1200
    const scale = MAX_WIDTH / img.width
    canvas.width = MAX_WIDTH
    canvas.height = img.height * scale

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    setImage(dataUrl)
  }

  const uploadToSabanOS = async () => {
    if (!image) return
    setIsUploading(true)
    setStatus({ type: '', text: '' })
    
    try {
      const fileName = `delivery_notes/scan_${deliveryNumber}_${Date.now()}.jpg`
      const storageRef = ref(storage, fileName)
      
      await uploadString(storageRef, image, 'data_url')
      const downloadURL = await getDownloadURL(storageRef)
      
      await addDoc(collection(db, 'scans'), {
        deliveryNumber,
        driverName,
        fileUrl: downloadURL,
        timestamp: new Date()
      })
      
      setStatus({ type: 'success', text: 'התעודה נסרקה ועלתה ל-SabanOS בהצלחה!' })
      setImage(null)
    } catch (error) {
      console.error('Upload Error:', error)
      setStatus({ type: 'error', text: 'שגיאה בהעלאה, נסה שוב.' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto text-right" dir="rtl">
      <CardHeader>
        <CardTitle className="text-center text-xl font-bold">סורק תעודות משאית</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleCapture}
          className="hidden" 
          id="cameraInput"
        />
        
        {!image ? (
          <label htmlFor="cameraInput" className="flex items-center justify-center gap-2 w-full p-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer font-medium transition-colors text-center">
            <Camera className="h-5 w-5" />
            <span>פתח מצלמה לסריקה</span>
          </label>
        ) : (
          <div className="space-y-4 text-center">
            <div className="overflow-hidden rounded-lg border border-border">
              <img src={image} alt="Scanned Document" className="w-full h-auto max-h-64 object-contain bg-muted" />
            </div>
            <div className="flex gap-3">
              <Button onClick={uploadToSabanOS} disabled={isUploading} className="flex-1 gap-2">
                <Upload className="h-4 w-4" />
                {isUploading ? 'מעלה...' : 'שלח למערכת'}
              </Button>
              <Button onClick={() => setImage(null)} disabled={isUploading} variant="destructive" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                סרוק מחדש
              </Button>
            </div>
          </div>
        )}
        
        {status.text && (
          <div className={`p-3 rounded-md flex items-center gap-2 text-sm font-medium ${
            status.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-destructive/10 text-destructive'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{status.text}</span>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden"></canvas>
      </CardContent>
    </Card>
  )
}
