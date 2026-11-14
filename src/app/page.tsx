'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Package,
  DollarSign,
  History,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Snowflake,
  Coins,
  Wallet,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  X,
  Filter
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
  type: 'EXPENSE' | 'INCOME' | 'CHANGE_FUND';
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
  const [activeTab, setActiveTab] = useState<'stock' | 'cash' | 'logs'>('stock');

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
  const [selectedCashType, setSelectedCashType] = useState('ทั้งหมด');
  const [isAddCashOpen, setIsAddCashOpen] = useState(false);
  const [cashType, setCashType] = useState<'EXPENSE' | 'INCOME' | 'CHANGE_FUND'>('EXPENSE');
  const [cashCategory, setCashCategory] = useState('สั่งน้ำแข็ง');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [cashRecordedBy, setCashRecordedBy] = useState('Staff');

  // Logs State
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [searchLogs, setSearchLogs] = useState('');

  // Loading & Alerts
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 3000);
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
      const res = await fetch(`/api/cash?search=${encodeURIComponent(searchCash)}&type=${encodeURIComponent(selectedCashType)}`);
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
      const res = await fetch(`/api/logs?search=${encodeURIComponent(searchLogs)}`);
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock') fetchProducts();
    if (activeTab === 'cash') fetchCash();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, searchStock, selectedCategory, searchCash, selectedCashType, searchLogs]);

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
        showAlert('success', `${adjustAction === 'IN' ? 'รับเข้า' : 'เบิกออก'} สำเร็จ`);
        setIsAdjustStockOpen(false);
        setAdjustQty('');
        setAdjustReason('');
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

  // Handle Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`ต้องการลบสินค้า "${name}" ใช่หรือไม่?`)) return;
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
          recordedBy: cashRecordedBy,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', 'บันทึกรายการสำเร็จ');
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
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col font-sans max-w-full overflow-x-hidden pb-20">
      {/* ========================================================= */}
      {/* 1. COMPACT STICKY HEADER (ไม่มีการเลื่อนซ้ายขวา) */}
      {/* ========================================================= */}
      <header className="bg-white border-b border-[#ebd5b3]/70 sticky top-0 z-30 shadow-xs px-3 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#ebd5b3] shrink-0 bg-[#fdfbf9]">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-[#2c1a0e] leading-tight truncate">
                AUSTIN <span className="text-[#c85a2b] font-medium text-xs">CAFE</span>
              </h1>
              <p className="text-[10px] text-[#8f7565] leading-none">SAFE • CALM • COZY</p>
            </div>
          </div>

          {/* Quick Header Action (+ เพิ่มรายการ) */}
          {activeTab === 'stock' && (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3 py-1.5 bg-[#c85a2b] active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มสินค้า</span>
            </button>
          )}

          {activeTab === 'cash' && (
            <button
              onClick={() => setIsAddCashOpen(true)}
              className="px-3 py-1.5 bg-[#1b6b47] active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ บันทึกเงิน</span>
            </button>
          )}
        </div>
      </header>

      {/* Alert Notification Toast */}
      {alertMsg && (
        <div className="fixed top-14 left-3 right-3 z-50 animate-in fade-in slide-in-from-top-2">
          <div
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-md border text-xs font-medium ${
              alertMsg.type === 'success'
                ? 'bg-[#eefaf2] border-[#a5d6a7] text-[#1e612f]'
                : 'bg-[#fdf2f2] border-[#f5c6cb] text-[#842029]'
            }`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="truncate">{alertMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Content (ความกว้างเต็มจอ ไม่ล้น) */}
      <main className="max-w-4xl mx-auto px-3 py-3 w-full flex-1">
        {/* ========================================================= */}
        {/* TAB 1: STOCK MANAGEMENT (CARD VIEW - NO HORIZONTAL SCROLL) */}
        {/* ========================================================= */}
        {activeTab === 'stock' && (
          <div className="space-y-3">
            {/* Ultra-compact 3-stat Bar */}
            <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-[#ebd5b3]/60 shadow-2xs">
              <div className="text-center">
                <p className="text-[10px] text-[#8f7565]">สินค้าทั้งหมด</p>
                <p className="text-base font-bold text-[#2c1a0e] leading-tight">{products.length}</p>
              </div>
              <div className="text-center border-x border-[#ebd5b3]/50">
                <p className="text-[10px] text-amber-700">ใกล้หมด</p>
                <p className="text-base font-bold text-amber-800 leading-tight">{lowStockCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-rose-700">หมดสต็อก</p>
                <p className="text-base font-bold text-rose-800 leading-tight">{outOfStockCount}</p>
              </div>
            </div>

            {/* Search & Category Filter Row (Vertical stack / 1-row, no scroll) */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7 relative">
                <Search className="w-3.5 h-3.5 text-[#a38b7d] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า..."
                  value={searchStock}
                  onChange={(e) => setSearchStock(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 bg-white border border-[#ebd5b3] rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#c85a2b]"
                />
              </div>
              <div className="col-span-5">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-2 bg-white border border-[#ebd5b3] rounded-lg text-xs font-medium text-[#6e5849] focus:outline-hidden"
                >
                  <option value="ทั้งหมด">หมวด: ทั้งหมด</option>
                  <option value="เมล็ดกาแฟ">เมล็ดกาแฟ</option>
                  <option value="วัตถุดิบนม">วัตถุดิบนม</option>
                  <option value="ชาและผงเครื่องดื่ม">ชา/เครื่องดื่ม</option>
                  <option value="บรรจุภัณฑ์">บรรจุภัณฑ์</option>
                  <option value="ทั่วไป">ทั่วไป</option>
                </select>
              </div>
            </div>

            {/* Native Mobile Product Cards (No horizontal scroll!) */}
            <div className="space-y-2">
              {products.length === 0 ? (
                <div className="bg-white py-10 rounded-xl text-center text-xs text-[#8f7565] border border-[#ebd5b3]/60">
                  ไม่พบรายการสินค้า
                </div>
              ) : (
                products.map((item) => {
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = item.quantity > 0 && item.quantity <= item.minStock;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl p-3 border shadow-2xs transition-all ${
                        isOutOfStock
                          ? 'border-rose-200 bg-rose-50/20'
                          : isLowStock
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-[#ebd5b3]/60'
                      }`}
                    >
                      {/* Top: Product Name & Category */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-[#2c1a0e] leading-snug">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#f5efe6] text-[#785741] font-medium">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-[#8f7565]">
                              ขั้นต่ำ: {item.minStock} {item.unit}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          {isOutOfStock ? (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              หมด
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              ใกล้หมด
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              ปกติ
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom: Big Quantity & Easy Thumb Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-[#f0e4d0]/70 flex items-center justify-between gap-2">
                        {/* Quantity display */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-[#2c1a0e]">{item.quantity}</span>
                          <span className="text-xs text-[#8f7565]">{item.unit}</span>
                        </div>

                        {/* Big Thumb Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setAdjustAction('IN');
                              setIsAdjustStockOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 active:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>รับเข้า</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setAdjustAction('OUT');
                              setIsAdjustStockOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 active:bg-amber-700 text-white font-medium text-xs flex items-center gap-1 shadow-2xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                            <span>เบิกออก</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id, item.name)}
                            className="p-1.5 text-[#b09282] active:text-rose-600"
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
        {/* TAB 2: CASH MANAGEMENT (MOBILE 2x2 GRID & LIST) */}
        {/* ========================================================= */}
        {activeTab === 'cash' && (
          <div className="space-y-3">
            {/* 2x2 Compact Summary Grid (Fit exactly in 1 screen height) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-[#ebd5b3]/60 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-rose-700 font-medium">จ่ายวันนี้</p>
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <p className="text-base font-bold text-rose-600 mt-0.5">
                  ฿{cashSummary.todayExpense.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#ebd5b3]/60 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-sky-700 font-medium">สั่งน้ำแข็งสะสม</p>
                  <Snowflake className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <p className="text-base font-bold text-sky-600 mt-0.5">
                  ฿{cashSummary.totalIceExpense.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#ebd5b3]/60 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-emerald-700 font-medium">เงินทอนเปิดร้าน</p>
                  <Coins className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  ฿{cashSummary.todayChangeFund.toLocaleString()}
                </p>
              </div>

              <div className="bg-[#faece5] p-2.5 rounded-xl border border-[#ebd5b3] shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[#c85a2b] font-bold">เงินในลิ้นชักสุทธิ</p>
                  <Wallet className="w-3.5 h-3.5 text-[#c85a2b]" />
                </div>
                <p className="text-base font-bold text-[#2c1a0e] mt-0.5">
                  ฿{cashSummary.netCashInDrawer.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Search & Type Filter (Compact 1-row) */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7 relative">
                <Search className="w-3.5 h-3.5 text-[#a38b7d] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  value={searchCash}
                  onChange={(e) => setSearchCash(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 bg-white border border-[#ebd5b3] rounded-lg text-xs focus:outline-hidden"
                />
              </div>
              <div className="col-span-5">
                <select
                  value={selectedCashType}
                  onChange={(e) => setSelectedCashType(e.target.value)}
                  className="w-full py-2 px-2 bg-white border border-[#ebd5b3] rounded-lg text-xs font-medium text-[#6e5849] focus:outline-hidden"
                >
                  <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
                  <option value="EXPENSE">ค่าใช้จ่าย</option>
                  <option value="CHANGE_FUND">เงินทอน</option>
                  <option value="INCOME">รายรับเงินสด</option>
                </select>
              </div>
            </div>

            {/* Compact Transaction List (No wide table, fits screen 100%) */}
            <div className="space-y-2">
              {cashTransactions.length === 0 ? (
                <div className="bg-white py-10 rounded-xl text-center text-xs text-[#8f7565] border border-[#ebd5b3]/60">
                  ไม่พบรายการเงินสด
                </div>
              ) : (
                cashTransactions.map((tx) => {
                  const isExpense = tx.type === 'EXPENSE';
                  return (
                    <div
                      key={tx.id}
                      className="bg-white rounded-xl p-3 border border-[#ebd5b3]/60 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                              isExpense
                                ? 'bg-rose-50 text-rose-700'
                                : tx.type === 'INCOME'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-sky-50 text-sky-700'
                            }`}
                          >
                            {isExpense ? 'จ่าย' : tx.type === 'INCOME' ? 'รับ' : 'เงินทอน'}
                          </span>
                          <span className="text-xs font-bold text-[#2c1a0e] truncate">
                            {tx.category}
                          </span>
                        </div>
                        {tx.note && (
                          <p className="text-[11px] text-[#8f7565] truncate mt-0.5">{tx.note}</p>
                        )}
                        <p className="text-[10px] text-[#b09282] mt-0.5">
                          {new Date(tx.date).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • {tx.recordedBy || 'Staff'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold ${
                            isExpense ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {isExpense ? '-' : '+'}฿{tx.amount.toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleDeleteCash(tx.id)}
                          className="mt-1 text-xs text-[#b09282] active:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STOCK LOGS (COMPACT MOBILE TIMELINE) */}
        {/* ========================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#a38b7d] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาในประวัติ..."
                value={searchLogs}
                onChange={(e) => setSearchLogs(e.target.value)}
                className="w-full pl-8 pr-2 py-2 bg-white border border-[#ebd5b3] rounded-lg text-xs focus:outline-hidden"
              />
            </div>

            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="bg-white py-10 rounded-xl text-center text-xs text-[#8f7565] border border-[#ebd5b3]/60">
                  ยังไม่มีประวัติ
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white rounded-xl p-2.5 border border-[#ebd5b3]/60 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#2c1a0e] truncate">
                        {log.productName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                          log.action === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'OUT'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {log.action === 'IN' ? 'รับเข้า' : log.action === 'OUT' ? 'เบิกออก' : 'ยกมา'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-1.5 text-[#6e5849]">
                      <span>
                        {log.oldQuantity} → <strong className="text-[#c85a2b]">{log.newQuantity}</strong>{' '}
                        ({log.action === 'OUT' ? `-${log.changeQuantity}` : `+${log.changeQuantity}`})
                      </span>
                      <span className="text-[10px] text-[#b09282]">
                        {new Date(log.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-[10px] text-[#8f7565] mt-0.5">เหตุผล: {log.reason}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 2. APP-LIKE BOTTOM NAVIGATION BAR (ควบคุมได้ด้วยนิ้วโป้ง) */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ebd5b3] shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-3 h-14">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'stock' ? 'text-[#c85a2b] font-bold' : 'text-[#8f7565]'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px]">สต็อกสินค้า</span>
          </button>

          <button
            onClick={() => setActiveTab('cash')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'cash' ? 'text-[#c85a2b] font-bold' : 'text-[#8f7565]'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px]">เงินสด/ทอน</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'logs' ? 'text-[#c85a2b] font-bold' : 'text-[#8f7565]'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px]">ประวัติ</span>
          </button>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* MODAL: เพิ่มสินค้าใหม่ (MOBILE BOTTOM SHEET) */}
      {/* ========================================================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#2c1a0e]">✨ เพิ่มสินค้าใหม่</h2>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 text-[#8f7565] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">ชื่อสินค้า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เมล็ดกาแฟ Ethiopia"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">หมวดหมู่</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-2 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                  >
                    <option value="เมล็ดกาแฟ">เมล็ดกาแฟ</option>
                    <option value="วัตถุดิบนม">วัตถุดิบนม</option>
                    <option value="ชาและผงเครื่องดื่ม">ชาและเครื่องดื่ม</option>
                    <option value="บรรจุภัณฑ์">บรรจุภัณฑ์</option>
                    <option value="ทั่วไป">ทั่วไป</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    placeholder="ถุง, ขวด, ใบ"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">จำนวนตั้งต้น</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProductQuantity}
                    onChange={(e) => setNewProductQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">จุดเตือนขั้นต่ำ</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProductMinStock}
                    onChange={(e) => setNewProductMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#ebd5b3] text-[#6e5849] text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-[#c85a2b] text-white text-xs font-bold"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ปรับสต็อก (รับเข้า / เบิกออก พร้อมปุ่มด่วน +1, +5) */}
      {/* ========================================================= */}
      {isAdjustStockOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-[#2c1a0e]">
                {adjustAction === 'IN' ? '📦 รับเข้าสต็อก' : '📤 เบิกออกสต็อก'}
              </h2>
              <button
                onClick={() => setIsAdjustStockOpen(false)}
                className="p-1 text-[#8f7565] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8f7565] mb-3">
              <strong className="text-[#2c1a0e]">{selectedProduct.name}</strong> (คงเหลือ {selectedProduct.quantity} {selectedProduct.unit})
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3">
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
                  className="w-full px-3 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-sm font-bold text-center"
                />

                {/* ปุ่มลัดแตะเลขด่วน สำหรับมือถือ */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAdjustQty(String(num))}
                      className="py-1 bg-[#f5efe6] active:bg-[#ebd5b3] rounded-md text-xs font-semibold text-[#6e5849]"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  placeholder={adjustAction === 'IN' ? 'เช่น ซื้อของมาเพิ่ม' : 'เช่น ชงหน้าร้าน'}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#ebd5b3] text-[#6e5849] text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-lg text-white text-xs font-bold ${
                    adjustAction === 'IN' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  {loading ? 'กำลังบันทึก...' : `ยืนยัน${adjustAction === 'IN' ? 'รับเข้า' : 'เบิกออก'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: บันทึกเงินสด / เงินทอน / สั่งน้ำแข็ง */}
      {/* ========================================================= */}
      {isAddCashOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#2c1a0e]">💵 บันทึกเงินสด</h2>
              <button
                onClick={() => setIsAddCashOpen(false)}
                className="p-1 text-[#8f7565] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCash} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">ประเภท</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCashType('EXPENSE');
                      setCashCategory('สั่งน้ำแข็ง');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold border ${
                      cashType === 'EXPENSE'
                        ? 'bg-rose-50 border-rose-400 text-rose-700'
                        : 'border-[#ebd5b3] text-[#6e5849]'
                    }`}
                  >
                    จ่ายออก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCashType('CHANGE_FUND');
                      setCashCategory('เงินทอนเปิดร้าน');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold border ${
                      cashType === 'CHANGE_FUND'
                        ? 'bg-sky-50 border-sky-400 text-sky-700'
                        : 'border-[#ebd5b3] text-[#6e5849]'
                    }`}
                  >
                    เงินทอน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCashType('INCOME');
                      setCashCategory('ยอดขายเงินสด');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold border ${
                      cashType === 'INCOME'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'border-[#ebd5b3] text-[#6e5849]'
                    }`}
                  >
                    รายรับ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">หมวดหมู่</label>
                <select
                  value={cashCategory}
                  onChange={(e) => setCashCategory(e.target.value)}
                  className="w-full px-2 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                >
                  {cashType === 'EXPENSE' && (
                    <>
                      <option value="สั่งน้ำแข็ง">สั่งน้ำแข็ง</option>
                      <option value="ซื้อวัตถุดิบเร่งด่วน">ซื้อวัตถุดิบเร่งด่วน (มะนาว/นม)</option>
                      <option value="ของใช้และอุปกรณ์">ของใช้และอุปกรณ์</option>
                      <option value="ค่าใช้จ่ายอื่นๆ">ค่าใช้จ่ายอื่นๆ</option>
                    </>
                  )}
                  {cashType === 'CHANGE_FUND' && (
                    <>
                      <option value="เงินทอนเปิดร้าน">เงินทอนเปิดร้าน</option>
                      <option value="เติมเงินทอนระหว่างวัน">เติมเงินทอนระหว่างวัน</option>
                    </>
                  )}
                  {cashType === 'INCOME' && (
                    <>
                      <option value="ยอดขายเงินสด">ยอดขายเงินสด</option>
                      <option value="เงินสดรับอื่นๆ">เงินสดรับอื่นๆ</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="เช่น 20 หรือ 500"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-sm font-bold text-center"
                />

                {/* แตะปุ่มลัดระบุจำนวนเงิน */}
                {cashType === 'EXPENSE' && cashCategory === 'สั่งน้ำแข็ง' && (
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {[20, 40, 60].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashAmount(String(amt))}
                        className="py-1 bg-[#f5efe6] active:bg-[#ebd5b3] rounded-md text-xs font-semibold text-[#6e5849]"
                      >
                        {amt} บาท
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-1">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder="เช่น น้ำแข็งหลอด 1 กระสอบ"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCashOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#ebd5b3] text-[#6e5849] text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-[#1b6b47] text-white text-xs font-bold"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
