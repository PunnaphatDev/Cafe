import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, quantity, minStock, unit } = body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category }),
        ...(quantity !== undefined && { quantity: parseInt(quantity, 10) }),
        ...(minStock !== undefined && { minStock: parseInt(minStock, 10) }),
        ...(unit && { unit }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Soft delete
    const deleted = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
