import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Austin Cat Hotel & Cafe database...');

  // 1. Initial Products
  const products = [
    { name: 'เมล็ดกาแฟ House Blend (250g)', category: 'เมล็ดกาแฟ', quantity: 15, minStock: 5, unit: 'ถุง' },
    { name: 'เมล็ดกาแฟ Single Origin Ethiopia (250g)', category: 'เมล็ดกาแฟ', quantity: 4, minStock: 5, unit: 'ถุง' },
    { name: 'นมสดพาสเจอร์ไรส์ เมจิ (2L)', category: 'วัตถุดิบนม', quantity: 12, minStock: 4, unit: 'ขวด' },
    { name: 'นมข้าวโอ๊ต Oatly Barista (1L)', category: 'วัตถุดิบนม', quantity: 0, minStock: 3, unit: 'กล่อง' },
    { name: 'ผงชาเขียวมัทฉะ Uji (100g)', category: 'ชาและผงเครื่องดื่ม', quantity: 8, minStock: 3, unit: 'กระปุก' },
    { name: 'แก้วพลาสติกเย็น 16oz พร้อมฝา', category: 'บรรจุภัณฑ์', quantity: 500, minStock: 100, unit: 'ใบ' },
    { name: 'หลอดดูดน้ำรักษ์โลก PLA', category: 'บรรจุภัณฑ์', quantity: 2, minStock: 5, unit: 'แพ็ค' },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      const created = await prisma.product.create({ data: p });
      await prisma.stockLog.create({
        data: {
          productId: created.id,
          productName: created.name,
          action: 'INITIAL',
          oldQuantity: 0,
          changeQuantity: created.quantity,
          newQuantity: created.quantity,
          reason: 'ยอดยกมาเริ่มต้นระบบ',
        },
      });
    }
  }

  // 2. Initial Sample Cash Transactions
  const existingTx = await prisma.cashTransaction.count();
  if (existingTx === 0) {
    await prisma.cashTransaction.createMany({
      data: [
        {
          type: 'CHANGE_FUND',
          category: 'เงินทอนเปิดร้าน',
          amount: 2000,
          note: 'เงินทอนเปิดกะเช้า',
          recordedBy: 'Admin',
        },
        {
          type: 'EXPENSE',
          category: 'สั่งน้ำแข็ง',
          amount: 60,
          note: 'สั่งน้ำแข็งหลอดเล็ก 2 กระสอบ',
          recordedBy: 'Staff',
        },
        {
          type: 'INCOME',
          category: 'ยอดขายเงินสด',
          amount: 1450,
          note: 'รายรับเงินสดระหว่างวัน',
          recordedBy: 'Staff',
        },
      ],
    });
  }

  console.log('✅ Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
