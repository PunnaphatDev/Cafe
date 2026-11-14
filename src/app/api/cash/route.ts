import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';

    const where: any = { isActive: true };

    if (type && type !== 'ทั้งหมด') {
      where.type = type;
    }
    if (category && category !== 'ทั้งหมด') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { note: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const transactions = await prisma.cashTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 200,
    });

    // Calculate Summary
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const allActive = await prisma.cashTransaction.findMany({
      where: { isActive: true },
      orderBy: { date: 'desc' },
    });

    let totalIceExpense = 0;
    let todayExpense = 0;
    let todayChangeFund = 0;
    let todayIncome = 0;
    let netCashInDrawer = 0;
    let latestFund: { amount: number; date: Date; note: string | null } | null = null;

    for (const tx of allActive) {
      const isToday = new Date(tx.date) >= startOfToday && new Date(tx.date) <= endOfToday;

      if (tx.category.includes('น้ำแข็ง')) {
        totalIceExpense += tx.amount;
      }

      if (tx.type === 'CHANGE_FUND') {
        netCashInDrawer += tx.amount;
        if (isToday) todayChangeFund += tx.amount;
        if (!latestFund) {
          latestFund = {
            amount: tx.amount,
            date: tx.date,
            note: tx.note,
          };
        }
      } else if (tx.type === 'EXPENSE') {
        netCashInDrawer -= tx.amount;
        if (isToday) todayExpense += tx.amount;
      } else if (tx.type === 'INCOME') {
        netCashInDrawer += tx.amount;
        if (isToday) todayIncome += tx.amount;
      }
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      summary: {
        totalIceExpense,
        todayExpense,
        todayChangeFund,
        todayIncome,
        netCashInDrawer,
        latestFund,
      },
    });
  } catch (error: any) {
    console.error('Error fetching cash transactions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, category, amount, note, recordedBy } = body;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ success: false, error: 'จำนวนเงินต้องมากกว่า 0' }, { status: 400 });
    }

    if (!category || category.trim() === '') {
      return NextResponse.json({ success: false, error: 'กรุณาระบุหมวดหมู่' }, { status: 400 });
    }

    const tx = await prisma.cashTransaction.create({
      data: {
        type: type || 'EXPENSE',
        category: category.trim(),
        amount: amt,
        note: note ? note.trim() : null,
        recordedBy: recordedBy || 'Staff',
      },
    });

    return NextResponse.json({ success: true, data: tx });
  } catch (error: any) {
    console.error('Error creating cash transaction:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
