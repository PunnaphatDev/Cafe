import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, action, changeQuantity, reason, userEmail } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุรหัสสินค้า' }, { status: 400 });
    }

    const qty = parseInt(changeQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ success: false, error: 'จำนวนต้องมากกว่า 0' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    let newQuantity = product.quantity;
    if (action === 'IN') {
      newQuantity += qty;
    } else if (action === 'OUT') {
      if (product.quantity < qty) {
        return NextResponse.json(
          { success: false, error: `สต็อกคงเหลือไม่พอ (มี ${product.quantity} ${product.unit})` },
          { status: 400 }
        );
      }
      newQuantity -= qty;
    } else if (action === 'ADJUST') {
      newQuantity = qty;
    } else {
      return NextResponse.json({ success: false, error: 'ประเภทการปรับสต็อกไม่ถูกต้อง' }, { status: 400 });
    }

    // Execute in transaction
    const [updatedProduct, log] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { quantity: newQuantity },
      }),
      prisma.stockLog.create({
        data: {
          productId: product.id,
          productName: product.name,
          action,
          oldQuantity: product.quantity,
          changeQuantity: action === 'ADJUST' ? Math.abs(newQuantity - product.quantity) : qty,
          newQuantity,
          reason: reason || (action === 'IN' ? 'รับเข้าสต็อก' : 'เบิกใช้สต็อก'),
          userEmail: userEmail || 'Staff',
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: { product: updatedProduct, log } });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
