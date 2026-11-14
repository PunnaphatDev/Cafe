import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: any = { isActive: true };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category && category !== 'ทั้งหมด') {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, quantity, minStock, unit } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'กรุณาระบุชื่อสินค้า' }, { status: 400 });
    }

    const qty = parseInt(quantity, 10) || 0;
    const min = parseInt(minStock, 10) || 5;

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        category: category || 'ทั่วไป',
        quantity: qty,
        minStock: min,
        unit: unit || 'ชิ้น',
      },
    });

    // บันทึก Log เริ่มต้น
    await prisma.stockLog.create({
      data: {
        productId: product.id,
        productName: product.name,
        action: 'INITIAL',
        oldQuantity: 0,
        changeQuantity: qty,
        newQuantity: qty,
        reason: 'สร้างสินค้าใหม่',
        userEmail: 'Staff',
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
