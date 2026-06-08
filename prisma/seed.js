const { PrismaClient, ProductLabel, UserRole, OrderStatus, PaymentStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const categories = [
  { name: "Pashmina", slug: "pashmina", description: "Hijab panjang flowy untuk gaya harian dan formal." },
  { name: "Segi Empat", slug: "segi-empat", description: "Hijab square klasik dengan pilihan bahan premium." },
  { name: "Hijab Instan", slug: "hijab-instan", description: "Praktis, rapi, dan nyaman dipakai sepanjang hari." },
  { name: "Bergo", slug: "bergo", description: "Hijab santai untuk daily wear dan travel." },
  { name: "Ciput & Inner", slug: "ciput-inner", description: "Inner hijab anti licin dan breathable." },
  { name: "Aksesoris", slug: "aksesoris", description: "Pelengkap styling hijab yang minimal dan elegan." },
];

const products = [
  {
    name: "Zimeira Pashmina Voal Rose",
    slug: "zimeira-pashmina-voal-rose",
    category: "pashmina",
    normalPrice: 129000,
    discountPrice: 99000,
    labels: [ProductLabel.NEW_ARRIVAL, ProductLabel.DISCOUNT],
    image: "/images/products/pashmina-rose.svg",
    variants: [
      { color: "Dusty Rose", colorHex: "#c9969a", material: "Premium Voal", stock: 24, sku: "ZIM-PAS-ROS-VOAL" },
      { color: "Mauve Taupe", colorHex: "#a57b7f", material: "Premium Voal", stock: 18, sku: "ZIM-PAS-MAU-VOAL" },
    ],
  },
  {
    name: "Zimeira Square Silk Cream",
    slug: "zimeira-square-silk-cream",
    category: "segi-empat",
    normalPrice: 149000,
    discountPrice: null,
    labels: [ProductLabel.BEST_SELLER],
    image: "/images/products/square-cream.svg",
    variants: [
      { color: "Warm Cream", colorHex: "#efe2cf", material: "Silk Satin", stock: 14, sku: "ZIM-SQR-CRE-SILK" },
      { color: "Soft Gold", colorHex: "#d2b36f", material: "Silk Satin", stock: 9, sku: "ZIM-SQR-GOL-SILK" },
    ],
  },
  {
    name: "Zimeira Instant Daily Black",
    slug: "zimeira-instant-daily-black",
    category: "hijab-instan",
    normalPrice: 89000,
    discountPrice: 79000,
    labels: [ProductLabel.DISCOUNT],
    image: "/images/products/instant-black.svg",
    variants: [
      { color: "Soft Black", colorHex: "#282522", material: "Jersey Premium", stock: 31, sku: "ZIM-INS-BLK-JER" },
      { color: "Cocoa", colorHex: "#6f5750", material: "Jersey Premium", stock: 20, sku: "ZIM-INS-COC-JER" },
    ],
  },
  {
    name: "Zimeira Bergo Travel Sage",
    slug: "zimeira-bergo-travel-sage",
    category: "bergo",
    normalPrice: 99000,
    discountPrice: null,
    labels: [ProductLabel.NEW_ARRIVAL],
    image: "/images/products/bergo-sage.svg",
    variants: [
      { color: "Sage", colorHex: "#aeb8a2", material: "Airy Jersey", stock: 22, sku: "ZIM-BER-SAG-JER" },
      { color: "Cream", colorHex: "#eadfcd", material: "Airy Jersey", stock: 13, sku: "ZIM-BER-CRE-JER" },
    ],
  },
  {
    name: "Inner Ninja Soft Cotton",
    slug: "inner-ninja-soft-cotton",
    category: "ciput-inner",
    normalPrice: 59000,
    discountPrice: 49000,
    labels: [ProductLabel.BEST_SELLER, ProductLabel.DISCOUNT],
    image: "/images/products/inner-cotton.svg",
    variants: [
      { color: "Ivory", colorHex: "#f2eadf", material: "Cotton Stretch", stock: 40, sku: "ZIM-INN-IVY-COT" },
      { color: "Black", colorHex: "#22201d", material: "Cotton Stretch", stock: 35, sku: "ZIM-INN-BLK-COT" },
    ],
  },
  {
    name: "Magnet Hijab Gold Set",
    slug: "magnet-hijab-gold-set",
    category: "aksesoris",
    normalPrice: 39000,
    discountPrice: null,
    labels: [ProductLabel.NEW_ARRIVAL],
    image: "/images/products/magnet-gold.svg",
    variants: [
      { color: "Gold", colorHex: "#caa85a", material: "Metal Alloy", stock: 55, sku: "ZIM-ACC-GOL-MAG" },
      { color: "Rose Gold", colorHex: "#c99387", material: "Metal Alloy", stock: 44, sku: "ZIM-ACC-ROG-MAG" },
    ],
  },
];

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "admin@zimeirahijab.test" },
    update: { name: "Admin Zimeira", password, role: UserRole.ADMIN },
    create: { name: "Admin Zimeira", email: "admin@zimeirahijab.test", password, role: UserRole.ADMIN },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@zimeirahijab.test" },
    update: { name: "Nadia Zimeira", password, phone: "081234567890", role: UserRole.CUSTOMER },
    create: { name: "Nadia Zimeira", email: "customer@zimeirahijab.test", password, phone: "081234567890" },
  });

  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  for (const item of products) {
    const category = await prisma.productCategory.findUniqueOrThrow({ where: { slug: item.category } });
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        normalPrice: item.normalPrice,
        discountPrice: item.discountPrice,
        labels: item.labels,
        categoryId: category.id,
        description: "Dummy product untuk demo Zimeira Hijab Store. Deskripsi ini dapat diganti dari admin panel pada tahap CRUD berikutnya.",
      },
      create: {
        name: item.name,
        slug: item.slug,
        normalPrice: item.normalPrice,
        discountPrice: item.discountPrice,
        labels: item.labels,
        categoryId: category.id,
        description: "Dummy product untuk demo Zimeira Hijab Store. Deskripsi ini dapat diganti dari admin panel pada tahap CRUD berikutnya.",
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: { productId: product.id, url: item.image, alt: item.name },
    });

    for (const variant of item.variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: { ...variant, productId: product.id },
        create: { ...variant, productId: product.id },
      });
    }
  }

  await prisma.shippingAddress.deleteMany({ where: { userId: customer.id, label: "Rumah" } });
  await prisma.shippingAddress.create({
    data: {
      userId: customer.id,
      label: "Rumah",
      recipient: "Nadia Zimeira",
      phone: "081234567890",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      district: "Kebayoran Baru",
      postalCode: "12110",
      addressLine: "Jl. Melati No. 10",
      isDefault: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "ZIMEIRA10" },
    update: {},
    create: { code: "ZIMEIRA10", description: "Diskon pembukaan toko demo", discountPercent: 10, minPurchase: 100000, quota: 100 },
  });

  await prisma.banner.deleteMany({ where: { title: "New modest essentials" } });
  await prisma.banner.create({
    data: {
      title: "New modest essentials",
      subtitle: "Koleksi hijab lembut untuk aktivitas harian.",
      imageUrl: "/images/products/pashmina-rose.svg",
      ctaLabel: "Belanja koleksi",
      ctaHref: "/produk",
    },
  });

  await prisma.storeSetting.upsert({
    where: { id: "store-setting" },
    update: {},
    create: {
      id: "store-setting",
      storeName: "Zimeira Hijab Store",
      email: "hello@zimeirahijab.test",
      phone: "0812-0000-2026",
      address: "Pagar Alam, South Sumatra, Indonesia",
      instagram: "@zimeirahijab.demo",
      whatsapp: "081200002026",
    },
  });

  const sampleProduct = await prisma.product.findUniqueOrThrow({ where: { slug: "zimeira-pashmina-voal-rose" } });
  await prisma.order.upsert({
    where: { orderNumber: "ZMS-2026-0001" },
    update: {},
    create: {
      orderNumber: "ZMS-2026-0001",
      userId: customer.id,
      status: OrderStatus.PROCESSING,
      subtotal: 99000,
      shippingCost: 15000,
      shippingProvider: "Zimeira Delivery",
      shippingService: "Regular",
      shippingEstimate: "2-4 hari",
      grandTotal: 114000,
      customerName: "Nadia Zimeira",
      customerEmail: "customer@zimeirahijab.test",
      customerPhone: "081234567890",
      items: {
        create: [{ productId: sampleProduct.id, productName: sampleProduct.name, quantity: 1, price: 99000 }],
      },
      payment: {
        create: {
          amount: 114000,
          status: PaymentStatus.PAID,
          method: "Manual Transfer",
          transactionId: "MANUAL-ZMS-2026-0001",
          instructions: "Transfer ke rekening demo BSI 700-123-4567 a.n. Zimeira Hijab Store.",
        },
      },
    },
  });

  console.log("Seed data Zimeira Hijab Store selesai.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
