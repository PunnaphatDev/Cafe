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
  TrendingUp,
  Snowflake,
  Coins,
  Wallet,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowDownRight,
  ArrowUpRight
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
    setTimeout(() => setAlertMsg(null), 4000);
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
    if (!confirm(`คุณแน่ใจว่าต้องการลบสินค้า "${name}" ใช่หรือไม่?`)) return;
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
        showAlert('success', 'บันทึกรายการเงินสดสำเร็จ');
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
    if (!confirm('ยืนยันที่จะลบรายการนี้ใช่หรือไม่?')) return;
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
    <div className="min-h-screen bg-[#faf7f2] flex flex-col font-sans">
      {/* Top Banner / Navigation */}
      <header className="bg-white border-b border-[#ebd5b3]/70 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#ebd5b3] shadow-xs bg-[#fdfbf9]">
                <Image
                  src="/logo.jpg"
                  alt="AUSTIN Cat Hotel & Cafe"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#2c1a0e] flex items-center gap-2">
                  <span>AUSTIN</span>
                  <span className="text-[#c85a2b] font-normal text-sm px-2 py-0.5 rounded-full bg-[#faece5]">
                    CAT HOTEL & CAFE
                  </span>
                </h1>
                <p className="text-xs text-[#8f7565] tracking-widest uppercase">
                  SAFE • CALM • COZY
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('stock')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'stock'
                    ? 'bg-[#c85a2b] text-white shadow-sm'
                    : 'text-[#6e5849] hover:bg-[#f3ede2]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>จัดการสต็อก</span>
              </button>

              <button
                onClick={() => setActiveTab('cash')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'cash'
                    ? 'bg-[#c85a2b] text-white shadow-sm'
                    : 'text-[#6e5849] hover:bg-[#f3ede2]'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>เงินสด & เงินทอน</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'logs'
                    ? 'bg-[#c85a2b] text-white shadow-sm'
                    : 'text-[#6e5849] hover:bg-[#f3ede2]'
                }`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">ประวัติสต็อก</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Alert Notification Toast */}
      {alertMsg && (
        <div className="fixed top-24 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              alertMsg.type === 'success'
                ? 'bg-[#eefaf2] border-[#a5d6a7] text-[#1e612f]'
                : 'bg-[#fdf2f2] border-[#f5c6cb] text-[#842029]'
            }`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* ========================================================= */}
        {/* TAB 1: STOCK MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#8f7565]">สินค้าทั้งหมด</p>
                  <p className="text-2xl font-bold text-[#2c1a0e] mt-1">{products.length} รายการ</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#f5efe6] flex items-center justify-center text-[#c85a2b]">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700">สินค้าใกล้หมด</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{lowStockCount} รายการ</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-rose-700">สินค้าหมดสต็อก</p>
                  <p className="text-2xl font-bold text-rose-900 mt-1">{outOfStockCount} รายการ</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filter and Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#a38b7d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า เช่น เมล็ดกาแฟ, นมสด..."
                  value={searchStock}
                  onChange={(e) => setSearchStock(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {['ทั้งหมด', 'เมล็ดกาแฟ', 'วัตถุดิบนม', 'ชาและผงเครื่องดื่ม', 'บรรจุภัณฑ์'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#2c1a0e] text-white'
                        : 'bg-[#f5efe6] text-[#6e5849] hover:bg-[#ebd5b3]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Add Product Button */}
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#c85a2b] hover:bg-[#b04e22] text-white rounded-xl text-sm font-medium shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มสินค้าใหม่</span>
              </button>
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-2xl border border-[#ebd5b3]/60 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8f4ee] border-b border-[#ebd5b3]/70 text-[#6e5849] uppercase text-xs">
                    <tr>
                      <th className="px-5 py-4">ชื่อสินค้า</th>
                      <th className="px-5 py-4">หมวดหมู่</th>
                      <th className="px-5 py-4 text-center">คงเหลือ</th>
                      <th className="px-5 py-4 text-center">จุดเตือนขั้นต่ำ</th>
                      <th className="px-5 py-4 text-center">หน่วยนับ</th>
                      <th className="px-5 py-4 text-center">สถานะ</th>
                      <th className="px-5 py-4 text-right">จัดการสต็อก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebd5b3]/40">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-[#8f7565]">
                          ไม่พบรายการสินค้า
                        </td>
                      </tr>
                    ) : (
                      products.map((item) => {
                        const isOutOfStock = item.quantity === 0;
                        const isLowStock = item.quantity > 0 && item.quantity <= item.minStock;

                        return (
                          <tr key={item.id} className="hover:bg-[#faf7f2]/80 transition-colors">
                            <td className="px-5 py-4 font-semibold text-[#2c1a0e]">
                              {item.name}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-[#f5efe6] text-[#785741]">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center font-bold text-base text-[#2c1a0e]">
                              {item.quantity}
                            </td>
                            <td className="px-5 py-4 text-center text-[#8f7565]">
                              {item.minStock}
                            </td>
                            <td className="px-5 py-4 text-center text-[#8f7565]">
                              {item.unit}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                  ● หมดสต็อก
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  ● ใกล้หมด
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  ● ปกติ
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedProduct(item);
                                    setAdjustAction('IN');
                                    setIsAdjustStockOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs flex items-center gap-1 transition-all"
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
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-xs flex items-center gap-1 transition-all"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                  <span>เบิกออก</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(item.id, item.name)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all"
                                  title="ลบสินค้า"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CASH MANAGEMENT & CHANGE FUND */}
        {/* ========================================================= */}
        {activeTab === 'cash' && (
          <div className="space-y-6">
            {/* Cash Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-rose-700">ค่าใช้จ่ายเงินสดวันนี้</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">
                    ฿{cashSummary.todayExpense.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-sky-700">ยอดสั่งน้ำแข็งสะสม</p>
                  <p className="text-2xl font-bold text-sky-600 mt-1">
                    ฿{cashSummary.totalIceExpense.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <Snowflake className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700">เงินทอนเปิดร้านวันนี้</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    ฿{cashSummary.todayChangeFund.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Coins className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#c85a2b]">เงินสดสุทธิในลิ้นชัก</p>
                  <p className="text-2xl font-bold text-[#2c1a0e] mt-1">
                    ฿{cashSummary.netCashInDrawer.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#faece5] flex items-center justify-center text-[#c85a2b]">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filter and New Record Button */}
            <div className="bg-white p-4 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#a38b7d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหา เช่น สั่งน้ำแข็ง, มะนาว, เงินทอน..."
                  value={searchCash}
                  onChange={(e) => setSearchCash(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {[
                  { label: 'ทั้งหมด', val: 'ทั้งหมด' },
                  { label: 'ค่าใช้จ่าย', val: 'EXPENSE' },
                  { label: 'เงินทอนเปิดร้าน', val: 'CHANGE_FUND' },
                  { label: 'รายรับเงินสด', val: 'INCOME' },
                ].map((t) => (
                  <button
                    key={t.val}
                    onClick={() => setSelectedCashType(t.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCashType === t.val
                        ? 'bg-[#2c1a0e] text-white'
                        : 'bg-[#f5efe6] text-[#6e5849] hover:bg-[#ebd5b3]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Add Cash Record Button */}
              <button
                onClick={() => setIsAddCashOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#1b6b47] hover:bg-[#155638] text-white rounded-xl text-sm font-medium shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ บันทึกรายการใหม่</span>
              </button>
            </div>

            {/* Cash Table */}
            <div className="bg-white rounded-2xl border border-[#ebd5b3]/60 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8f4ee] border-b border-[#ebd5b3]/70 text-[#6e5849] uppercase text-xs">
                    <tr>
                      <th className="px-5 py-4">วันที่ / เวลา</th>
                      <th className="px-5 py-4">ประเภท</th>
                      <th className="px-5 py-4">หมวดหมู่</th>
                      <th className="px-5 py-4 text-right">จำนวนเงิน</th>
                      <th className="px-5 py-4">รายละเอียด / หมายเหตุ</th>
                      <th className="px-5 py-4">ผู้บันทึก</th>
                      <th className="px-5 py-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebd5b3]/40">
                    {cashTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-[#8f7565]">
                          ไม่พบรายการเงินสด
                        </td>
                      </tr>
                    ) : (
                      cashTransactions.map((tx) => {
                        const isExpense = tx.type === 'EXPENSE';
                        const isIncome = tx.type === 'INCOME';

                        return (
                          <tr key={tx.id} className="hover:bg-[#faf7f2]/80 transition-colors">
                            <td className="px-5 py-4 text-[#8f7565] text-xs">
                              {new Date(tx.date).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-5 py-4">
                              {isExpense && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700">
                                  ● จ่ายออก
                                </span>
                              )}
                              {isIncome && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                                  ● รายรับ
                                </span>
                              )}
                              {tx.type === 'CHANGE_FUND' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700">
                                  ● เงินทอน
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 font-semibold text-[#2c1a0e]">
                              {tx.category}
                            </td>
                            <td
                              className={`px-5 py-4 text-right font-bold text-base ${
                                isExpense ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {isExpense ? '-' : '+'}฿{tx.amount.toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-[#8f7565]">
                              {tx.note || '-'}
                            </td>
                            <td className="px-5 py-4 text-xs text-[#8f7565]">
                              {tx.recordedBy || 'Staff'}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => handleDeleteCash(tx.id)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STOCK LOGS */}
        {/* ========================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-[#ebd5b3]/60 shadow-xs flex items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-[#a38b7d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า หรือเหตุผลในประวัติ..."
                  value={searchLogs}
                  onChange={(e) => setSearchLogs(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                />
              </div>
              <button
                onClick={fetchLogs}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f5efe6] text-[#6e5849] hover:bg-[#ebd5b3] text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span>รีเฟรช</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#ebd5b3]/60 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8f4ee] border-b border-[#ebd5b3]/70 text-[#6e5849] uppercase text-xs">
                    <tr>
                      <th className="px-5 py-4">วัน / เวลา</th>
                      <th className="px-5 py-4">ชื่อสินค้า</th>
                      <th className="px-5 py-4 text-center">ประเภท</th>
                      <th className="px-5 py-4 text-center">ยอดเดิม</th>
                      <th className="px-5 py-4 text-center">จำนวนที่เปลี่ยน</th>
                      <th className="px-5 py-4 text-center">ยอดคงเหลือใหม่</th>
                      <th className="px-5 py-4">เหตุผล / หมายเหตุ</th>
                      <th className="px-5 py-4">ผู้ทำรายการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebd5b3]/40">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-[#8f7565]">
                          ยังไม่มีประวัติการปรับสต็อก
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#faf7f2]/80 transition-colors">
                          <td className="px-5 py-4 text-[#8f7565] text-xs">
                            {new Date(log.createdAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-5 py-4 font-semibold text-[#2c1a0e]">
                            {log.productName}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {log.action === 'IN' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                รับเข้า
                              </span>
                            )}
                            {log.action === 'OUT' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                                เบิกออก
                              </span>
                            )}
                            {log.action === 'INITIAL' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                                ยอดยกมา
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center text-[#8f7565]">{log.oldQuantity}</td>
                          <td className="px-5 py-4 text-center font-bold">
                            {log.action === 'OUT' ? `-${log.changeQuantity}` : `+${log.changeQuantity}`}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-[#c85a2b]">{log.newQuantity}</td>
                          <td className="px-5 py-4 text-[#8f7565]">{log.reason || '-'}</td>
                          <td className="px-5 py-4 text-xs text-[#8f7565]">{log.userEmail || 'Staff'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: เพิ่มสินค้าใหม่ */}
      {/* ========================================================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#ebd5b3]">
            <h2 className="text-xl font-bold text-[#2c1a0e] mb-4">✨ เพิ่มสินค้าใหม่</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6e5849] mb-1">ชื่อสินค้า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เมล็ดกาแฟ Ethiopia"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6e5849] mb-1">หมวดหมู่</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                  >
                    <option value="เมล็ดกาแฟ">เมล็ดกาแฟ</option>
                    <option value="วัตถุดิบนม">วัตถุดิบนม</option>
                    <option value="ชาและผงเครื่องดื่ม">ชาและผงเครื่องดื่ม</option>
                    <option value="บรรจุภัณฑ์">บรรจุภัณฑ์</option>
                    <option value="ไซรัปและซอส">ไซรัปและซอส</option>
                    <option value="ทั่วไป">ทั่วไป</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6e5849] mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    placeholder="ถุง, ขวด, กล่อง"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6e5849] mb-1">จำนวนเริ่มต้น</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProductQuantity}
                    onChange={(e) => setNewProductQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6e5849] mb-1">จุดเตือนขั้นต่ำ</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProductMinStock}
                    onChange={(e) => setNewProductMinStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#ebd5b3] text-[#6e5849] text-sm font-medium hover:bg-[#faf7f2]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#c85a2b] hover:bg-[#b04e22] text-white text-sm font-medium shadow-sm transition-all"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ปรับสต็อก (รับเข้า / เบิกออก) */}
      {/* ========================================================= */}
      {isAdjustStockOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#ebd5b3]">
            <h2 className="text-xl font-bold text-[#2c1a0e] mb-1">
              {adjustAction === 'IN' ? '📦 รับเข้าสต็อก' : '📤 เบิกออกสต็อก'}
            </h2>
            <p className="text-sm text-[#8f7565] mb-4">
              สินค้า: <strong className="text-[#2c1a0e]">{selectedProduct.name}</strong> (คงเหลือ {selectedProduct.quantity} {selectedProduct.unit})
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6e5849] mb-1">
                  จำนวน ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="ระบุจำนวน"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e5849] mb-1">เหตุผล / หมายเหตุ</label>
                <input
                  type="text"
                  placeholder={adjustAction === 'IN' ? 'เช่น ซื้อของมาเพิ่ม' : 'เช่น ชงกาแฟหน้าร้าน, วัตถุดิบหมดอายุ'}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#ebd5b3] text-[#6e5849] text-sm font-medium hover:bg-[#faf7f2]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm transition-all ${
                    adjustAction === 'IN'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
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
      {/* MODAL: บันทึกเงินสด / เงินทอน / ค่าใช้จ่าย */}
      {/* ========================================================= */}
      {isAddCashOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#ebd5b3]">
            <h2 className="text-xl font-bold text-[#2c1a0e] mb-4">💵 บันทึกรายการเงินสด</h2>

            <form onSubmit={handleCreateCash} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6e5849] mb-1">ประเภทรายการ</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCashType('EXPENSE');
                      setCashCategory('สั่งน้ำแข็ง');
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      cashType === 'EXPENSE'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'border-[#ebd5b3] text-[#6e5849] hover:bg-[#faf7f2]'
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
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      cashType === 'CHANGE_FUND'
                        ? 'bg-sky-50 border-sky-300 text-sky-700'
                        : 'border-[#ebd5b3] text-[#6e5849] hover:bg-[#faf7f2]'
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
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      cashType === 'INCOME'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'border-[#ebd5b3] text-[#6e5849] hover:bg-[#faf7f2]'
                    }`}
                  >
                    รายรับ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e5849] mb-1">หมวดหมู่</label>
                <select
                  value={cashCategory}
                  onChange={(e) => setCashCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                >
                  {cashType === 'EXPENSE' && (
                    <>
                      <option value="สั่งน้ำแข็ง">สั่งน้ำแข็ง</option>
                      <option value="ซื้อวัตถุดิบเร่งด่วน">ซื้อวัตถุดิบเร่งด่วน (เช่น มะนาว, นม)</option>
                      <option value="ของใช้และอุปกรณ์ทำความสะอาด">ของใช้และอุปกรณ์ทำความสะอาด</option>
                      <option value="ค่าซ่อมแซม">ค่าซ่อมแซม</option>
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
                <label className="block text-xs font-semibold text-[#6e5849] mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="เช่น 20 หรือ 500"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e5849] mb-1">รายละเอียด / หมายเหตุ</label>
                <input
                  type="text"
                  placeholder="เช่น น้ำแข็งหลอด 1 กระสอบ"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e5849] mb-1">ผู้บันทึก</label>
                <input
                  type="text"
                  value={cashRecordedBy}
                  onChange={(e) => setCashRecordedBy(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#faf7f2] border border-[#ebd5b3] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#c85a2b]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddCashOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#ebd5b3] text-[#6e5849] text-sm font-medium hover:bg-[#faf7f2]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#1b6b47] hover:bg-[#155638] text-white text-sm font-medium shadow-sm transition-all"
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
