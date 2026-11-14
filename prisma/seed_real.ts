import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realProducts = [
  // • น้ำ 🧋
  { name: 'ชาใต้ 75%', category: 'น้ำ', quantity: 0, minStock: 2, unit: 'ส่วน' },
  { name: 'ชาใต้ 50%', category: 'น้ำ', quantity: 2, minStock: 3, unit: 'ส่วน' },
  { name: 'เบสปั่น', category: 'น้ำ', quantity: 1, minStock: 2, unit: 'ส่วน' },
  { name: 'ชาเขียว', category: 'น้ำ', quantity: 2, minStock: 1, unit: 'ส่วน' },
  { name: 'ดาร์กโกโก้', category: 'น้ำ', quantity: 3, minStock: 1, unit: 'ส่วน' },

  // • นม 🥛
  { name: 'นมกระป๋อง', category: 'นม', quantity: 0, minStock: 6, unit: 'กระป๋อง' },
  { name: 'นมจืดกล่องใหญ่', category: 'นม', quantity: 0, minStock: 4, unit: 'กล่อง' },

  // • ท็อปปิ้ง 🧂
  { name: 'วิปครีม', category: 'ท็อปปิ้ง', quantity: 5, minStock: 2, unit: 'ขวด' },
  { name: 'ครีมชีส', category: 'ท็อปปิ้ง', quantity: 0, minStock: 2, unit: 'กล่อง' },
  { name: 'ชีสก้อน', category: 'ท็อปปิ้ง', quantity: 1, minStock: 2, unit: 'ก้อน' },

  // • แก้ว 🥤
  { name: 'แก้วธนา', category: 'แก้ว', quantity: 4, minStock: 20, unit: 'แก้ว' },
  { name: 'แก้วโลโก้ชาใต้นายเอ้', category: 'แก้ว', quantity: 11, minStock: 30, unit: 'แก้ว' },
  { name: 'แก้วใส', category: 'แก้ว', quantity: 100, minStock: 30, unit: 'แก้ว' },
  { name: 'แก้วปั่น', category: 'แก้ว', quantity: 78, minStock: 30, unit: 'แก้ว' },

  // • ฝาปิด ⚪️
  { name: 'ฝาธรรมดา (ขนาด 95)', category: 'ฝาปิด', quantity: 134, minStock: 50, unit: 'ฝา' },
  { name: 'ฝาปั่น (ขนาด 98)', category: 'ฝาปิด', quantity: 80, minStock: 50, unit: 'ฝา' },
  { name: 'ฝากลม (ขนาด 95)', category: 'ฝาปิด', quantity: 100, minStock: 50, unit: 'ฝา' },
  { name: 'ฝา half (ครึ่งฝา)', category: 'ฝาปิด', quantity: 19, minStock: 30, unit: 'ฝา' },

  // • เซ็ตพร้อมดื่ม 🫙
  { name: 'ขวดพร้อมดื่ม', category: 'เซ็ตพร้อมดื่ม', quantity: 100, minStock: 30, unit: 'ขวด' },
  { name: 'ฝาขวดพร้อมดื่ม', category: 'เซ็ตพร้อมดื่ม', quantity: 100, minStock: 30, unit: 'ฝา' },

  // • หลอด 🔹️
  { name: 'หลอดปั่น', category: 'หลอด', quantity: 100, minStock: 30, unit: 'อัน' },
  { name: 'หลอดธรรมดา (สีขาว)', category: 'หลอด', quantity: 29, minStock: 50, unit: 'อัน' },
  { name: 'หลอดธรรมดา (สีดำ)', category: 'หลอด', quantity: 3, minStock: 1, unit: 'แพ็ค' },

  // • ถุงใส่แก้ว 🫧
  { name: 'ถุงพลาสติกใส 1 แก้ว', category: 'ถุงใส่แก้ว', quantity: 5, minStock: 2, unit: 'แพ็ค' },
  { name: 'ถุงพลาสติกใส 2 แก้ว', category: 'ถุงใส่แก้ว', quantity: 32, minStock: 50, unit: 'ใบ' },
  { name: 'ถุงชาใต้นายเอ้ 1 แก้ว', category: 'ถุงใส่แก้ว', quantity: 14, minStock: 50, unit: 'ถุง' },
  { name: 'ถุงชาใต้นายเอ้ 2 แก้ว', category: 'ถุงใส่แก้ว', quantity: 46, minStock: 30, unit: 'ถุง' },

  // • ไซรัป 🫗
  { name: 'ไซรัปส้ม', category: 'ไซรัป', quantity: 1, minStock: 1, unit: 'ขวด' },
  { name: 'ไซรัปบลูฮาวาย', category: 'ไซรัป', quantity: 1, minStock: 1, unit: 'ขวด' },
  { name: 'ไซรัปสตอเบอร์รี่', category: 'ไซรัป', quantity: 1, minStock: 1, unit: 'ขวด' },
  { name: 'ไซรัปลิ้นจี่', category: 'ไซรัป', quantity: 1, minStock: 1, unit: 'ขวด' },
  { name: 'ไซรัปแอปเปิ้ลเขียว', category: 'ไซรัป', quantity: 1, minStock: 1, unit: 'ขวด' },

  // • เมนูเพิ่มเติม 🍾
  { name: 'โซดา', category: 'เมนูเพิ่มเติม', quantity: 5, minStock: 3, unit: 'ขวด' },
  { name: 'M150', category: 'เมนูเพิ่มเติม', quantity: 2, minStock: 5, unit: 'ขวด' },
  { name: 'ปีโป้', category: 'เมนูเพิ่มเติม', quantity: 2, minStock: 10, unit: 'อัน' },

  // • เครื่องดื่มในตู้ 🍷
  { name: 'เป๊ปซี่ (16/แพ็ค, หมดอายุ ธ.ค.)', category: 'เครื่องดื่มในตู้', quantity: 3, minStock: 1, unit: 'แพ็ค' },
  { name: 'น้ำเปล่าขวด', category: 'เครื่องดื่มในตู้', quantity: 0, minStock: 10, unit: 'ขวด' },
  { name: 'มิรินด้า (ทุกรสชาติ)', category: 'เครื่องดื่มในตู้', quantity: 0, minStock: 6, unit: 'ขวด' },
  { name: '7 UP', category: 'เครื่องดื่มในตู้', quantity: 0, minStock: 6, unit: 'ขวด' },
  { name: 'ลิปตัน', category: 'เครื่องดื่มในตู้', quantity: 0, minStock: 6, unit: 'ขวด' },

  // • อุปกรณ์ ⚒️
  { name: 'ถุงมือพลาสติก', category: 'อุปกรณ์', quantity: 12, minStock: 20, unit: 'แผ่น' },
  { name: 'ที่รองแก้วแบบกระดาษ', category: 'อุปกรณ์', quantity: 92, minStock: 30, unit: 'แผ่น' },
  { name: 'กระดาษแยกน้ำแข็ง', category: 'อุปกรณ์', quantity: 1, minStock: 1, unit: 'แพ็ค' },
  { name: 'กล่องเล็กใส่ท็อปปิ้ง', category: 'อุปกรณ์', quantity: 0, minStock: 20, unit: 'กล่อง' },
  { name: 'ฝากล่องเล็ก', category: 'อุปกรณ์', quantity: 0, minStock: 20, unit: 'ฝา' },
  { name: 'น้ำแข็งหลอด', category: 'อุปกรณ์', quantity: 1, minStock: 1, unit: 'กระสอบ' },
];

async function main() {
  console.log('🔄 Cleaning old dummy products...');
  await prisma.stockLog.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('📦 Inserting 46 real products of AUSTIN Cat Cafe...');
  for (const item of realProducts) {
    const created = await prisma.product.create({
      data: {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        minStock: item.minStock,
        unit: item.unit,
      },
    });

    await prisma.stockLog.create({
      data: {
        productId: created.id,
        productName: created.name,
        action: 'INITIAL',
        oldQuantity: 0,
        changeQuantity: created.quantity,
        newQuantity: created.quantity,
        reason: 'อัปเดตสต็อกจริง 14/11/26',
        userEmail: 'Austin Staff',
      },
    });
  }

  console.log('💰 Setting up actual cash & expense balance for today (14/11/26)...');
  // Clear previous sample cash data
  await prisma.cashTransaction.deleteMany({});
  await prisma.dailyReset.deleteMany({});

  // 1. เงินตั้งต้นในเคาน์เตอร์: 342.00 บาท
  // 2. รายจ่ายวันนี้: 71.50 บาท (ถุงขยะ 60 + ฟองน้ำ 11.50)
  // ผลลัพธ์: เงินคงเหลือในเคาน์เตอร์ = 270.50 บาทถ้วน ตามที่ผู้ใช้แจ้ง!
  await prisma.cashTransaction.create({
    data: {
      type: 'CHANGE_FUND',
      category: 'เติมเงินเคาน์เตอร์',
      amount: 342.00,
      note: 'เงินตั้งต้นเคาน์เตอร์รอบปัจจุบัน',
      recordedBy: 'หน้าร้าน',
    },
  });

  await prisma.cashTransaction.create({
    data: {
      type: 'EXPENSE',
      category: 'ของใช้และอุปกรณ์',
      amount: 60.00,
      note: 'ถุงขยะไซส์ใหญ่',
      recordedBy: 'หน้าร้าน',
    },
  });

  await prisma.cashTransaction.create({
    data: {
      type: 'EXPENSE',
      category: 'ของใช้และอุปกรณ์',
      amount: 11.50,
      note: 'ฟองน้ำล้างอุปกรณ์ใหม่',
      recordedBy: 'หน้าร้าน',
    },
  });

  console.log('✅ Real data successfully loaded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
