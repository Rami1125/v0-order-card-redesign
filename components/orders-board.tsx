"use client";

import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Clock, Truck, CheckCircle2, AlertTriangle, 
  MapPin, User, FileText, Search, Volume2, VolumeX, Moon, Sun, Share2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// תרגום שמות הסטטוסים לעברית מלאה ומקצועית
const STATUS_LABELS = {
  pending: "ממתין",
  preparing: "בהכנה",
  ready: "מוכן להעמסה",
  on_the_way: "בדרך לשטח",
  delivered: "נמסר",
  cancelled: "בוטל"
};

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  time: string;
  destination: string;
  items: string;
  driverId: string;
  warehouse: string;
  status: 'pending' |
