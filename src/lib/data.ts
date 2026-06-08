export const categories = [
  { name: "Pashmina", slug: "pashmina", description: "Flowy, ringan, dan mudah dibentuk." },
  { name: "Segi Empat", slug: "segi-empat", description: "Square hijab klasik dengan bahan premium." },
  { name: "Hijab Instan", slug: "hijab-instan", description: "Praktis untuk rutinitas padat." },
  { name: "Bergo", slug: "bergo", description: "Daily wear yang adem dan effortless." },
  { name: "Ciput & Inner", slug: "ciput-inner", description: "Inner hijab anti licin." },
  { name: "Aksesoris", slug: "aksesoris", description: "Pin, magnet, dan pelengkap styling." },
];

export const products = [
  {
    id: "p1",
    name: "Zimeira Pashmina Voal Rose",
    slug: "zimeira-pashmina-voal-rose",
    category: "Pashmina",
    categorySlug: "pashmina",
    description:
      "Pashmina voal premium dengan handfeel lembut, ringan, dan mudah diatur untuk tampilan feminin sehari-hari.",
    normalPrice: 129000,
    discountPrice: 99000,
    image: "/images/products/pashmina-rose.svg",
    labels: ["new arrival", "diskon"],
    colors: ["Dusty Rose", "Mauve Taupe", "Blush"],
    materials: ["Premium Voal"],
    variants: [
      { color: "Dusty Rose", colorHex: "#c9969a", material: "Premium Voal", stock: 24, sku: "ZIM-PAS-ROS-VOAL" },
      { color: "Mauve Taupe", colorHex: "#a57b7f", material: "Premium Voal", stock: 18, sku: "ZIM-PAS-MAU-VOAL" },
      { color: "Blush", colorHex: "#e4b8b0", material: "Premium Voal", stock: 12, sku: "ZIM-PAS-BLU-VOAL" },
    ],
  },
  {
    id: "p2",
    name: "Zimeira Square Silk Cream",
    slug: "zimeira-square-silk-cream",
    category: "Segi Empat",
    categorySlug: "segi-empat",
    description:
      "Hijab segi empat silk satin dengan kilau halus, cocok untuk acara spesial tanpa terasa berlebihan.",
    normalPrice: 149000,
    discountPrice: null,
    image: "/images/products/square-cream.svg",
    labels: ["best seller"],
    colors: ["Warm Cream", "Soft Gold", "Pearl"],
    materials: ["Silk Satin"],
    variants: [
      { color: "Warm Cream", colorHex: "#efe2cf", material: "Silk Satin", stock: 14, sku: "ZIM-SQR-CRE-SILK" },
      { color: "Soft Gold", colorHex: "#d2b36f", material: "Silk Satin", stock: 9, sku: "ZIM-SQR-GOL-SILK" },
      { color: "Pearl", colorHex: "#f7f2ea", material: "Silk Satin", stock: 17, sku: "ZIM-SQR-PEA-SILK" },
    ],
  },
  {
    id: "p3",
    name: "Zimeira Instant Daily Black",
    slug: "zimeira-instant-daily-black",
    category: "Hijab Instan",
    categorySlug: "hijab-instan",
    description:
      "Hijab instan jersey premium dengan potongan rapi, nyaman untuk kerja, kuliah, dan kegiatan aktif.",
    normalPrice: 89000,
    discountPrice: 79000,
    image: "/images/products/instant-black.svg",
    labels: ["diskon"],
    colors: ["Soft Black", "Cocoa", "Latte"],
    materials: ["Jersey Premium"],
    variants: [
      { color: "Soft Black", colorHex: "#282522", material: "Jersey Premium", stock: 31, sku: "ZIM-INS-BLK-JER" },
      { color: "Cocoa", colorHex: "#6f5750", material: "Jersey Premium", stock: 20, sku: "ZIM-INS-COC-JER" },
      { color: "Latte", colorHex: "#c5a58a", material: "Jersey Premium", stock: 16, sku: "ZIM-INS-LAT-JER" },
    ],
  },
  {
    id: "p4",
    name: "Zimeira Bergo Travel Sage",
    slug: "zimeira-bergo-travel-sage",
    category: "Bergo",
    categorySlug: "bergo",
    description:
      "Bergo travel dengan material adem dan jatuh natural, dibuat untuk aktivitas santai yang tetap polished.",
    normalPrice: 99000,
    discountPrice: null,
    image: "/images/products/bergo-sage.svg",
    labels: ["new arrival"],
    colors: ["Sage", "Cream", "Ash Rose"],
    materials: ["Airy Jersey"],
    variants: [
      { color: "Sage", colorHex: "#aeb8a2", material: "Airy Jersey", stock: 22, sku: "ZIM-BER-SAG-JER" },
      { color: "Cream", colorHex: "#eadfcd", material: "Airy Jersey", stock: 13, sku: "ZIM-BER-CRE-JER" },
    ],
  },
  {
    id: "p5",
    name: "Inner Ninja Soft Cotton",
    slug: "inner-ninja-soft-cotton",
    category: "Ciput & Inner",
    categorySlug: "ciput-inner",
    description: "Inner ninja cotton stretch yang breathable, menutup rapi, dan tidak mudah bergeser.",
    normalPrice: 59000,
    discountPrice: 49000,
    image: "/images/products/inner-cotton.svg",
    labels: ["best seller", "diskon"],
    colors: ["Ivory", "Black", "Mocha"],
    materials: ["Cotton Stretch"],
    variants: [
      { color: "Ivory", colorHex: "#f2eadf", material: "Cotton Stretch", stock: 40, sku: "ZIM-INN-IVY-COT" },
      { color: "Black", colorHex: "#22201d", material: "Cotton Stretch", stock: 35, sku: "ZIM-INN-BLK-COT" },
    ],
  },
  {
    id: "p6",
    name: "Magnet Hijab Gold Set",
    slug: "magnet-hijab-gold-set",
    category: "Aksesoris",
    categorySlug: "aksesoris",
    description: "Set magnet hijab warna gold lembut untuk styling tanpa merusak serat kain.",
    normalPrice: 39000,
    discountPrice: null,
    image: "/images/products/magnet-gold.svg",
    labels: ["new arrival"],
    colors: ["Gold", "Rose Gold"],
    materials: ["Metal Alloy"],
    variants: [
      { color: "Gold", colorHex: "#caa85a", material: "Metal Alloy", stock: 55, sku: "ZIM-ACC-GOL-MAG" },
      { color: "Rose Gold", colorHex: "#c99387", material: "Metal Alloy", stock: 44, sku: "ZIM-ACC-ROG-MAG" },
    ],
  },
];

export const cartItems = [
  { product: products[0], variant: products[0].variants[0], quantity: 1 },
  { product: products[4], variant: products[4].variants[1], quantity: 2 },
];

export const orders = [
  { id: "ZMS-2026-0001", date: "7 Juni 2026", status: "Diproses", total: 114000, items: 1 },
  { id: "ZMS-2026-0002", date: "2 Juni 2026", status: "Selesai", total: 207000, items: 3 },
];

export const adminStats = [
  { label: "Total Produk", value: "128", note: "+12 produk bulan ini" },
  { label: "Total Order", value: "342", note: "28 order menunggu proses" },
  { label: "Total Customer", value: "1.284", note: "+84 customer baru" },
  { label: "Pendapatan Dummy", value: "Rp 48,7 jt", note: "Data contoh tahap pertama" },
];

export const adminOrders = [
  { id: "ZMS-2026-0001", customer: "Nadia Zimeira", status: "Diproses", payment: "Paid", total: 114000 },
  { id: "ZMS-2026-0002", customer: "Alya Putri", status: "Dikirim", payment: "Paid", total: 207000 },
  { id: "ZMS-2026-0003", customer: "Salsa Rahma", status: "Pending", payment: "Unpaid", total: 89000 },
];

export const storeSettings = {
  name: "Zimeira Hijab Store",
  email: "hello@zimeirahijab.test",
  phone: "0812-0000-2026",
  address: "Pagar Alam, South Sumatra, Indonesia",
  instagram: "@zimeirahijab.demo",
};
