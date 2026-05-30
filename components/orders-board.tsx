"use client";

import React, { useState } from "react";
import {
  Package,
  Clock,
  Truck,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Building,
  Trash2,
  X,
  Search,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Zap,
  Navigation,
  Phone,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Demo interfaces
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  time: string;
  destination: string;
  items: string;
  driverId: string;
  warehouse: string;
  status: string;
  eta?: string;
}

interface Driver {
  id: string;
  name: string;
  phone?: string;
}

// Demo data
const demoOrders: Order[] = [
  {
    id: "1",
    orderNumber: "94827",
    customerName: "סלטי שמיר בע״מ",
    customerPhone: "052-1234567",
    date: "2024-01-15",
    time: "08:30",
    destination: "רחוב החרש 12, אשקלון",
    items: "50 משטחי פוליסטירן\n12 קופסאות ברגים",
    driverId: "drv_1",
    warehouse: "החרש",
    status: "on_the_way",
    eta: "09:15",
  },
  {
    id: "2",
    orderNumber: "94828",
    customerName: "מפעלי הצפון",
    customerPhone: "054-7654321",
    date: "2024-01-15",
    time: "10:00",
    destination: "אזור תעשייה חיפה",
    items: "25 יחידות צינורות PVC\n8 מנועי מים",
    driverId: "drv_2",
    warehouse: "התלמיד",
    status: "preparing",
    eta: "",
  },
  {
    id: "3",
    orderNumber: "94829",
    customerName: "בניין חכם",
    customerPhone: "050-9876543",
    date: "2024-01-15",
    time: "11:30",
    destination: "תל אביב, רחוב רוטשילד 45",
    items: "100 קרשי עץ אורן\n50 ברגים מחוזקים",
    driverId: "",
    warehouse: "החרש",
    status: "pending",
    eta: "",
  },
  {
    id: "4",
    orderNumber: "94830",
    customerName: "מתכת בע״מ",
    customerPhone: "053-1112222",
    date: "2024-01-15",
    time: "14:00",
    destination: "באר שבע, אזור תעשייה",
    items: "30 לוחות פלדה\n15 צינורות נירוסטה",
    driverId: "drv_3",
    warehouse: "התלמיד",
    status: "ready",
    eta: "14:30",
  },
  {
    id: "5",
    orderNumber: "94831",
    customerName: "חומרי בניין דרום",
    customerPhone: "052-3334444",
    date: "2024-01-15",
    time: "09:00",
    destination: "אילת, שד׳ התמרים",
    items: "200 שקי מלט\n50 שקי חול",
    driverId: "drv_1",
    warehouse: "החרש",
    status: "delivered",
    eta: "09:45",
  },
];

const demoDrivers: Driver[] = [
  { id: "drv_1", name: "ראמי סבן", phone: "052-1111111" },
  { id: "drv_2", name: "אמיר ח׳ורי", phone: "054-2222222" },
  { id: "drv_3", name: "יוסף סבאח", phone: "050-3333333" },
  { id: "drv_4", name: "אלי קדוש", phone: "053-4444444" },
];

// Status config with premium colors
const statusConfig: Record<
  string,
  { label: string; color: string; glow: string; icon: React.ReactNode }
> = {
  pending: {
    label: "ממתין",
    color: "from-amber-500/20 to-amber-600/10",
    glow: "shadow-amber-500/20",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  preparing: {
    label: "בהכנה",
    color: "from-cyan-500/20 to-cyan-600/10",
    glow: "shadow-cyan-500/20",
    icon: <Building className="w-3.5 h-3.5" />,
  },
  ready: {
    label: "מוכן",
    color: "from-blue-500/20 to-blue-600/10",
    glow: "shadow-blue-500/20",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  on_the_way: {
    label: "בדרך",
    color: "from-primary/20 to-primary/10",
    glow: "shadow-primary/30",
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  delivered: {
    label: "נמסר",
    color: "from-emerald-500/20 to-emerald-600/10",
    glow: "shadow-emerald-500/20",
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "בוטל",
    color: "from-red-500/20 to-red-600/10",
    glow: "shadow-red-500/20",
    icon: <X className="w-3.5 h-3.5" />,
  },
};

// Metric Card Component with 3D effect
function MetricCard({
  label,
  value,
  icon,
  active,
  onClick,
  accentColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ y: 0, scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-2xl p-4 text-right transition-all duration-300 cursor-pointer border-0
        ${
          active
            ? `bg-gradient-to-br ${accentColor} shadow-lg shadow-primary/20 ring-1 ring-white/20`
            : "bg-secondary/50 hover:bg-secondary/80"
        }
      `}
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Glassmorphic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* 3D shine effect */}
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rotate-12 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <div
            className={`p-1.5 rounded-lg ${active ? "bg-white/20" : "bg-muted"}`}
          >
            {icon}
          </div>
        </div>
        <span className="text-3xl font-black font-mono text-foreground block">
          {value}
        </span>
      </div>
    </motion.button>
  );
}

// Order Card Component with premium glassmorphism
function OrderCard({
  order,
  drivers,
  onStatusChange,
  onDriverChange,
  onEtaChange,
  onDelete,
}: {
  order: Order;
  drivers: Driver[];
  onStatusChange: (id: string, status: string) => void;
  onDriverChange: (id: string, driverId: string) => void;
  onEtaChange: (id: string, eta: string) => void;
  onDelete: (id: string) => void;
}) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const assignedDriver = drivers.find(
    (d) => d.id === order.driverId || d.name === order.driverId
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="group relative"
    >
      {/* Glow effect behind card */}
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${status.color} blur-xl opacity-50 group-hover:opacity-70 transition-opacity`}
      />

      {/* Main card */}
      <div
        className={`
          relative overflow-hidden rounded-3xl border border-white/10
          bg-gradient-to-br from-card/90 to-card/70
          shadow-2xl ${status.glow}
          transition-all duration-500 group-hover:border-white/20
        `}
        style={{
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      >
        {/* Top accent strip with animated gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />

        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              {/* Order number badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 mb-2">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-mono font-bold text-muted-foreground">
                  #{order.orderNumber}
                </span>
              </div>

              {/* Customer name */}
              <h3 className="text-lg font-bold text-foreground leading-tight truncate">
                {order.customerName}
              </h3>

              {/* Destination */}
              <div className="flex items-center gap-2 mt-1.5 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs truncate">{order.destination}</span>
              </div>
            </div>

            {/* Delete button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(order.id)}
              className="p-2 rounded-xl bg-white/5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 border-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Items section with glass effect */}
          <div className="relative rounded-2xl bg-white/5 border border-white/10 p-4 mb-4 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              תכולת המשלוח
            </span>
            <p className="text-sm text-foreground/90 font-mono whitespace-pre-wrap leading-relaxed">
              {order.items}
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Date/Time */}
            <div className="rounded-xl bg-white/5 border border-white/5 p-3">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                זמן משלוח
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-mono font-semibold text-foreground">
                  {order.date} | {order.time}
                </span>
              </div>
            </div>

            {/* Warehouse */}
            <div className="rounded-xl bg-white/5 border border-white/5 p-3">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                מחסן
              </span>
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-bold text-foreground">
                  {order.warehouse}
                </span>
              </div>
            </div>
          </div>

          {/* ETA & Driver selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* ETA Input */}
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                שעת הגעה (ETA)
              </span>
              <div className="relative">
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="00:00"
                  value={order.eta || ""}
                  onChange={(e) => onEtaChange(order.id, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-10 pl-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-right"
                />
              </div>
            </div>

            {/* Driver Select */}
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                נהג משובץ
              </span>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={order.driverId || ""}
                  onChange={(e) => onDriverChange(order.id, e.target.value)}
                  className={`w-full appearance-none rounded-xl py-2.5 pr-3 pl-10 text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-right cursor-pointer ${
                    order.driverId
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  }`}
                >
                  <option value="" className="bg-card text-foreground">
                    לא משויך
                  </option>
                  {drivers.map((drv) => (
                    <option
                      key={drv.id}
                      value={drv.name}
                      className="bg-card text-foreground"
                    >
                      {drv.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Driver info if assigned */}
          {assignedDriver && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-emerald-400">
                  {assignedDriver.name}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-emerald-500/60" />
                  <span className="text-[10px] text-emerald-500/80 font-mono">
                    {assignedDriver.phone}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom status bar */}
        <div className="px-5 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between gap-3">
          {/* Status badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${status.color} border border-white/10`}
          >
            {status.icon}
            <span className="text-xs font-bold text-foreground">
              {status.label}
            </span>
          </div>

          {/* Status selector */}
          <div className="relative">
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value)}
              className="appearance-none bg-white/10 border border-white/10 rounded-xl py-2 pr-3 pl-8 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
            >
              <option value="pending" className="bg-card">
                ממתין
              </option>
              <option value="preparing" className="bg-card">
                בהכנה
              </option>
              <option value="ready" className="bg-card">
                מוכן
              </option>
              <option value="on_the_way" className="bg-card">
                בדרך
              </option>
              <option value="delivered" className="bg-card">
                נמסר
              </option>
              <option value="cancelled" className="bg-card">
                בוטל
              </option>
            </select>
            <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    orderNumber: "",
    customerName: "",
    date: new Date().toISOString().split("T")[0],
    time: "08:00",
    destination: "",
    items: "",
    driverId: "",
    warehouse: "החרש",
    status: "pending",
    eta: "",
  });

  // Handlers
  const handleStatusChange = (orderId: string, status: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handleDriverChange = (orderId: string, driverId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, driverId } : o))
    );
  };

  const handleEtaChange = (orderId: string, eta: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, eta } : o))
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm("האם למחוק הזמנה זו?")) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const order: Order = {
      id: Date.now().toString(),
      orderNumber: newOrder.orderNumber || "",
      customerName: newOrder.customerName || "",
      customerPhone: "",
      date: newOrder.date || "",
      time: newOrder.time || "",
      destination: newOrder.destination || "",
      items: newOrder.items || "",
      driverId: newOrder.driverId || "",
      warehouse: newOrder.warehouse || "החרש",
      status: "pending",
      eta: "",
    };
    setOrders((prev) => [order, ...prev]);
    setIsNewOrderModalOpen(false);
    setNewOrder({
      orderNumber: "",
      customerName: "",
      date: new Date().toISOString().split("T")[0],
      time: "08:00",
      destination: "",
      items: "",
      driverId: "",
      warehouse: "החרש",
      status: "pending",
      eta: "",
    });
  };

  // Counts
  const totalCount = orders.length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const onTheWayCount = orders.filter((o) => o.status === "on_the_way").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const unassignedCount = orders.filter((o) => !o.driverId).length;

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm.trim() ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      order.status === activeFilter ||
      (activeFilter === "unassigned" && !order.driverId);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/3 to-accent/3 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header
          className="sticky top-0 z-20 border-b border-white/5 bg-background/80"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="container mx-auto px-4 py-5">
            {/* Title section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    שירותי תובלה ולוגיסטיקה
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground">
                  מערכת בקרה ומעקב הזמנות
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="חיפוש הזמנות..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-secondary/50 border border-white/10 rounded-2xl py-3 pr-11 pl-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    style={{
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  />
                </div>

                {/* New order button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsNewOrderModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all cursor-pointer border-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">הזמנה חדשה</span>
                </motion.button>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard
                label="סה״כ"
                value={totalCount}
                icon={<Package className="w-4 h-4 text-foreground" />}
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
                accentColor="from-slate-500/30 to-slate-600/20"
              />
              <MetricCard
                label="בהכנה"
                value={preparingCount}
                icon={<Building className="w-4 h-4 text-cyan-400" />}
                active={activeFilter === "preparing"}
                onClick={() => setActiveFilter("preparing")}
                accentColor="from-cyan-500/30 to-cyan-600/20"
              />
              <MetricCard
                label="מוכן"
                value={readyCount}
                icon={<CheckCircle className="w-4 h-4 text-blue-400" />}
                active={activeFilter === "ready"}
                onClick={() => setActiveFilter("ready")}
                accentColor="from-blue-500/30 to-blue-600/20"
              />
              <MetricCard
                label="בדרך"
                value={onTheWayCount}
                icon={<Truck className="w-4 h-4 text-primary" />}
                active={activeFilter === "on_the_way"}
                onClick={() => setActiveFilter("on_the_way")}
                accentColor="from-primary/30 to-primary/20"
              />
              <MetricCard
                label="נמסר"
                value={deliveredCount}
                icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
                active={activeFilter === "delivered"}
                onClick={() => setActiveFilter("delivered")}
                accentColor="from-emerald-500/30 to-emerald-600/20"
              />
              <MetricCard
                label="ללא נהג"
                value={unassignedCount}
                icon={
                  <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
                }
                active={activeFilter === "unassigned"}
                onClick={() => setActiveFilter("unassigned")}
                accentColor="from-amber-500/30 to-amber-600/20"
              />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center p-16 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-secondary/50 flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                אין הזמנות תואמות
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                נסה לשנות את הסינון או ליצור הזמנה חדשה
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveFilter("all");
                  setSearchTerm("");
                }}
                className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold cursor-pointer border-0"
              >
                אפס סינונים
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    drivers={demoDrivers}
                    onStatusChange={handleStatusChange}
                    onDriverChange={handleDriverChange}
                    onEtaChange={handleEtaChange}
                    onDelete={handleDeleteOrder}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* New Order Modal */}
      <AnimatePresence>
        {isNewOrderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewOrderModalOpen(false)}
              className="absolute inset-0 bg-black/60"
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-card/95 shadow-2xl overflow-hidden"
              style={{
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
              }}
              dir="rtl"
            >
              {/* Header */}
              <div className="relative px-6 py-5 border-b border-white/5 bg-gradient-to-r from-primary/20 to-primary/10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        הזמנה חדשה
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        הוספת משלוח למערכת
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer border-0 bg-transparent"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={handleCreateOrder}
                className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      מספר הזמנה *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOrder.orderNumber}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, orderNumber: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="94832"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      שם הלקוח *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOrder.customerName}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, customerName: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="שם החברה"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    כתובת יעד *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrder.destination}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, destination: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="רחוב, עיר"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    תכולת המשלוח *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newOrder.items}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, items: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none font-mono"
                    placeholder="פריטים וכמויות..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      תאריך
                    </label>
                    <input
                      type="date"
                      value={newOrder.date}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, date: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      שעה
                    </label>
                    <input
                      type="time"
                      value={newOrder.time}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, time: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      מחסן
                    </label>
                    <select
                      value={newOrder.warehouse}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, warehouse: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="החרש" className="bg-card">
                        החרש
                      </option>
                      <option value="התלמיד" className="bg-card">
                        התלמיד
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      נהג
                    </label>
                    <select
                      value={newOrder.driverId}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, driverId: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-card">
                        לא משויך
                      </option>
                      {demoDrivers.map((drv) => (
                        <option
                          key={drv.id}
                          value={drv.name}
                          className="bg-card"
                        >
                          {drv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all cursor-pointer border-0 bg-transparent"
                  >
                    ביטול
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/25 cursor-pointer border-0"
                  >
                    צור הזמנה
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shimmer animation keyframes */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
