'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  ClipboardCheck,
  Package,
  DollarSign,
  Plus,
  Minus,
  Search,
  Coins,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Pencil,
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
  latestFund?: {
    amount: number;
    date: string;
    note?: string | null;
  } | null;
  alreadyResetToday?: boolean;
  todayResetInfo?: {
    totalAmount: number;
    itemCount: number;
    date: string;
  } | null;
}

export default function Home() {
  // หน้าแรก: 'dashboard'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'cash'>('dashboard');

  // Stock State
  const [products, setProducts] = useState<Product[]>([]);
  const [searchStock, setSearchStock] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [visibleStockCount, setVisibleStockCount] = useState(50);
  // ตัวกรอง Dashboard: รวม "ควรเติม / หมด" ไว้ด้วยกัน
  const [dashboardFilter, setDashboardFilter] = useState<'ALL' | 'NEED_REFILL' | 'NORMAL'>('NEED_REFILL');

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustAction, setAdjustAction] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // New Product Form
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('น้ำ');
  const [newProductQuantity, setNewProductQuantity] = useState('0');
  const [newProductMinStock, setNewProductMinStock] = useState('5');
  const [newProductUnit, setNewProductUnit] = useState('ถุง');

  // Edit Product Form
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editProductId, setEditProductId] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('น้ำ');
  const [editProductQuantity, setEditProductQuantity] = useState('0');
  const [editProductMinStock, setEditProductMinStock] = useState('5');
  const [editProductUnit, setEditProductUnit] = useState('ถุง');

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
  const [showArchivedCash, setShowArchivedCash] = useState(false);
  const [isAddCashOpen, setIsAddCashOpen] = useState(false);
  const [cashType, setCashType] = useState<'CHANGE_FUND' | 'EXPENSE'>('EXPENSE');
  const [cashCategory, setCashCategory] = useState('สั่งน้ำแข็ง');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');

  // Loading & Alerts
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 2500);
  };

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    cancelText: 'ยกเลิก',
    onConfirm: () => {},
  });

  const askConfirmation = (opts: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText || 'ยืนยัน',
      cancelText: opts.cancelText || 'ยกเลิก',
      onConfirm: opts.onConfirm,
    });
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
      const url = `/api/cash?search=${encodeURIComponent(searchCash)}${showArchivedCash ? '&includeClosed=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCashTransactions(data.data);
        setCashSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCash();
  }, []);

  useEffect(() => {
    if (activeTab === 'stock' || activeTab === 'dashboard') fetchProducts();
    if (activeTab === 'cash') fetchCash();
    setVisibleStockCount(50);
  }, [activeTab, searchStock, selectedCategory, searchCash, showArchivedCash]);

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

  // Open Edit Product Modal
  const handleOpenEditProduct = (p: Product) => {
    setEditProductId(p.id);
    setEditProductName(p.name);
    setEditProductCategory(p.category);
    setEditProductQuantity(String(p.quantity));
    setEditProductMinStock(String(p.minStock));
    setEditProductUnit(p.unit);
    setIsEditProductOpen(true);
  };

  // Handle Update Product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${editProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProductName,
          category: editProductCategory,
          quantity: editProductQuantity,
          minStock: editProductMinStock,
          unit: editProductUnit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', `แก้ไข "${editProductName}" สำเร็จ`);
        setIsEditProductOpen(false);
        fetchProducts();
      } else {
        showAlert('error', data.error || 'เกิดข้อผิดพลาดในการแก้ไข');
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
  const handleDeleteProduct = (id: string, name: string) => {
    askConfirmation({
      title: 'ยืนยันการลบสินค้า',
      message: `ต้องการลบ "${name}" ออกจากระบบใช่หรือไม่?`,
      confirmText: 'ลบสินค้า',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showAlert('success', `ลบ "${name}" เรียบร้อย`);
            fetchProducts();
          } else {
            showAlert('error', data.error || 'เกิดข้อผิดพลาดในการลบ');
          }
        } catch (e: any) {
          showAlert('error', e.message);
        }
      },
    });
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
  const handleDeleteCash = (id: string, category?: string, amount?: number) => {
    const detail = category && amount ? ` "${category}" (฿${amount.toLocaleString()})` : 'นี้';
    askConfirmation({
      title: 'ยืนยันการลบรายการเงิน',
      message: `ต้องการลบรายการ${detail} ใช่หรือไม่?`,
      confirmText: 'ลบรายการ',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/cash/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showAlert('success', 'ลบรายการเรียบร้อย');
            fetchCash();
          } else {
            showAlert('error', data.error || 'เกิดข้อผิดพลาดในการลบ');
          }
        } catch (e: any) {
          showAlert('error', e.message);
        }
      },
    });
  };

  // Handle Reset Daily Expenses (กดได้วันละ 1 ครั้ง)
  const handleResetDailyExpenses = () => {
    if (cashSummary.alreadyResetToday) {
      showAlert('error', 'วันนี้ได้ทำการรีเซ็ทรายจ่ายไปแล้ว (สามารถกดได้วันละ 1 ครั้ง)');
      return;
    }

    askConfirmation({
      title: 'ยืนยันรีเซ็ทรายจ่ายประจำวัน',
      message: `คุณต้องการสรุปและรีเซ็ทรายจ่ายประจำวัน (ยอดรวม ฿${cashSummary.todayExpense.toLocaleString()}) ใช่หรือไม่?\n\nรายการรายจ่ายวันนี้จะถูกปิดรอบเพื่อไม่ให้ข้อมูลรก และสามารถกดได้วันละ 1 ครั้ง`,
      confirmText: 'ยืนยันรีเซ็ท',
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/cash/reset-daily', { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            showAlert('success', `รีเซ็ทรายจ่ายเรียบร้อย (฿${data.totalAmount.toLocaleString()})`);
            fetchCash();
          } else {
            showAlert('error', data.error || 'เกิดข้อผิดพลาดในการรีเซ็ท');
          }
        } catch (e: any) {
          showAlert('error', e.message);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Memoized stock groups for high performance with large datasets
  const outOfStockItems = useMemo(() => products.filter((p) => p.quantity === 0), [products]);
  const lowStockItems = useMemo(
    () => products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock),
    [products]
  );
  const normalStockItems = useMemo(() => products.filter((p) => p.quantity > p.minStock), [products]);
  const allRefillItems = useMemo(() => [...outOfStockItems, ...lowStockItems], [outOfStockItems, lowStockItems]);

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

          {activeTab === 'cash' ? (
            <button
              onClick={() => {
                setCashType('EXPENSE');
                setCashCategory('สั่งน้ำแข็ง');
                setIsAddCashOpen(true);
              }}
              className="px-2.5 py-1.5 bg-[#b83b3b] active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึกเงิน</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-2.5 py-1.5 bg-[#c85a2b] active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สินค้าใหม่</span>
            </button>
          )}
        </div>
      </header>

      {/* Alert Notification Toast */}
      {alertMsg && (
        <div className="fixed top-14 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div
            className={`max-w-md mx-auto flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-lg border text-xs font-semibold ${
              alertMsg.type === 'success'
                ? 'bg-[#eefbf2] border-[#a5d6a7] text-[#1e612f]'
                : 'bg-[#fdf2f2] border-[#f5c6cb] text-[#842029]'
            }`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{alertMsg.text}</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="max-w-md mx-auto px-3.5 py-2.5 w-full flex-1">
        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-2.5">
            {/* 1. สรุปเงินในเคาน์เตอร์ & รายจ่าย */}
            <div className="bg-white p-2.5 rounded-2xl border border-[#ebd5b3]/70 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2c1a0e] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#c85a2b]" />
                  <span>เงินเคาน์เตอร์ & รายจ่าย</span>
                </span>
                <span className="text-[10px] text-[#8a7263]">ยอดจริงหน้าร้าน</span>
              </div>

              {/* ยอดเงินคงเหลือในเคาน์เตอร์จริง (หลัก) */}
              <div className="bg-[#faece5] p-2.5 rounded-xl border border-[#ebd5b3] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#7d5032] block">เงินคงเหลือในเคาน์เตอร์:</span>
                  <span className="text-[10px] text-[#8a7263]">
                    {cashSummary.latestFund
                      ? `เติมล่าสุด ฿${cashSummary.latestFund.amount.toLocaleString()}`
                      : 'ใช้จ่ายจนหมดแล้วเบิกเพิ่ม'}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black ${cashSummary.netCashInDrawer < 500 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    ฿{cashSummary.netCashInDrawer.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* สรุปรายจ่ายวันนี้ + เติมล่าสุด */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#fcfbf9] p-2 rounded-xl border border-[#f0e4d0]">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-rose-800 leading-none">รายจ่ายวันนี้</p>
                    {cashSummary.alreadyResetToday && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded leading-tight">
                        รีเซ็ทแล้ว
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-rose-600 mt-1">
                    ฿{cashSummary.todayExpense.toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#fcfbf9] p-2 rounded-xl border border-[#f0e4d0]">
                  <p className="text-[10px] text-emerald-800 leading-none">เติมล่าสุด</p>
                  <p className="text-sm font-bold text-emerald-700 mt-1">
                    {cashSummary.latestFund ? `฿${cashSummary.latestFund.amount.toLocaleString()}` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. สรุปสถานะสต็อก: ไม่มีไอคอนในปุ่มและป้าย */}
            <div className="bg-white p-2.5 rounded-2xl border border-[#ebd5b3]/70 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2c1a0e] flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-[#c85a2b]" />
                  <span>สถานะสต็อกในร้าน</span>
                </span>
                <span className="text-[10px] text-[#8a7263]">
                  {products.length} รายการ
                </span>
              </div>

              {/* 3 ตัวกรอง (ไม่มีไอคอน) */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setDashboardFilter('NEED_REFILL')}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    dashboardFilter === 'NEED_REFILL'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  ควรเติม ({allRefillItems.length})
                </button>

                <button
                  onClick={() => setDashboardFilter('NORMAL')}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    dashboardFilter === 'NORMAL'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  ยังมีอยู่ ({normalStockItems.length})
                </button>

                <button
                  onClick={() => setDashboardFilter('ALL')}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    dashboardFilter === 'ALL'
                      ? 'bg-[#2c1a0e] text-white border-[#2c1a0e]'
                      : 'border-[#ebd5b3] bg-[#faf7f2] text-[#6e5849]'
                  }`}
                >
                  ทั้งหมด ({products.length})
                </button>
              </div>
            </div>

            {/* รายการสินค้า: ไม่มีไอคอน/จุดในป้ายสถานะ */}
            <div className="space-y-3">
              {/* กลุ่ม 1: สินค้าหมด */}
              {(dashboardFilter === 'NEED_REFILL' || dashboardFilter === 'ALL') && outOfStockItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-xs font-bold text-rose-800">
                      หมดสต็อก ({outOfStockItems.length} รายการ)
                    </span>
                  </div>

                  {outOfStockItems.map((item) => {
                    const neededAmount = Math.max(1, item.minStock - item.quantity);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-2.5 border border-rose-200 bg-rose-50/20 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-bold text-[#2c1a0e] leading-tight truncate">
                                {item.name}
                              </h3>
                              <button
                                onClick={() => handleOpenEditProduct(item)}
                                className="p-0.5 text-[#a89587] hover:text-[#c85a2b] shrink-0"
                                title="แก้ไขชื่อ/หน่วย"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f5efe6] text-[#785741] font-medium">
                                {item.category}
                              </span>
                              <span className="text-[9px] text-[#8a7263]">
                                ขั้นต่ำ: {item.minStock} {item.unit}
                              </span>
                            </div>
                          </div>

                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                            หมด
                          </span>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-rose-100 flex items-center justify-between gap-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[11px] text-[#8a7263]">คงเหลือ:</span>
                            <span className="text-base font-extrabold leading-none text-rose-600">0</span>
                            <span className="text-[11px] text-[#8a7263]">{item.unit}</span>
                            <span className="text-[10px] font-bold text-rose-700 ml-1">
                              (ขาด {neededAmount})
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setAdjustAction('IN');
                              setAdjustQty(String(neededAmount));
                              setIsAdjustStockOpen(true);
                            }}
                            className="px-3 py-1 rounded-md bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เติมของ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* กลุ่ม 2: สินค้าควรเติม */}
              {(dashboardFilter === 'NEED_REFILL' || dashboardFilter === 'ALL') && lowStockItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-xs font-bold text-amber-900">
                      ควรเติม ({lowStockItems.length} รายการ)
                    </span>
                  </div>

                  {lowStockItems.map((item) => {
                    const neededAmount = Math.max(1, item.minStock - item.quantity);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-2.5 border border-amber-200 bg-amber-50/20 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-bold text-[#2c1a0e] leading-tight truncate">
                                {item.name}
                              </h3>
                              <button
                                onClick={() => handleOpenEditProduct(item)}
                                className="p-0.5 text-[#a89587] hover:text-[#c85a2b] shrink-0"
                                title="แก้ไขชื่อ/หน่วย"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f5efe6] text-[#785741] font-medium">
                                {item.category}
                              </span>
                              <span className="text-[9px] text-[#8a7263]">
                                จุดเตือน: {item.minStock} {item.unit}
                              </span>
                            </div>
                          </div>

                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                            ควรเติม
                          </span>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-amber-100 flex items-center justify-between gap-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[11px] text-[#8a7263]">คงเหลือ:</span>
                            <span className="text-base font-extrabold leading-none text-amber-800">
                              {item.quantity}
                            </span>
                            <span className="text-[11px] text-[#8a7263]">{item.unit}</span>
                            <span className="text-[10px] font-semibold text-amber-900 ml-1">
                              (ขาด {neededAmount})
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setAdjustAction('IN');
                              setAdjustQty(String(neededAmount));
                              setIsAdjustStockOpen(true);
                            }}
                            className="px-3 py-1 rounded-md bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เติมของ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ข้อความแจ้งเตือนเมื่อไม่มีของที่ต้องเติม */}
              {dashboardFilter === 'NEED_REFILL' && allRefillItems.length === 0 && (
                <div className="bg-white py-10 rounded-2xl text-center border border-emerald-200 bg-emerald-50/20 px-4">
                  <p className="text-xs font-bold text-emerald-800">สต็อกครบพร้อมขายทุกตัว</p>
                  <p className="text-[10px] text-emerald-700/80 mt-0.5">ไม่มีสินค้าที่หมดหรือควรเติมในตอนนี้</p>
                </div>
              )}

              {/* กลุ่ม 3: สินค้าที่ยังมีอยู่ */}
              {(dashboardFilter === 'NORMAL' || dashboardFilter === 'ALL') && normalStockItems.length > 0 && (
                <div className="space-y-1.5">
                  {dashboardFilter === 'ALL' && (
                    <div className="flex items-center gap-1 px-1 pt-1">
                      <span className="text-xs font-bold text-emerald-800">
                        ยังมีอยู่ ({normalStockItems.length} รายการ)
                      </span>
                    </div>
                  )}

                  {normalStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-2.5 border border-[#ebd5b3]/70 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-[#2c1a0e] leading-tight truncate">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => handleOpenEditProduct(item)}
                              className="p-0.5 text-[#a89587] hover:text-[#c85a2b] shrink-0"
                              title="แก้ไขชื่อ/หน่วย"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f5efe6] text-[#785741] font-medium">
                              {item.category}
                            </span>
                            <span className="text-[9px] text-[#8a7263]">
                              ขั้นต่ำ: {item.minStock} {item.unit}
                            </span>
                          </div>
                        </div>

                        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
                          ยังมีอยู่
                        </span>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-[#f5ecde] flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[11px] text-[#8a7263]">คงเหลือ:</span>
                          <span className="text-base font-extrabold leading-none text-[#2c1a0e]">
                            {item.quantity}
                          </span>
                          <span className="text-[11px] text-[#8a7263]">{item.unit}</span>
                        </div>

                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          พร้อมขาย
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: คลังสต็อก (ไม่มีไอคอนในป้ายสถานะ) */}
        {/* ========================================================= */}
        {activeTab === 'stock' && (
          <div className="space-y-2">
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
                {['ทั้งหมด', 'น้ำ', 'นม', 'ท็อปปิ้ง', 'แก้ว', 'ฝาปิด', 'เซ็ตพร้อมดื่ม', 'หลอด', 'ถุงใส่แก้ว', 'ไซรัป', 'เมนูเพิ่มเติม', 'เครื่องดื่มในตู้', 'อุปกรณ์'].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'ทั้งหมด' ? 'ทุกหมวด' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              {products.length === 0 ? (
                <div className="bg-white py-10 rounded-xl text-center text-xs text-[#8a7263] border border-[#ebd5b3]">
                  ไม่พบรายการสินค้า
                </div>
              ) : (
                <>
                  {products.slice(0, visibleStockCount).map((item) => {
                    const isOut = item.quantity === 0;
                    const isLow = item.quantity > 0 && item.quantity <= item.minStock;

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-2.5 border border-[#ebd5b3]/70 shadow-2xs hover:border-[#c85a2b]/40 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-bold text-[#2c1a0e] leading-tight truncate">
                                {item.name}
                              </h3>
                              <button
                                onClick={() => handleOpenEditProduct(item)}
                                className="p-0.5 text-[#a89587] hover:text-[#c85a2b] shrink-0"
                                title="แก้ไขชื่อ/หน่วย"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f5efe6] text-[#785741] font-medium">
                                {item.category}
                              </span>
                              <span className="text-[9px] text-[#9c8475]">
                                เตือน: {item.minStock} {item.unit}
                              </span>
                            </div>
                          </div>

                          {isOut ? (
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 leading-none">
                              หมด
                            </span>
                          ) : isLow ? (
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 leading-none">
                              ควรเติม
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 leading-none">
                              ยังมีอยู่
                            </span>
                          )}
                        </div>

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
                                setAdjustQty('1');
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
                                setAdjustQty('1');
                                setIsAdjustStockOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-md bg-[#c85a2b] active:bg-[#b04e22] text-white font-bold text-xs flex items-center gap-1 whitespace-nowrap shadow-2xs"
                            >
                              <Minus className="w-3 h-3" />
                              <span>เบิก</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditProduct(item)}
                              className="p-1 text-[#8a7263] hover:text-[#c85a2b] active:scale-90"
                              title="แก้ไขสินค้า"
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
                  })}

                  {products.length > visibleStockCount && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleStockCount((prev) => prev + 50)}
                        className="w-full py-2 bg-white hover:bg-[#faf7f2] border border-[#ebd5b3] text-[#c85a2b] font-bold text-xs rounded-xl shadow-2xs active:scale-95 transition-all"
                      >
                        แสดงเพิ่มอีก ({products.length - visibleStockCount} รายการ)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: เงินเคาน์เตอร์ & รายจ่าย */}
        {/* ========================================================= */}
        {activeTab === 'cash' && (
          <div className="space-y-2">
            {/* กล่องเงินคงเหลือเคาน์เตอร์ */}
            <div className="bg-[#faece5] p-2.5 rounded-xl border border-[#ebd5b3] flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] font-bold text-[#7d5032] block">เงินคงเหลือในเคาน์เตอร์:</span>
                <span className="text-[10px] text-[#8a7263]">
                  {cashSummary.latestFund
                    ? `เติมล่าสุด ฿${cashSummary.latestFund.amount.toLocaleString()}`
                    : 'ใช้จ่ายจนหมดแล้วเบิกเพิ่ม'}
                </span>
              </div>
              <span className="font-black text-base text-[#2c1a0e]">
                ฿{cashSummary.netCashInDrawer.toLocaleString()}
              </span>
            </div>

            {/* แถบสรุปรายจ่ายวันนี้ + ปุ่มรีเซ็ทรายจ่ายประจำวัน */}
            <div className="bg-white p-2.5 rounded-xl border border-[#ebd5b3]/70 shadow-2xs flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-rose-800 font-bold">รายจ่ายวันนี้:</span>
                  <span className="text-sm font-black text-rose-600">
                    ฿{cashSummary.todayExpense.toLocaleString()}
                  </span>
                </div>
                {cashSummary.todayResetInfo ? (
                  <p className="text-[9px] text-emerald-700 font-medium mt-0.5">
                    ✓ รีเซ็ทแล้ว ฿{cashSummary.todayResetInfo.totalAmount.toLocaleString()} ({cashSummary.todayResetInfo.itemCount} รายการ)
                  </p>
                ) : (
                  <p className="text-[9px] text-[#8a7263] mt-0.5">
                    กดรีเซ็ทเมื่อสิ้นสุดวันเพื่อปิดยอด
                  </p>
                )}
              </div>

              {cashSummary.alreadyResetToday ? (
                <button
                  type="button"
                  disabled
                  className="px-2.5 py-1.5 bg-[#eefbf2] border border-[#a5d6a7] text-[#1e612f] rounded-lg text-xs font-bold flex items-center gap-1 opacity-90 cursor-not-allowed shadow-2xs"
                  title="วันนี้ได้ทำการรีเซ็ทรายจ่ายไปแล้ว สามารถกดได้วันละ 1 ครั้ง"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>รีเซ็ทแล้ววันนี้</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetDailyExpenses}
                  className="px-2.5 py-1.5 bg-[#faece5] hover:bg-[#f3ded2] border border-[#d9825b] active:scale-95 text-[#a84419] rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>รีเซ็ทรายจ่าย</span>
                </button>
              )}
            </div>

            {/* ส่วนหัวตารางรายการ และปุ่มดูประวัติที่ปิดรอบแล้ว */}
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-xs font-bold text-[#2c1a0e]">
                {showArchivedCash ? 'ประวัติรายการเงินทั้งหมด' : 'รายการปัจจุบัน'}
              </span>
              <button
                type="button"
                onClick={() => setShowArchivedCash(!showArchivedCash)}
                className="text-[10px] text-[#8a7263] hover:text-[#c85a2b] font-medium underline"
              >
                {showArchivedCash ? 'ดูเฉพาะปัจจุบัน' : '+ ดูประวัติที่รีเซ็ทแล้ว'}
              </button>
            </div>

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
                            {isChangeFund ? 'เติมเงิน' : 'จ่าย'}
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
                          onClick={() => handleDeleteCash(tx.id, tx.category, tx.amount)}
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
      {/* 4. COMPACT BOTTOM BAR */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ebd5b3] shadow-md">
        <div className="max-w-md mx-auto grid grid-cols-3 h-13">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'dashboard' ? 'text-[#c85a2b] font-bold' : 'text-[#8a7263]'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-[10px]">สถานะสต็อก</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'stock' ? 'text-[#c85a2b] font-bold' : 'text-[#8a7263]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-[10px]">คลังสต็อก</span>
          </button>

          <button
            onClick={() => setActiveTab('cash')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'cash' ? 'text-[#c85a2b] font-bold' : 'text-[#8a7263]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px]">เงินเคาน์เตอร์</span>
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
                    {['น้ำ', 'นม', 'ท็อปปิ้ง', 'แก้ว', 'ฝาปิด', 'เซ็ตพร้อมดื่ม', 'หลอด', 'ถุงใส่แก้ว', 'ไซรัป', 'เมนูเพิ่มเติม', 'เครื่องดื่มในตู้', 'อุปกรณ์', 'ทั่วไป'].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
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
      {/* MODAL: แก้ไขข้อมูลสินค้า */}
      {/* ========================================================= */}
      {isEditProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#2c1a0e] flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-[#c85a2b]" />
                <span>แก้ไขข้อมูลสินค้า</span>
              </h2>
              <button onClick={() => setIsEditProductOpen(false)} className="p-1 text-[#8a7263]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">ชื่อสินค้า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ชาใต้ 75%"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs font-semibold text-[#2c1a0e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">หมวดหมู่</label>
                  <select
                    value={editProductCategory}
                    onChange={(e) => setEditProductCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs"
                  >
                    {['น้ำ', 'นม', 'ท็อปปิ้ง', 'แก้ว', 'ฝาปิด', 'เซ็ตพร้อมดื่ม', 'หลอด', 'ถุงใส่แก้ว', 'ไซรัป', 'เมนูเพิ่มเติม', 'เครื่องดื่มในตู้', 'อุปกรณ์', 'ทั่วไป'].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    placeholder="ถุง, ขวด, ใบ, กล่อง"
                    value={editProductUnit}
                    onChange={(e) => setEditProductUnit(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">จำนวนคงเหลือ</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editProductQuantity}
                    onChange={(e) => setEditProductQuantity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6e5849] mb-0.5">จุดเตือนขั้นต่ำ</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editProductMinStock}
                    onChange={(e) => setEditProductMinStock(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditProductOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-[#ebd5b3] text-[#6e5849] text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-[#c85a2b] text-white text-xs font-bold shadow-2xs hover:bg-[#b04e22] active:scale-95 transition-all"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: เติมสต็อก (ไม่มีปุ่มเบิกใน Dashboard) */}
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
      {/* MODAL: เติมเงินเคาน์เตอร์ / บันทึกรายจ่าย */}
      {/* ========================================================= */}
      {isAddCashOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#2c1a0e]">
                {cashType === 'CHANGE_FUND' ? 'เติมเงินเคาน์เตอร์' : 'บันทึกรายจ่าย'}
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
                    setCashCategory('เติมเงินเคาน์เตอร์');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    cashType === 'CHANGE_FUND'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'border-[#ebd5b3] text-[#8a7263]'
                  }`}
                >
                  เติมเงินเคาน์เตอร์
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashType('EXPENSE');
                    setCashCategory('สั่งน้ำแข็ง');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    cashType === 'EXPENSE'
                      ? 'bg-rose-50 border-rose-400 text-rose-800'
                      : 'border-[#ebd5b3] text-[#8a7263]'
                  }`}
                >
                  บันทึกรายจ่าย
                </button>
              </div>

              {cashType === 'CHANGE_FUND' && (
                <div className="text-[10px] text-[#7d5032] bg-[#fdf8f4] p-2 rounded-lg border border-[#ebd5b3]">
                  ใส่ยอดเงินก้อนที่เบิกมาเติมในเคาน์เตอร์ (ใช้จ่ายเรื่อยๆ จนหมดแล้วค่อยเติมใหม่)
                </div>
              )}

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
                    {[1000, 2000, 3000].map((amt) => (
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

      {/* ========================================================= */}
      {/* MODAL: ยืนยันการทำรายการ (Custom Confirmation Dialog) */}
      {/* ========================================================= */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-2xl border border-[#ebd5b3] text-center animate-in zoom-in-95 duration-150">
            {/* Warning Icon Badge */}
            <div className="w-12 h-12 mx-auto mb-2.5 rounded-full flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-[#2c1a0e] mb-1">
              {confirmDialog.title}
            </h3>

            {/* Message */}
            <p className="text-xs text-[#6e5849] leading-relaxed mb-4">
              {confirmDialog.message}
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="py-2 px-3 rounded-xl border border-[#ebd5b3] text-[#6e5849] text-xs font-semibold hover:bg-[#faf7f2] active:scale-95 transition-all"
              >
                {confirmDialog.cancelText || 'ยกเลิก'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  confirmDialog.onConfirm();
                }}
                className="py-2 px-3 rounded-xl bg-[#b83b3b] text-white text-xs font-bold shadow-2xs hover:bg-[#a13232] active:scale-95 transition-all"
              >
                {confirmDialog.confirmText || 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
