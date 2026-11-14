import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayReset = await prisma.dailyReset.findFirst({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { date: 'desc' },
    });

    const activeTodayExpenses = await prisma.cashTransaction.findMany({
      where: {
        type: 'EXPENSE',
        isActive: true,
        isClosed: false,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const totalActiveAmount = activeTodayExpenses.reduce((sum, item) => sum + item.amount, 0);

    return NextResponse.json({
      success: true,
      alreadyResetToday: !!todayReset,
      lastReset: todayReset,
      todayActiveExpense: totalActiveAmount,
      todayActiveCount: activeTodayExpenses.length,
    });
  } catch (error: any) {
    console.error('Error checking daily reset status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // ตรวจสอบว่าวันนี้รีเซ็ทไปแล้วหรือไม่ (กดได้วันละ 1 ครั้ง)
    const existingReset = await prisma.dailyReset.findFirst({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    if (existingReset) {
      return NextResponse.json(
        {
          success: false,
          error: 'วันนี้ได้ทำการรีเซ็ทรายจ่ายไปแล้ว สามารถรีเซ็ทได้วันละ 1 ครั้งเท่านั้น',
        },
        { status: 400 }
      );
    }

    // ดึงรายการรายจ่ายที่ยังไม่ปิดรอบของวันนี้ (หรือก่อนหน้าของรอบนี้)
    const unclosedExpenses = await prisma.cashTransaction.findMany({
      where: {
        type: 'EXPENSE',
        isActive: true,
        isClosed: false,
        date: {
          lte: endOfToday,
        },
      },
    });

    const totalAmount = unclosedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const itemCount = unclosedExpenses.length;

    // ทำการปิดรอบและบันทึก DailyReset
    await prisma.$transaction([
      // 1. มาร์ครายการรายจ่ายเป็น isClosed: true เพื่อไม่ให้รกหน้าจอ
      prisma.cashTransaction.updateMany({
        where: {
          id: { in: unclosedExpenses.map((t) => t.id) },
        },
        data: {
          isClosed: true,
        },
      }),
      // 2. สร้างบันทึกประวัติการรีเซ็ทประจำวัน
      prisma.dailyReset.create({
        data: {
          date: new Date(),
          totalAmount,
          itemCount,
          note: `รีเซ็ทรายจ่ายประจำวัน ${itemCount} รายการ`,
          resetBy: 'หน้าร้าน',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'รีเซ็ทรายจ่ายประจำวันเรียบร้อยแล้ว',
      totalAmount,
      itemCount,
    });
  } catch (error: any) {
    console.error('Error executing daily reset:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
