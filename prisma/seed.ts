import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// รูปสินค้าใช้ picsum.photos แบบ seed คงที่ (เหมือนฝั่ง frontend)
const img = (seed: string, n = 1) =>
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/600/600`);

const categories = [
  { id: 'c-electronics', name: 'อิเล็กทรอนิกส์', slug: 'electronics', icon: '📱' },
  { id: 'c-fashion', name: 'แฟชั่น', slug: 'fashion', icon: '👕' },
  { id: 'c-home', name: 'บ้านและครัว', slug: 'home', icon: '🏠' },
  { id: 'c-beauty', name: 'ความงาม', slug: 'beauty', icon: '💄' },
  { id: 'c-sports', name: 'กีฬาและกลางแจ้ง', slug: 'sports', icon: '⚽' },
  { id: 'c-toys', name: 'ของเล่นและงานอดิเรก', slug: 'toys', icon: '🎮' },
];

interface SeedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  categoryId: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  brand: string;
  tags: string[];
  createdAt: string;
}

const products: SeedProduct[] = [
  { id: 'p-1001', name: 'หูฟังไร้สาย Yamal Buds Pro', slug: 'yamal-buds-pro', description: 'หูฟัง True Wireless ตัดเสียงรบกวน (ANC) แบตอึด 30 ชม. กันน้ำ IPX5 เชื่อมต่อ Bluetooth 5.3 เสียงคมชัดทุกย่าน', price: 2990, salePrice: 1990, categoryId: 'c-electronics', images: img('buds', 3), rating: 4.7, reviewCount: 328, stock: 45, brand: 'Yamal', tags: ['หูฟัง', 'บลูทูธ', 'ตัดเสียงรบกวน'], createdAt: '2026-06-01' },
  { id: 'p-1002', name: 'สมาร์ทวอทช์ Yamal Watch S2', slug: 'yamal-watch-s2', description: 'นาฬิกาอัจฉริยะ จอ AMOLED วัดหัวใจ/ออกซิเจนในเลือด กันน้ำ 50 เมตร แจ้งเตือนจากมือถือ', price: 3490, categoryId: 'c-electronics', images: img('watch', 3), rating: 4.5, reviewCount: 190, stock: 30, brand: 'Yamal', tags: ['นาฬิกา', 'สุขภาพ', 'กันน้ำ'], createdAt: '2026-05-20' },
  { id: 'p-1003', name: 'ลำโพงบลูทูธพกพา SoundBox Mini', slug: 'soundbox-mini', description: 'ลำโพงพกพาเสียงเบสแน่น กันน้ำ IPX7 แบต 12 ชม. จับคู่ TWS สองตัวได้ พกพาสะดวก', price: 1290, salePrice: 990, categoryId: 'c-electronics', images: img('speaker', 2), rating: 4.4, reviewCount: 145, stock: 60, brand: 'SoundBox', tags: ['ลำโพง', 'พกพา', 'กันน้ำ'], createdAt: '2026-04-15' },
  { id: 'p-1004', name: 'พาวเวอร์แบงค์ 20000mAh ชาร์จเร็ว', slug: 'powerbank-20000', description: 'แบตสำรองความจุ 20000mAh รองรับ PD 22.5W ชาร์จเร็ว มี USB-C 2 พอร์ต จอแสดงเปอร์เซ็นต์แบต', price: 890, categoryId: 'c-electronics', images: img('powerbank', 2), rating: 4.6, reviewCount: 412, stock: 120, brand: 'Yamal', tags: ['แบตสำรอง', 'ชาร์จเร็ว'], createdAt: '2026-03-10' },
  { id: 'p-2001', name: 'เสื้อยืดคอตตอน 100% Oversize', slug: 'cotton-tee-oversize', description: 'เสื้อยืดผ้าคอตตอนแท้ ทรง Oversize ใส่สบาย ระบายอากาศดี มีให้เลือกหลายสี', price: 390, salePrice: 290, categoryId: 'c-fashion', images: img('tee', 3), rating: 4.3, reviewCount: 256, stock: 200, brand: 'Basics', tags: ['เสื้อยืด', 'คอตตอน', 'ยูนิเซ็กซ์'], createdAt: '2026-06-18' },
  { id: 'p-2002', name: 'กระเป๋าสะพายข้าง Canvas', slug: 'canvas-crossbody-bag', description: 'กระเป๋าผ้าแคนวาสหนา ทนทาน ช่องเยอะ สายปรับระดับได้ ดีไซน์มินิมอล', price: 650, categoryId: 'c-fashion', images: img('bag', 2), rating: 4.5, reviewCount: 98, stock: 75, brand: 'Urban', tags: ['กระเป๋า', 'แคนวาส'], createdAt: '2026-05-05' },
  { id: 'p-2003', name: 'รองเท้าผ้าใบ Daily Sneaker', slug: 'daily-sneaker', description: 'รองเท้าผ้าใบใส่ได้ทุกวัน พื้นนุ่ม เบา ระบายอากาศดี แมตช์ง่ายกับทุกชุด', price: 1290, salePrice: 990, categoryId: 'c-fashion', images: img('sneaker', 3), rating: 4.6, reviewCount: 320, stock: 90, brand: 'Urban', tags: ['รองเท้า', 'ผ้าใบ'], createdAt: '2026-04-28' },
  { id: 'p-2004', name: 'หมวกแก๊ป Classic Cap', slug: 'classic-cap', description: 'หมวกแก๊ปทรงคลาสสิก ปรับขนาดได้ ผ้าคุณภาพดี กันแดดได้ดี', price: 350, categoryId: 'c-fashion', images: img('cap', 2), rating: 4.2, reviewCount: 64, stock: 150, brand: 'Basics', tags: ['หมวก', 'กันแดด'], createdAt: '2026-03-22' },
  { id: 'p-3001', name: 'กระติกน้ำสุญญากาศ Keep Cold 750ml', slug: 'vacuum-flask-750', description: 'กระติกน้ำสแตนเลส เก็บความเย็น 24 ชม. เก็บความร้อน 12 ชม. ฝาเกลียวกันรั่ว', price: 590, salePrice: 450, categoryId: 'c-home', images: img('flask', 2), rating: 4.7, reviewCount: 210, stock: 110, brand: 'KeepIt', tags: ['กระติกน้ำ', 'สแตนเลส'], createdAt: '2026-06-02' },
  { id: 'p-3002', name: 'ชุดมีดทำครัว 6 ชิ้น พร้อมแท่นวาง', slug: 'knife-set-6', description: 'ชุดมีดสแตนเลสคุณภาพสูง 6 ชิ้น คมทน ด้ามจับถนัดมือ พร้อมแท่นไม้วาง', price: 1490, categoryId: 'c-home', images: img('knife', 2), rating: 4.4, reviewCount: 87, stock: 40, brand: 'ChefPro', tags: ['มีด', 'ทำครัว'], createdAt: '2026-05-11' },
  { id: 'p-3003', name: 'โคมไฟตั้งโต๊ะ LED ปรับแสงได้', slug: 'led-desk-lamp', description: 'โคมไฟตั้งโต๊ะถนอมสายตา ปรับความสว่าง 3 ระดับ พับได้ มีพอร์ต USB ชาร์จมือถือในตัว', price: 790, salePrice: 590, categoryId: 'c-home', images: img('lamp', 2), rating: 4.5, reviewCount: 133, stock: 55, brand: 'BrightHome', tags: ['โคมไฟ', 'LED', 'ถนอมสายตา'], createdAt: '2026-04-08' },
  { id: 'p-4001', name: 'เซรั่มวิตามินซี Brightening Serum', slug: 'vitc-serum', description: 'เซรั่มวิตามินซีเข้มข้น ช่วยให้ผิวกระจ่างใส ลดเลือนจุดด่างดำ บำรุงผิวหน้า', price: 690, salePrice: 490, categoryId: 'c-beauty', images: img('serum', 2), rating: 4.6, reviewCount: 402, stock: 80, brand: 'GlowLab', tags: ['เซรั่ม', 'วิตามินซี', 'บำรุงผิว'], createdAt: '2026-06-20' },
  { id: 'p-4002', name: 'ลิปบาล์มบำรุงริมฝีปาก', slug: 'lip-balm', description: 'ลิปบาล์มเนื้อบางเบา ให้ความชุ่มชื้น ริมฝีปากนุ่มไม่แห้งแตก กลิ่นหอมอ่อน ๆ', price: 190, categoryId: 'c-beauty', images: img('lipbalm', 2), rating: 4.3, reviewCount: 176, stock: 220, brand: 'GlowLab', tags: ['ลิป', 'บำรุงปาก'], createdAt: '2026-05-30' },
  { id: 'p-4003', name: 'แปรงแต่งหน้า เซ็ต 10 ชิ้น', slug: 'makeup-brush-set', description: 'ชุดแปรงแต่งหน้าขนนุ่ม 10 ชิ้น ครบทุกการใช้งาน พร้อมกระเป๋าจัดเก็บ', price: 550, salePrice: 420, categoryId: 'c-beauty', images: img('brush', 2), rating: 4.4, reviewCount: 91, stock: 65, brand: 'GlowLab', tags: ['แปรง', 'แต่งหน้า'], createdAt: '2026-04-19' },
  { id: 'p-5001', name: 'เสื่อโยคะ TPU กันลื่น 6mm', slug: 'yoga-mat-6mm', description: 'เสื่อโยคะวัสดุ TPU หนา 6 มม. กันลื่นทั้งสองด้าน รองรับแรงกระแทกดี พกพาง่าย', price: 690, salePrice: 520, categoryId: 'c-sports', images: img('yoga', 2), rating: 4.6, reviewCount: 145, stock: 70, brand: 'FitLife', tags: ['โยคะ', 'ออกกำลังกาย'], createdAt: '2026-06-09' },
  { id: 'p-5002', name: 'ดัมเบลปรับน้ำหนักได้ 2-24kg', slug: 'adjustable-dumbbell', description: 'ดัมเบลปรับน้ำหนักได้ 2-24 กก. ประหยัดพื้นที่ ปรับง่ายด้วยหมุนหัวล็อก', price: 2890, categoryId: 'c-sports', images: img('dumbbell', 2), rating: 4.7, reviewCount: 78, stock: 25, brand: 'FitLife', tags: ['ดัมเบล', 'ฟิตเนส'], createdAt: '2026-05-15' },
  { id: 'p-5003', name: 'ขวดน้ำนักกีฬา 1 ลิตร', slug: 'sport-bottle-1l', description: 'ขวดน้ำสำหรับออกกำลังกาย ความจุ 1 ลิตร ปลอด BPA มีมาตรวัดปริมาณน้ำ', price: 250, salePrice: 190, categoryId: 'c-sports', images: img('bottle', 2), rating: 4.2, reviewCount: 54, stock: 180, brand: 'FitLife', tags: ['ขวดน้ำ', 'กีฬา'], createdAt: '2026-04-02' },
  { id: 'p-6001', name: 'ชุดตัวต่อบล็อก Creative 500 ชิ้น', slug: 'building-blocks-500', description: 'ชุดตัวต่อบล็อก 500 ชิ้น เสริมพัฒนาการและความคิดสร้างสรรค์ วัสดุปลอดภัย', price: 790, salePrice: 590, categoryId: 'c-toys', images: img('blocks', 2), rating: 4.8, reviewCount: 220, stock: 95, brand: 'PlayJoy', tags: ['ตัวต่อ', 'ของเล่นเด็ก'], createdAt: '2026-06-25' },
  { id: 'p-6002', name: 'จิ๊กซอว์ 1000 ชิ้น ภาพวิว', slug: 'jigsaw-1000', description: 'จิ๊กซอว์ 1000 ชิ้น ภาพวิวสวยงาม ชิ้นส่วนตัดเข้ารูปแม่นยำ ผ่อนคลายและฝึกสมาธิ', price: 450, categoryId: 'c-toys', images: img('jigsaw', 2), rating: 4.5, reviewCount: 66, stock: 60, brand: 'PlayJoy', tags: ['จิ๊กซอว์', 'งานอดิเรก'], createdAt: '2026-05-01' },
  { id: 'p-6003', name: 'โดรนบังคับมีกล้อง Mini Drone', slug: 'mini-drone-camera', description: 'โดรนขนาดเล็กพร้อมกล้อง HD บินนิ่ง บังคับง่าย เหมาะสำหรับผู้เริ่มต้น', price: 1690, salePrice: 1290, categoryId: 'c-toys', images: img('drone', 2), rating: 4.3, reviewCount: 112, stock: 35, brand: 'SkyFly', tags: ['โดรน', 'กล้อง', 'บังคับ'], createdAt: '2026-04-12' },
];

async function main() {
  console.log('🌱 กำลัง seed ข้อมูล...');

  // หมวดหมู่
  for (const c of categories) {
    await prisma.category.upsert({ where: { id: c.id }, update: c, create: c });
  }
  console.log(`  ✓ หมวดหมู่ ${categories.length} รายการ`);

  // สินค้า
  for (const p of products) {
    const data = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      salePrice: p.salePrice ?? null,
      categoryId: p.categoryId,
      images: JSON.stringify(p.images),
      rating: p.rating,
      reviewCount: p.reviewCount,
      stock: p.stock,
      brand: p.brand,
      tags: JSON.stringify(p.tags),
      createdAt: new Date(p.createdAt),
    };
    await prisma.product.upsert({ where: { id: p.id }, update: data, create: data });
  }
  console.log(`  ✓ สินค้า ${products.length} รายการ`);

  // บัญชีแอดมิน
  const adminEmail = 'admin@yamal888.com';
  const adminHash = await bcrypt.hash('admin1234', 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'ผู้ดูแลระบบ',
      email: adminEmail,
      password: adminHash,
      role: 'admin',
    },
  });
  console.log(`  ✓ บัญชีแอดมิน (${adminEmail} / admin1234)`);

  console.log('✅ seed เสร็จสิ้น');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
