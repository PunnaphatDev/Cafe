import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';

    const showAll = searchParams.get('includeClosed') === 'true';
    const where: any = { isActive: true };

    if (!showAll) {
      where.isClosed = false;
    }

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

    // Calculate Summary with Database-Level Aggregations (high-performance for large datasets)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [todayReset, totalsByType, todayExpenseAgg, todayChangeFundAgg, latestFund, totalIceExpenseAgg] = await Promise.all([
      // Check if today was reset
      prisma.dailyReset.findFirst({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
        },
        orderBy: { date: 'desc' },
      }),
      // Sum all active transactions grouped by type (O(1) database aggregation)
      prisma.cashTransaction.groupBy({
        by: ['type'],
        where: { isActive: true },
        _sum: { amount: true },
      }),
      // Today unclosed expense
      prisma.cashTransaction.aggregate({
        where: {
          type: 'EXPENSE',
          isActive: true,
          isClosed: false,
          date: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { amount: true },
      }),
      // Today change fund
      prisma.cashTransaction.aggregate({
        where: {
          type: 'CHANGE_FUND',
          isActive: true,
          date: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { amount: true },
      }),
      // Latest change fund
      prisma.cashTransaction.findFirst({
        where: { type: 'CHANGE_FUND', isActive: true },
        orderBy: { date: 'desc' },
        select: { amount: true, date: true, note: true },
      }),
      // Total ice expense
      prisma.cashTransaction.aggregate({
        where: {
          type: 'EXPENSE',
          isActive: true,
          category: { contains: 'น้ำแข็ง' },
        },
        _sum: { amount: true },
      }),
    ]);

    let netCashInDrawer = 0;
    for (const group of totalsByType) {
      const sum = group._sum.amount || 0;
      if (group.type === 'CHANGE_FUND' || group.type === 'INCOME') {
        netCashInDrawer += sum;
      } else if (group.type === 'EXPENSE') {
        netCashInDrawer -= sum;
      }
    }

    const todayExpense = todayExpenseAgg._sum.amount || 0;
    const todayChangeFund = todayChangeFundAgg._sum.amount || 0;
    const totalIceExpense = totalIceExpenseAgg._sum.amount || 0;

    return NextResponse.json({
      success: true,
      data: transactions,
      summary: {
        totalIceExpense,
        todayExpense,
        todayChangeFund,
        todayIncome: 0,
        netCashInDrawer,
        latestFund,
        alreadyResetToday: !!todayReset,
        todayResetInfo: todayReset
          ? {
              totalAmount: todayReset.totalAmount,
              itemCount: todayReset.itemCount,
              date: todayReset.date,
            }
          : null,
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
