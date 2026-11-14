'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coins,
  ArrowDownRight,
  Trash2,
  X,
  WalletCards,
  ShoppingBag,
  Snowflake,
  TrendingDown,
  ArrowRight,
  Clock
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

interface StockLog {
  id: string;
  productId: string;
  productName: string;
  action: string;
  oldQuantity: number;
  changeQuantity: number;
  newQuantity: number;
  reason: string | null;
  userEmail: string | null;
  createdAt: string;
}

interface CashTransaction {
  id: string;
  date: string;
  type: 'EXPENSE' | 'CHANGE_FUND' | 'INCOME';
  category: string;
  amount: number;
  note: string | null;
  recordedBy: string | null;
}

interface CashSummary {
  totalIceExpense: number;
  todayExpense: number;
  todayChangeFund: number;
  todayIncome: number;
  netCashInDrawer: number;
}

export default function Home() {
  // หน้าแรกที่เปิดมาจะเป็น 'dashboard'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'cash'>('dashboard');

  // Stock State
  const [products, setProducts] = useState<Product[]>([]);
  const [searchStock, setSearchStock] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustAction, setAdjustAction] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // New Product Form
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('เมล็ดกาแฟ');
  const [newProductQuantity, setNewProductQuantity] = useState('0');
  const [newProductMinStock, setNewProductMinStock] = useState('5');
  const [newProductUnit, setNewProductUnit] = useState('ถุง');

  // Cash State
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [cashSummary, setCashSummary] = useState<CashSummary>({
    totalIceExpense: 0,
    todayExpense: 0,
    todayChangeFund: 0,
    todayIncome: 0,
    netCashInDrawer: 0,
  });
  const [searchCash, setSearchCash] = useState('');
  const [isAddCashOpen, setIsAddCashOpen] = useState(false);
  const [cashType, setCashType] = useState<'CHANGE_FUND' | 'EXPENSE'>('EXPENSE');
  const [cashCategory, setCashCategory] = useState('สั่งน้ำแข็ง');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');

  // Logs State
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [todayStr, setTodayStr] = useState('');

  // Loading & Alerts
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 2500);
  };

  // Fetch Data
  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchStock)}&category=${encodeURIComponent(selectedCategory)}`);
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCash = async () => {
    try {
      const res = await fetch(`/api/cash?search=${encodeURIComponent(searchCash)}`);
      const data = await res.json();
      if (data.success) {
        setCashTransactions(data.data);
        setCashSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch all on initial load for Dashboard
  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }));
    fetchProducts();
    fetchCash();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'stock') fetchProducts();
    if (activeTab === 'cash') fetchCash();
    if (activeTab === 'dashboard') {
      fetchProducts();
      fetchCash();
      fetchLogs();
    }
  }, [activeTab, searchStock, selectedCategory, searchCash]);

  // Handle Add Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          category: newProductCategory,
          quantity: newProductQuantity,
          minStock: newProductMinStock,
          unit: newProductUnit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', 'เพิ่มสินค้าใหม่สำเร็จ');
        setIsAddProductOpen(false);
        setNewProductName('');
        fetchProducts();
      } else {
        showAlert('error', data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e: any) {
      showAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Adjust Stock
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          action: adjustAction,
          changeQuantity: adjustQty,
          reason: adjustReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', `${adjustAction === 'IN' ? 'เติมของ' : 'เบิกใช้'} สำเร็จ`);
        setIsAdjustStockOpen(false);
        setAdjustQty('');
        setAdjustReason('');
        fetchProducts();
        fetchLogs();
      } else {
        showAlert('error', data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e: any) {
      showAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`ต้องการลบ "${name}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showAlert('success', 'ลบสินค้าเรียบร้อย');
        fetchProducts();
      }
    } catch (e: any) {
      showAlert('error', e.message);
    }
  };

  // Handle Create Cash
  const handleCreateCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: cashType,
          category: cashCategory,
          amount: cashAmount,
          note: cashNote,
          recordedBy: 'หน้าร้าน',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', 'บันทึกสำเร็จ');
        setIsAddCashOpen(false);
        setCashAmount('');
        setCashNote('');
        fetchCash();
      } else {
        showAlert('error', data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e: any) {
      showAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Cash
  const handleDeleteCash = async (id: string) => {
    if (!confirm('ยืนยันลบรายการนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`/api/cash/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showAlert('success', 'ลบรายการเรียบร้อย');
        fetchCash();
      }
    } catch (e: any) {
      showAlert('error', e.message);
    }
  };

  // Stat Calculations
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock);
  const outOfStockProducts = products.filter(p => p.quantity === 0);
  const urgentRestockItems = [...outOfStockProducts, ...lowStockProducts];

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col font-sans max-w-full overflow-x-hidden pb-20">
      {/* ========================================================= */}
      {/* 1. COMPACT TOP HEADER */}
      {/* ========================================================= */}
      <header className="bg-white border-b border-[#ebd5b3]/70 sticky top-0 z-30 shadow-2xs px-3.5 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#ebd5b3] bg-[#fffbf7]">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#2c1a0e] leading-none">
                AUSTIN <span className="text-[#c85a2b] font-medium text-[11px]">CAT CAFE</span>
              </h1>
              <p className="text-[9px] text-[#8a7263] leading-none mt-0.5">SAFE • CALM • COZY</p>
            </div>
          </div>

          {/* Quick Action Button at Top */}
          {activeTab === 'stock' ? (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-2.5 py-1.5 bg-[#c85a2b] active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มสินค้า</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setCashType('EXPENSE');
                setCashCategory('สั่งน้ำแข็ง');
                setIsAddCashOpen(true);
              }}
              className="px-2.5 py-1.5 bg-[#b83b3b] active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ บันทึกเงิน</span>
            </button>
          )}
        </div>
      </header>

      {/* Alert Notification Toast */}
      {alertMsg && (
        <div className="fixed top-14 left-4 right-4 z-50 animate-in fade-in">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-md border text-xs font-semibold ${
              alertMsg.type === 'success'
                ? 'bg-[#eefbf2] border-[#a5d6a7] text-[#1e612f]'
                : 'bg-[#fdf2f2] border-[#f5c6cb] text-[#842029]'
            }`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================= */}
      <main className="max-w-md mx-auto px-3.5 py-2.5 w-full flex-1">
        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD (หน้าแรกที่เปิดมาจะเห็นทันที) */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-3">
            {/* 1. สรุปเงินสดหน้าร้านวันนี้ */}
            <div className="bg-white p-3 rounded-2xl border border-[#ebd5b3]/70 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2c1a0e] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#c85a2b]" />
                  <span>สรุปเงินสดวันนี้</span>
                </span>
                <span className="text-[10px] text-[#8a7263]">
                  {todayStr || 'วันนี้'}
                </span>
              </div>

              {/* 2 กล่อง: เงินเปิดร้าน & รายจ่ายวันนี้ */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#fcfbf9] p-2 rounded-xl border border-[#f0e4d0]">
                  <p className="text-[10px] text-emerald-800 leading-none">เงินเปิดร้าน</p>
                  <p className="text-lg font-black text-emerald-700 mt-1">
                    ฿{cashSummary.todayChangeFund.toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#fcfbf9] p-2 rounded-xl border border-[#f0e4d0]">
                  <p className="text-[10px] text-rose-800 leading-none">รายจ่ายวันนี้</p>
                  <p className="text-lg font-black text-rose-600 mt-1">
                    ฿{cashSummary.todayExpense.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* เงินสดคงเหลือสุทธิ */}
              <div className="bg-[#faece5] p-2.5 rounded-xl border border-[#ebd5b3] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#8a583a]">เงินสดในลิ้นชักปัจจุบัน</p>
                  <p className="text-xl font-black text-[#2c1a0e] mt-0.5">
                    ฿{(cashSummary.todayChangeFund - cashSummary.todayExpense).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#8a583a]">สั่งน้ำแข็งสะสม</p>
                  <p className="text-xs font-bold text-sky-700 mt-0.5">
                    ฿{cashSummary.totalIceExpense.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. สรุปสถานะสต็อกสินค้า */}
            <div className="bg-white p-3 rounded-2xl border border-[#ebd5b3]/70 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2c1a0e] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#c85a2b]" />
                  <span>สถานะสต็อกสินค้า</span>
                </span>
                <button
                  onClick={() => setActiveTab('stock')}
                  className="text-[10px] text-[#c85a2b] font-bold flex items-center gap-0.5"
                >
                  <span>ดูทั้งหมด ({products.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* เตือนสินค้าใกล้หมด / หมดแล้ว */}
              {urgentRestockItems.length === 0 ? (
                <div className="py-3 px-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 text-center">
                  <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>สต็อกสินค้าพร้อมขายทุกรายการ</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-amber-800">
                    ⚠️ สินค้าที่ต้องสั่งเพิ่ม ({urgentRestockItems.length} รายการ):
                  </p>
                  {urgentRestockItems.slice(0, 4).map((p) => {
                    const isOut = p.quantity === 0;
                    return (
                      <div
                        key={p.id}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                          isOut ? 'bg-rose-50/50 border-rose-200' : 'bg-amber-50/40 border-amber-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#2c1a0e] truncate">{p.name}</p>
                          <p className="text-[10px] text-[#8a7263]">
                            คงเหลือ: <strong className={isOut ? 'text-rose-700' : 'text-amber-800'}>{p.quantity}</strong> {p.unit} (เตือน: {p.minStock})
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setAdjustAction('IN');
                            setIsAdjustStockOpen(true);
                          }}
                          className="px-2 py-1 rounded-md bg-emerald-600 active:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs shrink-0"
                        >
                          + เติม
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. ประวัติการทำรายการล่าสุด (Recent Activity) */}
            <div className="bg-white p-3 rounded-2xl border border-[#ebd5b3]/70 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-[#2c1a0e] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#8a7263]" />
                <span>การเคลื่อนไหวล่าสุด</span>
              </span>

              {logs.length === 0 && cashTransactions.length === 0 ? (
                <p className="text-xs text-[#8a7263] py-4 text-center">ยังไม่มีประวัติการทำรายการ</p>
              ) : (
                <div className="space-y-1.5">
                  {logs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-xl bg-[#fcfbf9] border border-[#f0e4d0] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#2c1a0e] truncate">{log.productName}</p>
                        <p className="text-[10px] text-[#8a7263]">
                          {log.action === 'IN' ? 'เติมของ' : log.action === 'OUT' ? 'เบิกใช้' : 'ยอดยกมา'} ({log.oldQuantity} → {log.newQuantity})
                        </p>
                      </div>
                      <span className="text-[9px] text-[#b49f91] shrink-0">
                        {new Date(log.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: สต็อกสินค้า */}
        {/* ========================================================= */}
        {activeTab === 'stock' && (
          <div className="space-y-2">
            {/* Search + Filter in 1 compact row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#a38b7d] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={searchStock}
                  onChange={(e) => setSearchStock(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#ebd5b3] rounded-lg text-xs font-medium focus:outline-hidden"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-2 bg-white border border-[#ebd5b3] rounded-lg text-xs font-medium text-[#6e5849] focus:outline-hidden"
              >
                <option value="ทั้งหมด">ทุกหมวด</option>
                <option value="เมล็ดกาแฟ">เมล็ดกาแฟ</option>
                <option value="วัตถุดิบนม">วัตถุดิบนม</option>
                <option value="ชาและผงเครื่องดื่ม">ชา/เครื่องดื่ม</option>
                <option value="บรรจุภัณฑ์">บรรจุภัณฑ์</option>
                <option value="ทั่วไป">ทั่วไป</option>
              </select>
            </div>

            {/* Product Cards */}
            <div className="space-y-1.5">
              {products.length === 0 ? (
                <div className="bg-white py-10 rounded-xl text-center text-xs text-[#8a7263] border border-[#ebd5b3]">
                  ไม่พบรายการสินค้า
                </div>
              ) : (
                products.map((item) => {
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = item.quantity > 0 && item.quantity <= item.minStock;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-2.5 border border-[#ebd5b3]/70 shadow-2xs hover:border-[#c85a2b]/40 transition-all"
                    >
                      {/* Top: Product Name, Category & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-bold text-[#2c1a0e] leading-tight truncate">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f5efe6] text-[#785741] font-medium">
                              {item.category}
                            </span>
                            <span className="text-[9px] text-[#9c8475]">
                              เตือน: {item.minStock} {item.unit}
                            </span>
                          </div>
                        </div>

                        {/* Status Dot */}
                        {isOutOfStock ? (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 leading-none">
                            ● หมด
                          </span>
                        ) : isLowStock ? (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 leading-none">
                            ● ใกล้หมด
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 leading-none">
                            ● ปกติ
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Quantity + Action Buttons */}
                      <div className="mt-2 pt-1.5 border-t border-[#f5ecde] flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-extrabold text-[#2c1a0e] leading-none">
                            {item.quantity}
                          </span>
                          <span className="text-[11px] font-medium text-[#8a7263]">
                            {item.unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setAdjustAction('IN');
                              setIsAdjustStockOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 whitespace-nowrap shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>เติม</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setAdjustAction('OUT');
                              setIsAdjustStockOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-md bg-[#c85a2b] active:bg-[#b04e22] text-white font-bold text-xs flex items-center gap-1 whitespace-nowrap shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                            <span>เบิก</span>
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(item.id, item.name)}
                            className="p-1 text-[#cbb6a8] hover:text-rose-600 active:scale-90"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: เงินเปิดร้าน & รายจ่ายวันนี้ */}
        {/* ========================================================= */}
        {activeTab === 'cash' && (
          <div className="space-y-2">
            {/* สรุปเงินสดสั้นๆ */}
            <div className="bg-[#fceddf] px-3 py-2 rounded-xl border border-[#ebd5b3] flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-[#7d5032]">เงินสดในลิ้นชักสุทธิ:</span>
              <span className="font-bold text-sm text-[#2c1a0e]">
                ฿{(cashSummary.todayChangeFund - cashSummary.todayExpense).toLocaleString()}
              </span>
            </div>

            {/* Compact Transaction List */}
            <div className="space-y-1.5">
              {cashTransactions.length === 0 ? (
                <div className="bg-white py-10 rounded-xl text-center text-xs text-[#8a7263] border border-[#ebd5b3]">
                  ยังไม่มีรายการ
                </div>
              ) : (
                cashTransactions.map((tx) => {
                  const isChangeFund = tx.type === 'CHANGE_FUND';
                  return (
                    <div
                      key={tx.id}
                      className="bg-white rounded-xl p-2.5 border border-[#ebd5b3]/70 shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              isChangeFund
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isChangeFund ? 'เปิดร้าน' : 'จ่าย'}
                          </span>
                          <span className="text-xs font-bold text-[#2c1a0e] truncate">
                            {tx.category}
                          </span>
                        </div>
                        {tx.note && (
                          <p className="text-[11px] text-[#8a7263] truncate mt-0.5">{tx.note}</p>
                        )}
                        <p className="text-[9px] text-[#b49f91] mt-0.5">
                          {new Date(tx.date).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold ${
                            isChangeFund ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isChangeFund ? '+' : '-'}฿{tx.amount.toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleDeleteCash(tx.id)}
                          className="text-[#b49f91] active:text-rose-600 p-0.5"
                        >
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 4. COMPACT BOTTOM BAR (Dashboard เป็นแท็บแรก) */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ebd5b3] shadow-md">
        <div className="max-w-md mx-auto grid grid-cols-3 h-13">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'dashboard' ? 'text-[#c85a2b] font-bold' : 'text-[#8a7263]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px]">แดชบอร์ด</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'stock' ? 'text-[#c85a2b] font-bold' : 'text-[#8a7263]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-[10px]">สต็อกสินค้า</span>
          </button>

          <button
            onClick={() => setActiveTab('cash')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'cash' ? 'text-[#c85a2b] font-bold' : 'text-[#8a7263]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px]">เงินสด/ทอน</span>
          </button>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* MODAL: เพิ่มสินค้าใหม่ */}
      {/* ========================================================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#2c1a0e]">✨ เพิ่มสินค้าใหม่</h2>
              <button onClick={() => setIsAddProductOpen(false)} className="p-1 text-[#8a7263]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">ชื่อสินค้า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เมล็ดกาแฟ Ethiopia"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">หมวดหมู่</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                  >
                    <option value="เมล็ดกาแฟ">เมล็ดกาแฟ</option>
                    <option value="วัตถุดิบนม">วัตถุดิบนม</option>
                    <option value="ชาและผงเครื่องดื่ม">ชา/เครื่องดื่ม</option>
                    <option value="บรรจุภัณฑ์">บรรจุภัณฑ์</option>
                    <option value="ทั่วไป">ทั่วไป</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    placeholder="ถุง, ขวด, ใบ"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">จำนวนตั้งต้น</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProductQuantity}
                    onChange={(e) => setNewProductQuantity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">จุดเตือนขั้นต่ำ</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProductMinStock}
                    onChange={(e) => setNewProductMinStock(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-[#ebd5b3] text-[#6e5849] text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-[#c85a2b] text-white text-xs font-bold"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: เติม / เบิก */}
      {/* ========================================================= */}
      {isAdjustStockOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-sm font-bold text-[#2c1a0e]">
                {adjustAction === 'IN' ? '📦 เติมของเข้าสต็อก' : '📤 เบิกใช้หน้าร้าน'}
              </h2>
              <button onClick={() => setIsAdjustStockOpen(false)} className="p-1 text-[#8a7263]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8a7263] mb-2.5">
              <strong className="text-[#2c1a0e]">{selectedProduct.name}</strong> (คงเหลือ {selectedProduct.quantity} {selectedProduct.unit})
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">
                  จำนวน ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="ระบุตัวเลข"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-base font-bold text-center"
                />

                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAdjustQty(String(num))}
                      className="py-1 bg-[#f5efe6] active:bg-[#ebd5b3] rounded text-xs font-semibold text-[#6e5849]"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">หมายเหตุ</label>
                <input
                  type="text"
                  placeholder={adjustAction === 'IN' ? 'เช่น ซื้อของมาเพิ่ม' : 'เช่น ชงหน้าร้าน'}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-[#ebd5b3] text-[#6e5849] text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2 rounded-lg text-white text-xs font-bold ${
                    adjustAction === 'IN' ? 'bg-emerald-600' : 'bg-[#c85a2b]'
                  }`}
                >
                  {loading ? 'กำลังบันทึก...' : `ยืนยัน${adjustAction === 'IN' ? 'เติม' : 'เบิก'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: เงินเปิดร้าน / รายจ่าย */}
      {/* ========================================================= */}
      {isAddCashOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#2c1a0e]">
                {cashType === 'CHANGE_FUND' ? '🪙 เงินเปิดร้าน' : '💸 รายจ่ายวันนี้'}
              </h2>
              <button onClick={() => setIsAddCashOpen(false)} className="p-1 text-[#8a7263]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCash} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCashType('CHANGE_FUND');
                    setCashCategory('เงินทอนเปิดร้าน');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold border ${
                    cashType === 'CHANGE_FUND'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'border-[#ebd5b3] text-[#8a7263]'
                  }`}
                >
                  🪙 เงินเปิดร้าน
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashType('EXPENSE');
                    setCashCategory('สั่งน้ำแข็ง');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold border ${
                    cashType === 'EXPENSE'
                      ? 'bg-rose-50 border-rose-400 text-rose-800'
                      : 'border-[#ebd5b3] text-[#8a7263]'
                  }`}
                >
                  💸 รายจ่ายวันนี้
                </button>
              </div>

              {cashType === 'EXPENSE' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">หมวดหมู่</label>
                  <select
                    value={cashCategory}
                    onChange={(e) => setCashCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs font-bold"
                  >
                    <option value="สั่งน้ำแข็ง">สั่งน้ำแข็ง</option>
                    <option value="ซื้อวัตถุดิบเร่งด่วน">ซื้อวัตถุดิบเร่งด่วน (มะนาว/นม)</option>
                    <option value="ของใช้และอุปกรณ์">ของใช้และอุปกรณ์</option>
                    <option value="ค่าใช้จ่ายอื่นๆ">ค่าใช้จ่ายอื่นๆ</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="เช่น 20 หรือ 2000"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-base font-bold text-center"
                />

                {cashType === 'EXPENSE' && cashCategory === 'สั่งน้ำแข็ง' ? (
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    {[20, 40, 60].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashAmount(String(amt))}
                        className="py-1 bg-[#f5efe6] active:bg-[#ebd5b3] rounded text-xs font-semibold text-[#6e5849]"
                      >
                        {amt} บ.
                      </button>
                    ))}
                  </div>
                ) : cashType === 'CHANGE_FUND' ? (
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    {[1000, 1500, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashAmount(String(amt))}
                        className="py-1 bg-[#f5efe6] active:bg-[#ebd5b3] rounded text-xs font-semibold text-[#6e5849]"
                      >
                        {amt} บ.
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">หมายเหตุ</label>
                <input
                  type="text"
                  placeholder="เช่น น้ำแข็งหลอด 1 กระสอบ"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddCashOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-[#ebd5b3] text-[#6e5849] text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2 rounded-lg text-white text-xs font-bold ${
                    cashType === 'CHANGE_FUND' ? 'bg-emerald-600' : 'bg-[#b83b3b]'
                  }`}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
