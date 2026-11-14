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
  Coins,
  ArrowDownRight,
  Trash2,
  X,
  WalletCards,
  ShoppingBag,
  Clock,
  Sparkles
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

  // Cash State (มีแค่ 2 อย่าง: เงินเปิดร้าน และ รายจ่ายวันนี้)
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
  }, [activeTab, searchStock, selectedCategory, searchCash, searchLogs]);

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
        showAlert('success', 'เพิ่มสินค้าใหม่เรียบร้อย');
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
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  return (
    <div className="min-h-screen bg-[#fcf9f5] flex flex-col font-sans max-w-full overflow-x-hidden pb-24">
      {/* ========================================================= */}
      {/* 1. TOP HEADER (โลโก้ + ชื่อร้าน AUSTIN) */}
      {/* ========================================================= */}
      <header className="bg-white border-b border-[#eedbc5] sticky top-0 z-30 shadow-xs px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#eedbc5] bg-[#fffbf7] shadow-xs">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#2c1a0e] leading-none tracking-tight">
                AUSTIN <span className="text-[#c85a2b] font-semibold text-xs">CAT CAFE</span>
              </h1>
              <p className="text-[10px] text-[#8a7263] font-medium tracking-wider mt-0.5">
                SAFE • CALM • COZY
              </p>
            </div>
          </div>

          {/* Quick Action Button at Top */}
          {activeTab === 'stock' ? (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3 py-1.5 bg-[#c85a2b] active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มสินค้า</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setCashType('EXPENSE');
                setCashCategory('สั่งน้ำแข็ง');
                setIsAddCashOpen(true);
              }}
              className="px-3 py-1.5 bg-[#b83b3b] active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ ลงรายจ่าย</span>
            </button>
          )}
        </div>
      </header>

      {/* Alert Notification Toast */}
      {alertMsg && (
        <div className="fixed top-16 left-4 right-4 z-50">
          <div
            className={`flex items-center gap-2 px-3.5 py-3 rounded-2xl shadow-lg border text-xs font-bold ${
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
      {/* 2. BIG DASHBOARD OVERVIEW (ป้ายสรุปยอดตัวใหญ่ อ่านง่าย ชัดเจน) */}
      {/* ========================================================= */}
      <section className="max-w-md mx-auto px-4 pt-4 pb-2 w-full">
        {activeTab === 'stock' ? (
          /* สรุปสต็อกภาพรวม ตัวเลขใหญ่ */
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-[#eedbc5] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8a7263]">สินค้าทั้งหมด</span>
                <ShoppingBag className="w-4 h-4 text-[#c85a2b]" />
              </div>
              <p className="text-3xl font-black text-[#2c1a0e] mt-2">
                {products.length} <span className="text-xs font-normal text-[#8a7263]">รายการ</span>
              </p>
            </div>

            <div
              className={`rounded-2xl p-4 border shadow-xs ${
                lowStockCount + outOfStockCount > 0
                  ? 'bg-[#fff8f5] border-amber-300'
                  : 'bg-white border-[#eedbc5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">ต้องสั่งเพิ่ม</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-3xl font-black text-amber-800 mt-2">
                {lowStockCount + outOfStockCount}{' '}
                <span className="text-xs font-normal text-amber-700">รายการ</span>
              </p>
            </div>
          </div>
        ) : (
          /* สรุปเงินสดภาพรวม ตัวเลขใหญ่ ชัดเจน (มีแค่ เงินเปิดร้าน และ รายจ่ายวันนี้) */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* เงินเปิดร้านวันนี้ */}
              <div className="bg-white rounded-2xl p-4 border border-[#eedbc5] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">เงินเปิดร้านวันนี้</span>
                  <Coins className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-700 mt-2">
                  ฿{cashSummary.todayChangeFund.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#8a7263] mt-0.5">เงินทอนใส่ลิ้นชัก</p>
              </div>

              {/* รายจ่ายวันนี้ */}
              <div className="bg-white rounded-2xl p-4 border border-[#eedbc5] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800">รายจ่ายวันนี้</span>
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-2xl font-black text-rose-600 mt-2">
                  ฿{cashSummary.todayExpense.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#8a7263] mt-0.5">ค่าน้ำแข็ง & ของใช้</p>
              </div>
            </div>

            {/* เงินสดคงเหลือในลิ้นชัก (คำนวณสรุป) */}
            <div className="bg-[#fceddf] rounded-2xl p-3.5 border border-[#eedbc5] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#8a583a]">เงินสดคงเหลือในลิ้นชัก (เปิดร้าน - จ่ายออก)</p>
                <p className="text-2xl font-black text-[#2c1a0e] mt-0.5">
                  ฿{(cashSummary.todayChangeFund - cashSummary.todayExpense).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center text-[#c85a2b]">
                <WalletCards className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 3. MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="max-w-md mx-auto px-4 py-2 w-full flex-1">
        {/* ========================================================= */}
        {/* TAB 1: สต็อกสินค้า (เข้าใจง่าย ปุ่มใหญ่ ไม่ต้องเลื่อนซ้ายขวา) */}
        {/* ========================================================= */}
        {activeTab === 'stock' && (
          <div className="space-y-3">
            {/* Search + Category Dropdown (1 แถวจบ) */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#a38b7d] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า..."
                  value={searchStock}
                  onChange={(e) => setSearchStock(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-[#eedbc5] rounded-xl text-xs font-medium focus:outline-hidden"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-2.5 px-3 bg-white border border-[#eedbc5] rounded-xl text-xs font-bold text-[#6e5849] focus:outline-hidden"
              >
                <option value="ทั้งหมด">ทุกหมวด</option>
                <option value="เมล็ดกาแฟ">เมล็ดกาแฟ</option>
                <option value="วัตถุดิบนม">วัตถุดิบนม</option>
                <option value="ชาและผงเครื่องดื่ม">ชา/เครื่องดื่ม</option>
                <option value="บรรจุภัณฑ์">บรรจุภัณฑ์</option>
                <option value="ทั่วไป">ทั่วไป</option>
              </select>
            </div>

            {/* การ์ดสินค้า (Card Layout ชัดเจน) */}
            <div className="space-y-2.5">
              {products.length === 0 ? (
                <div className="bg-white py-12 rounded-2xl text-center text-xs font-medium text-[#8a7263] border border-[#eedbc5]">
                  ไม่พบรายการสินค้า
                </div>
              ) : (
                products.map((item) => {
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = item.quantity > 0 && item.quantity <= item.minStock;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-3.5 border border-[#eedbc5] shadow-xs"
                    >
                      {/* แถวบน: ชื่อสินค้า & สถานะ */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#2c1a0e] leading-snug">
                            {item.name}
                          </h3>
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#f6eee3] text-[#7d5d48]">
                            {item.category}
                          </span>
                        </div>

                        {/* ป้ายเตือน */}
                        <div>
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                              ● หมดแล้ว
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                              ● ใกล้หมด
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                              ● พอขาย
                            </span>
                          )}
                        </div>
                      </div>

                      {/* แถวล่าง: ตัวเลขคงเหลือ + ปุ่มกดเติม/เบิก */}
                      <div className="mt-3 pt-2.5 border-t border-[#f7ede1] flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-[#8a7263]">คงเหลือในร้าน</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#2c1a0e]">{item.quantity}</span>
                            <span className="text-xs font-bold text-[#8a7263]">{item.unit}</span>
                            <span className="text-[10px] text-[#b49f91] ml-1">
                              (เตือนเมื่อต่ำกว่า {item.minStock})
                            </span>
                          </div>
                        </div>

                        {/* ปุ่มกดใหญ่ กะทัดรัด แตะง่าย */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setAdjustAction('IN');
                              setIsAdjustStockOpen(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เติมของ</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setAdjustAction('OUT');
                              setIsAdjustStockOpen(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-[#c85a2b] active:bg-[#b04e22] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                            <span>เบิกใช้</span>
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(item.id, item.name)}
                            className="p-2 text-[#cbb6a8] hover:text-rose-600"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="w-4 h-4" />
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
        {/* TAB 2: เงินเปิดร้าน & รายจ่ายวันนี้ (เข้าใจง่าย ไม่ซับซ้อน) */}
        {/* ========================================================= */}
        {activeTab === 'cash' && (
          <div className="space-y-3">
            {/* ปุ่มลัด 2 ปุ่มใหญ่: เงินเปิดร้าน / ลงรายจ่าย */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setCashType('CHANGE_FUND');
                  setCashCategory('เงินทอนเปิดร้าน');
                  setIsAddCashOpen(true);
                }}
                className="py-3 px-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 shadow-xs"
              >
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>+ ลงเงินเปิดร้าน</span>
              </button>

              <button
                onClick={() => {
                  setCashType('EXPENSE');
                  setCashCategory('สั่งน้ำแข็ง');
                  setIsAddCashOpen(true);
                }}
                className="py-3 px-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 shadow-xs"
              >
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>- ลงรายจ่ายวันนี้</span>
              </button>
            </div>

            {/* รายการบันทึกล่าสุด */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#8a7263] px-1">รายการเงินสดล่าสุด</p>

              {cashTransactions.length === 0 ? (
                <div className="bg-white py-12 rounded-2xl text-center text-xs font-medium text-[#8a7263] border border-[#eedbc5]">
                  ยังไม่มีรายการบันทึกเงินสด
                </div>
              ) : (
                cashTransactions.map((tx) => {
                  const isChangeFund = tx.type === 'CHANGE_FUND';
                  return (
                    <div
                      key={tx.id}
                      className="bg-white rounded-2xl p-3.5 border border-[#eedbc5] shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isChangeFund
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isChangeFund ? 'เงินเปิดร้าน' : 'รายจ่าย'}
                          </span>
                          <span className="text-xs font-bold text-[#2c1a0e] truncate">
                            {tx.category}
                          </span>
                        </div>

                        {tx.note && (
                          <p className="text-xs text-[#8a7263] mt-1 truncate">{tx.note}</p>
                        )}

                        <p className="text-[10px] text-[#b49f91] mt-1">
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
                          className={`text-base font-black ${
                            isChangeFund ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isChangeFund ? '+' : '-'}฿{tx.amount.toLocaleString()}
                        </p>

                        <button
                          onClick={() => handleDeleteCash(tx.id)}
                          className="mt-1 text-xs text-[#b49f91] active:text-rose-600 p-1"
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
        {/* TAB 3: ประวัติ (Logs) */}
        {/* ========================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#a38b7d] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาในประวัติ..."
                value={searchLogs}
                onChange={(e) => setSearchLogs(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-white border border-[#eedbc5] rounded-xl text-xs focus:outline-hidden"
              />
            </div>

            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="bg-white py-12 rounded-2xl text-center text-xs font-medium text-[#8a7263] border border-[#eedbc5]">
                  ยังไม่มีประวัติ
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl p-3 border border-[#eedbc5] shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#2c1a0e] truncate">
                        {log.productName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          log.action === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'OUT'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {log.action === 'IN' ? 'เติมของ' : log.action === 'OUT' ? 'เบิกใช้' : 'ยอดยกมา'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-1 text-[#6e5849]">
                      <span>
                        {log.oldQuantity} → <strong className="text-[#c85a2b] font-bold">{log.newQuantity}</strong>{' '}
                        ({log.action === 'OUT' ? `-${log.changeQuantity}` : `+${log.changeQuantity}`})
                      </span>
                      <span className="text-[10px] text-[#b49f91]">
                        {new Date(log.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-[10px] text-[#8a7263] mt-0.5">เหตุผล: {log.reason}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 4. APP-LIKE BOTTOM BAR (กดง่ายด้วยนิ้วโป้ง) */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#eedbc5] shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-3 h-16">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'stock' ? 'text-[#c85a2b] font-extrabold' : 'text-[#8a7263]'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[11px]">เช็คสต็อก</span>
          </button>

          <button
            onClick={() => setActiveTab('cash')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'cash' ? 'text-[#c85a2b] font-extrabold' : 'text-[#8a7263]'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[11px]">เงินเปิดร้าน/จ่าย</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'logs' ? 'text-[#c85a2b] font-extrabold' : 'text-[#8a7263]'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[11px]">ประวัติ</span>
          </button>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* MODAL: เพิ่มสินค้าใหม่ */}
      {/* ========================================================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#2c1a0e]">✨ เพิ่มสินค้าใหม่</h2>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 text-[#8a7263] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6e5849] mb-1">ชื่อสินค้า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เมล็ดกาแฟ Ethiopia"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#6e5849] mb-1">หมวดหมู่</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-2 py-2 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-xs"
                  >
                    <option value="เมล็ดกาแฟ">เมล็ดกาแฟ</option>
                    <option value="วัตถุดิบนม">วัตถุดิบนม</option>
                    <option value="ชาและผงเครื่องดื่ม">ชาและเครื่องดื่ม</option>
                    <option value="บรรจุภัณฑ์">บรรจุภัณฑ์</option>
                    <option value="ทั่วไป">ทั่วไป</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6e5849] mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    placeholder="ถุง, ขวด, กล่อง"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#6e5849] mb-1">จำนวนตั้งต้น</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProductQuantity}
                    onChange={(e) => setNewProductQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6e5849] mb-1">จุดเตือนขั้นต่ำ</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProductMinStock}
                    onChange={(e) => setNewProductMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#eedbc5] text-[#6e5849] text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#c85a2b] text-white text-xs font-bold"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: เติมของ / เบิกใช้ */}
      {/* ========================================================= */}
      {isAdjustStockOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-[#2c1a0e]">
                {adjustAction === 'IN' ? '📦 เติมของเข้าสต็อก' : '📤 เบิกใช้หน้าร้าน'}
              </h2>
              <button
                onClick={() => setIsAdjustStockOpen(false)}
                className="p-1 text-[#8a7263] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8a7263] mb-3">
              <strong className="text-[#2c1a0e]">{selectedProduct.name}</strong> (คงเหลือ {selectedProduct.quantity} {selectedProduct.unit})
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6e5849] mb-1">
                  จำนวนที่{adjustAction === 'IN' ? 'เติม' : 'เบิก'} ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="ระบุตัวเลข"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-base font-black text-center"
                />

                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAdjustQty(String(num))}
                      className="py-1 bg-[#f5efe6] active:bg-[#eedbc5] rounded-lg text-xs font-bold text-[#6e5849]"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6e5849] mb-1">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder={adjustAction === 'IN' ? 'เช่น ซื้อของมาเพิ่ม' : 'เช่น ชงหน้าร้าน'}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#eedbc5] text-[#6e5849] text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold ${
                    adjustAction === 'IN' ? 'bg-emerald-600' : 'bg-[#c85a2b]'
                  }`}
                >
                  {loading ? 'กำลังบันทึก...' : `ยืนยัน${adjustAction === 'IN' ? 'เติมของ' : 'เบิกใช้'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: บันทึกเงินเปิดร้าน หรือ รายจ่ายวันนี้ */}
      {/* ========================================================= */}
      {isAddCashOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#2c1a0e]">
                {cashType === 'CHANGE_FUND' ? '🪙 บันทึกเงินเปิดร้าน' : '💸 บันทึกรายจ่ายวันนี้'}
              </h2>
              <button
                onClick={() => setIsAddCashOpen(false)}
                className="p-1 text-[#8a7263] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCash} className="space-y-3">
              {/* สลับประเภท: เงินเปิดร้าน หรือ รายจ่าย */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCashType('CHANGE_FUND');
                    setCashCategory('เงินทอนเปิดร้าน');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    cashType === 'CHANGE_FUND'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'border-[#eedbc5] text-[#8a7263]'
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
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    cashType === 'EXPENSE'
                      ? 'bg-rose-50 border-rose-400 text-rose-800'
                      : 'border-[#eedbc5] text-[#8a7263]'
                  }`}
                >
                  💸 รายจ่ายวันนี้
                </button>
              </div>

              {cashType === 'EXPENSE' && (
                <div>
                  <label className="block text-xs font-bold text-[#6e5849] mb-1">หมวดหมู่รายจ่าย</label>
                  <select
                    value={cashCategory}
                    onChange={(e) => setCashCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-xs font-bold"
                  >
                    <option value="สั่งน้ำแข็ง">สั่งน้ำแข็ง</option>
                    <option value="ซื้อวัตถุดิบเร่งด่วน">ซื้อวัตถุดิบเร่งด่วน (เช่น มะนาว/นม)</option>
                    <option value="ของใช้และอุปกรณ์">ของใช้และอุปกรณ์ทำความสะอาด</option>
                    <option value="ค่าใช้จ่ายอื่นๆ">ค่าใช้จ่ายอื่นๆ</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#6e5849] mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="เช่น 20 หรือ 2000"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-lg font-black text-center"
                />

                {/* ปุ่มแตะยอดฮิต */}
                {cashType === 'EXPENSE' && cashCategory === 'สั่งน้ำแข็ง' ? (
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {[20, 40, 60].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashAmount(String(amt))}
                        className="py-1 bg-[#f5efe6] active:bg-[#eedbc5] rounded-lg text-xs font-bold text-[#6e5849]"
                      >
                        {amt} บาท
                      </button>
                    ))}
                  </div>
                ) : cashType === 'CHANGE_FUND' ? (
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {[1000, 1500, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashAmount(String(amt))}
                        className="py-1 bg-[#f5efe6] active:bg-[#eedbc5] rounded-lg text-xs font-bold text-[#6e5849]"
                      >
                        {amt} บาท
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6e5849] mb-1">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder="เช่น น้ำแข็งหลอด 1 กระสอบ"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf7f2] border border-[#eedbc5] rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCashOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#eedbc5] text-[#6e5849] text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold ${
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
