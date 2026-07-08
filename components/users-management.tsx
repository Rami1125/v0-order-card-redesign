"use client";

import React, { useState, useEffect } from "react";
// שנה את השורה הראשונה בקובץ הזה ל:
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Truck, Package, ShieldAlert, Link as LinkIcon, Copy, Plus, X, Send, CheckCircle2, Smartphone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  name: string;
  role: "manager" | "driver" | "warehouse" | "dispatcher";
  phone: string;
  branch?: string;
  createdAt: any;
}

const ROLE_CONFIG = {
  manager: { label: "הנהלה / מנהל סניף", icon: ShieldAlert, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  dispatcher: { label: "סדרן / איש ארגון", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  driver: { label: "נהג שטח / הפצה", icon: Truck, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  warehouse: { label: "מנהל מחסן / מלגזן", icon: Package, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
};

export default function UsersManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<TeamMember["role"]>("driver");
  const [newPhone, setNewPhone] = useState("");
  const [newBranch, setNewBranch] = useState("החורש 10");

  useEffect(() => {
    const q = query(collection(db, "team_members"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMembers: TeamMember[] = [];
      snapshot.forEach((docSnap) => {
        fetchedMembers.push({ id: docSnap.id, ...docSnap.data() } as TeamMember);
      });
      setMembers(fetchedMembers);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) {
      toast.error("יש להזין שם ומספר טלפון");
      return;
    }

    try {
      await addDoc(collection(db, "team_members"), {
        name: newName,
        role: newRole,
        phone: newPhone,
        branch: newRole === "warehouse" || newRole === "manager" ? newBranch : "",
        createdAt: serverTimestamp(),
      });
      
      toast.success("איש צוות נוסף בהצלחה למערכת");
      setNewName("");
      setNewPhone("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("שגיאה בהוספת איש הצוות");
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק משתמש זה? לינק הקסם שלו יפסיק לעבוד מיידית.")) {
      try {
        await deleteDoc(doc(db, "team_members", id));
        toast.success("המשתמש נמחק בהצלחה");
      } catch (error) {
        toast.error("שגיאה במחיקת משתמש");
      }
    }
  };

  // ייצור לינק קסם מאובטח (טוקן מבוסס Base64 של מזהה המשתמש)
  const generateMagicLink = (member: TeamMember) => {
    const token = btoa(`${member.id}:${member.role}`);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sabanos.com';
    return `${baseUrl}/terminal?token=${token}`;
  };

  const copyToClipboard = async (member: TeamMember) => {
    const link = generateMagicLink(member);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(member.id);
      toast.success("לינק קסם הועתק ללוח");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("שגיאה בהעתקת הלינק");
    }
  };

  const sendViaWhatsApp = (member: TeamMember) => {
    const link = generateMagicLink(member);
    const message = `אהלן ${member.name},
זה הלינק האישי שלך למסוף הלוגיסטיקה. 
אין להעביר אותו לאף אחד! 🚫
לכניסה למערכת לחץ כאן:
${link}`;
    
    // ניקוי מספר הטלפון מתווים מיותרים והוספת קידומת ישראל אם חסר
    let cleanPhone = member.phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "972" + cleanPhone.substring(1);

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="p-6 min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-emerald-500" />
            ניהול הרשאות וצוות שטח
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            הנפקת "לינקי קסם" לנהגים ולאנשי מחסן, ללא צורך בסיסמה.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          הוסף איש צוות
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {members.map((member) => {
            const config = ROLE_CONFIG[member.role];
            const Icon = config.icon;
            const isCopied = copiedId === member.id;

            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="bg-slate-900 border-slate-800 overflow-hidden relative group">
                  <div className={`absolute top-0 right-0 left-0 h-1 ${config.bg} ${config.color}`} />
                  <CardHeader className="pb-2 flex flex-row justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-black text-white">{member.name}</CardTitle>
                      <div className="text-slate-400 text-sm font-mono mt-1">{member.phone}</div>
                    </div>
                    <div className={`p-2 rounded-lg ${config.bg} border ${config.border}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${config.color} ${config.border} bg-transparent font-bold`}>
                        {config.label}
                      </Badge>
                      {member.branch && (
                        <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-950">
                          {member.branch}
                        </Badge>
                      )}
                    </div>

                    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-3">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Smartphone className="h-3 w-3" /> גישת מסוף מהירה
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"
                          onClick={() => copyToClipboard(member)}
                        >
                          {isCopied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <LinkIcon className="h-4 w-4" />}
                          {isCopied ? "הועתק!" : "העתק לינק"}
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-colors"
                          onClick={() => sendViaWhatsApp(member)}
                        >
                          <Send className="h-4 w-4 ml-1.5" />
                          שגר לנייד
                        </Button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteMember(member.id)}
                      className="text-xs text-rose-500/50 hover:text-rose-500 font-medium transition-colors w-full text-center mt-2"
                    >
                      הסר הרשאה ומשתמש
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal - הוספת משתמש */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 left-4 text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-black text-white mb-6">יצירת תעודת זהות ולינק קסם</h2>
              
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">שם מלא</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="לדוגמה: יואב, עלי, חכמת..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">תפקיד / הרשאה</label>
                  <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
                    <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">נהג שטח / הפצה</SelectItem>
                      <SelectItem value="warehouse">מנהל מחסן / מלגזן</SelectItem>
                      <SelectItem value="dispatcher">סדרן / איש ארגון</SelectItem>
                      <SelectItem value="manager">הנהלה / מנהל סניף</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newRole === "warehouse" || newRole === "manager") && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5">שיוך לסניף</label>
                    <Select value={newBranch} onValueChange={setNewBranch}>
                      <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="החורש 10">החורש 10</SelectItem>
                        <SelectItem value="התלמיד 6">התלמיד 6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">מספר וואטסאפ (לשליחת הלינק)</label>
                  <input
                    type="tel"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="050-0000000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 mt-2">
                  <LinkIcon className="h-4 w-4 ml-2" />
                  ייצר משתמש ולינק קסם
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
