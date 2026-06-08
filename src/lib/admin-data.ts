import { adminOrders, categories as fallbackCategories, products as fallbackProducts, storeSettings } from "@/lib/data";
import { getPrisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";

export type AdminSalesChartPoint = {
  key: string;
  label: string;
  total: number;
  paidTotal?: number;
  orderCount?: number;
};

export async function getAdminDashboardData() {
  try {
    const [productCount, orderCount, customerCount, revenue] = await Promise.all([
      getPrisma().product.count({ where: { isActive: true } }),
      getPrisma().order.count(),
      getPrisma().user.count(),
      getPrisma().order.aggregate({ _sum: { grandTotal: true } }),
    ]);

    return {
      stats: [
        { label: "Total Produk", value: String(productCount), note: "Produk aktif di database" },
        { label: "Total Order", value: String(orderCount), note: "Total pesanan tersimpan" },
        { label: "Total Customer", value: String(customerCount), note: "Akun customer dan admin" },
        { label: "Pendapatan", value: formatCurrency(revenue._sum.grandTotal ?? 0), note: "Berdasarkan order database" },
      ],
      orders: await getPrisma().order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { orderNumber: true, customerName: true, status: true, grandTotal: true },
      }),
    };
  } catch {
    const paidRevenue = adminOrders
      .filter((order) => ["PAID"].includes(order.payment) && !["CANCELED", "REFUNDED"].includes(order.status))
      .reduce((total, order) => total + order.total, 0);
    const uniqueCustomers = new Set(adminOrders.map((order) => order.customer));
    const canceledCount = adminOrders.filter((order) => ["CANCELED", "REFUNDED"].includes(order.status)).length;

    return {
      stats: [
        { label: "Total Produk", value: String(fallbackProducts.length), note: "Produk aktif di katalog demo" },
        { label: "Total Order", value: String(adminOrders.length), note: "Pesanan dummy yang tampil di CMS" },
        { label: "Total Customer", value: String(uniqueCustomers.size + 1), note: "Customer unik + admin demo" },
        { label: "Pendapatan", value: formatCurrency(paidRevenue), note: "Order paid tanpa canceled/refunded" },
        { label: "Pembatalan", value: String(canceledCount), note: "Canceled dan refunded demo" },
      ],
      orders: adminOrders.slice(0, 5).map((order) => ({
        orderNumber: order.id,
        customerName: order.customer,
        status: order.status,
        grandTotal: order.total,
      })),
    };
  }
}

export async function getAdminSalesChartData(): Promise<AdminSalesChartPoint[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const orders = await getPrisma().order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, grandTotal: true, payment: { select: { status: true } } },
      orderBy: { createdAt: "asc" },
    });

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      const key = formatDateKey(date);
      const dayOrders = orders.filter((order) => formatDateKey(order.createdAt) === key);
      const total = dayOrders.reduce((sum, order) => sum + order.grandTotal, 0);
      const paidTotal = dayOrders
        .filter((order) => order.payment?.status === "PAID")
        .reduce((sum, order) => sum + order.grandTotal, 0);

      return {
        key,
        label: date.toLocaleDateString("id-ID", { weekday: "short" }),
        total,
        paidTotal,
        orderCount: dayOrders.length,
      };
    });
  } catch {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dayOrders = adminOrders.filter((order) => (order.daysAgo ?? 0) === 6 - index);
      const total = dayOrders.reduce((sum, order) => sum + order.total, 0);
      const paidTotal = dayOrders
        .filter((order) => order.payment === "PAID" && !["CANCELED", "REFUNDED"].includes(order.status))
        .reduce((sum, order) => sum + order.total, 0);

      return {
        key: `fallback-${index}`,
        label: date.toLocaleDateString("id-ID", { weekday: "short" }),
        total,
        paidTotal,
        orderCount: dayOrders.length,
      };
    });
  }
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getAdminCategories() {
  try {
    return await getPrisma().productCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
  } catch {
    return fallbackCategories.map((category) => ({
      id: category.slug,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { products: fallbackProducts.filter((product) => product.categorySlug === category.slug).length },
    }));
  }
}

export async function getAdminProducts(options: { q?: string; status?: string; page?: number; pageSize?: number } = {}) {
  try {
    const pageSize = options.pageSize ?? 20;
    const page = Math.max(1, options.page ?? 1);
    const where = {
      ...(options.q
        ? {
            OR: [
              { name: { contains: options.q, mode: "insensitive" as const } },
              { slug: { contains: options.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(options.status === "active" ? { isActive: true } : options.status === "inactive" ? { isActive: false } : {}),
    };

    return await getPrisma().product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });
  } catch {
    return fallbackProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      normalPrice: product.normalPrice,
      discountPrice: product.discountPrice,
      labels: product.labels,
      isActive: true,
      categoryId: product.categorySlug,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: { id: product.categorySlug, name: product.category, slug: product.categorySlug, description: "", isActive: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
      images: [{ id: product.id, productId: product.id, url: product.image, alt: product.name, sortOrder: 0, createdAt: new Date() }],
      variants: product.variants.map((variant) => ({
        id: variant.sku,
        productId: product.id,
        color: variant.color,
        colorHex: variant.colorHex,
        material: variant.material,
        stock: variant.stock,
        sku: variant.sku,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    }));
  }
}

export async function getAdminVariants() {
  const products = await getAdminProducts();
  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      ...variant,
      productName: product.name,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
    })),
  );
}

export async function getAdminProductById(id: string) {
  try {
    return await getPrisma().product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
      },
    });
  } catch {
    const product = fallbackProducts.find((item) => item.id === id || item.slug === id);
    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      normalPrice: product.normalPrice,
      discountPrice: product.discountPrice,
      labels: product.labels,
      isActive: true,
      categoryId: product.categorySlug,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: product.categorySlug,
        name: product.category,
        slug: product.categorySlug,
        description: "",
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      images: [{ id: product.id, productId: product.id, url: product.image, alt: product.name, sortOrder: 0, createdAt: new Date() }],
      variants: product.variants.map((variant) => ({
        id: variant.sku,
        productId: product.id,
        color: variant.color,
        colorHex: variant.colorHex,
        material: variant.material,
        stock: variant.stock,
        sku: variant.sku,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
  }
}

function dateRange(start?: string, end?: string) {
  const range: { gte?: Date; lte?: Date } = {};
  if (start) {
    const parsed = new Date(`${start}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) range.gte = parsed;
  }
  if (end) {
    const parsed = new Date(`${end}T23:59:59`);
    if (!Number.isNaN(parsed.getTime())) range.lte = parsed;
  }
  return Object.keys(range).length ? range : undefined;
}

export async function getAdminOrders(options: { q?: string; status?: string; payment?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number } = {}) {
  try {
    const pageSize = options.pageSize ?? 20;
    const page = Math.max(1, options.page ?? 1);
    const createdAt = dateRange(options.dateFrom, options.dateTo);

    return await getPrisma().order.findMany({
      where: {
        ...(options.q
          ? {
              OR: [
                { orderNumber: { contains: options.q, mode: "insensitive" } },
                { customerName: { contains: options.q, mode: "insensitive" } },
                { customerEmail: { contains: options.q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(options.status ? { status: options.status as never } : {}),
        ...(options.payment ? { payment: { status: options.payment as never } } : {}),
        ...(createdAt ? { createdAt } : {}),
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: true, payment: true },
    });
  } catch {
    return adminOrders.map((order) => ({
      id: order.id,
      orderNumber: order.id,
      customerName: order.customer,
      customerEmail: "customer@zimeirahijab.test",
      customerPhone: "081234567890",
      status: order.status,
      grandTotal: order.total,
      subtotal: order.total,
      discountTotal: 0,
      shippingCost: 0,
      shippingProvider: "Zimeira Delivery",
      shippingService: "Regular",
      shippingEstimate: "2-4 hari",
      trackingNumber: null,
      trackingStatus: null,
      trackingUpdatedAt: null,
      userId: null,
      couponId: null,
      shippingAddressId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      payment: { status: order.payment },
    }));
  }
}

export async function getAdminOrderByNumber(orderNumber: string) {
  try {
    return await getPrisma().order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payment: true,
        shippingAddress: true,
        returnRequests: { orderBy: { createdAt: "desc" } },
        user: { select: { name: true, email: true, phone: true } },
        coupon: { select: { code: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function getAdminCustomers(options: { q?: string; role?: string; page?: number; pageSize?: number } = {}) {
  try {
    const pageSize = options.pageSize ?? 20;
    const page = Math.max(1, options.page ?? 1);

    return await getPrisma().user.findMany({
      where: {
        ...(options.q
          ? {
              OR: [
                { name: { contains: options.q, mode: "insensitive" } },
                { email: { contains: options.q, mode: "insensitive" } },
                { phone: { contains: options.q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(options.role ? { role: options.role as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { orders: true } } },
    });
  } catch {
    const customerOrders = new Map<string, number>();
    for (const order of adminOrders) {
      customerOrders.set(order.customer, (customerOrders.get(order.customer) ?? 0) + 1);
    }

    return Array.from(customerOrders.entries()).map(([name, count], index) => ({
      id: `customer-${index + 1}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.test`,
      phone: `0812${String(77770000 + index).padStart(8, "0")}`,
      role: "CUSTOMER",
      _count: { orders: count },
    }));
  }
}

export async function getAdminCustomerById(id: string) {
  try {
    return await getPrisma().user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { payment: true, items: true, shippingAddress: true },
        },
        shippingAddresses: { orderBy: { createdAt: "desc" }, take: 10 },
        wishlistItems: {
          orderBy: { createdAt: "desc" },
          take: 12,
          include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
        },
        _count: { select: { orders: true, wishlistItems: true, shippingAddresses: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function getAdminStoreSetting() {
  try {
    return (await getPrisma().storeSetting.findFirst()) ?? storeSettings;
  } catch {
    return storeSettings;
  }
}

export async function getAdminCoupons(options: { q?: string; status?: string; page?: number; pageSize?: number } = {}) {
  try {
    const pageSize = options.pageSize ?? 20;
    const page = Math.max(1, options.page ?? 1);

    return await getPrisma().coupon.findMany({
      where: {
        ...(options.q
          ? {
              OR: [
                { code: { contains: options.q, mode: "insensitive" } },
                { description: { contains: options.q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(options.status === "active" ? { isActive: true } : options.status === "inactive" ? { isActive: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  } catch {
    return [
      { id: "ZIMEIRA10", code: "ZIMEIRA10", description: "Diskon pembukaan toko demo", discountPercent: 10, discountAmount: null, minPurchase: 100000, quota: 100, isActive: true, startsAt: null, endsAt: null, createdAt: new Date(), updatedAt: new Date() },
      { id: "NEWARRIVAL", code: "NEWARRIVAL", description: "Voucher dummy new arrival", discountPercent: null, discountAmount: 15000, minPurchase: 150000, quota: 50, isActive: false, startsAt: null, endsAt: null, createdAt: new Date(), updatedAt: new Date() },
    ];
  }
}

export async function getAdminBanners(options: { q?: string; status?: string; page?: number; pageSize?: number } = {}) {
  try {
    const pageSize = options.pageSize ?? 20;
    const page = Math.max(1, options.page ?? 1);

    return await getPrisma().banner.findMany({
      where: {
        ...(options.q
          ? {
              OR: [
                { title: { contains: options.q, mode: "insensitive" } },
                { subtitle: { contains: options.q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(options.status === "active" ? { isActive: true } : options.status === "inactive" ? { isActive: false } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  } catch {
    return [
      { id: "1", title: "New modest essentials", subtitle: "Koleksi hijab lembut untuk aktivitas harian.", imageUrl: "/images/products/pashmina-rose.svg", ctaLabel: "Belanja koleksi", ctaHref: "/produk", isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: "2", title: "Daily comfort edit", subtitle: "Pashmina dan inner untuk rutinitas padat.", imageUrl: "/images/products/square-cream.svg", ctaLabel: "Lihat pashmina", ctaHref: "/produk?category=pashmina", isActive: false, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
    ];
  }
}

export async function getAdminLowStockVariants(threshold = 5) {
  try {
    return await getPrisma().productVariant.findMany({
      where: { stock: { lte: threshold }, isActive: true },
      orderBy: { stock: "asc" },
      take: 12,
      include: { product: { select: { name: true, slug: true } } },
    });
  } catch {
    return fallbackProducts.flatMap((product) =>
      product.variants
        .filter((variant) => variant.stock <= threshold || ["ZIM-SQR-GOL-SILK", "ZIM-BER-CRE-JER"].includes(variant.sku))
        .slice(0, 2)
        .map((variant) => ({
          id: variant.sku,
          productId: product.id,
          color: variant.color,
          colorHex: variant.colorHex,
          material: variant.material,
          stock: Math.min(variant.stock, variant.sku === "ZIM-SQR-GOL-SILK" ? 4 : variant.sku === "ZIM-BER-CRE-JER" ? 5 : variant.stock),
          sku: variant.sku,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: { name: product.name, slug: product.slug },
        })),
    ).slice(0, 6);
  }
}

export async function getAdminStockMovements() {
  try {
    return await getPrisma().stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        variant: {
          include: {
            product: {
              select: { name: true, slug: true },
            },
          },
        },
        order: {
          select: { orderNumber: true },
        },
      },
    });
  } catch {
    return [];
  }
}

export async function getAdminAuditLogs() {
  try {
    return await getPrisma().adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { actor: { select: { name: true, email: true } } },
    });
  } catch {
    return [];
  }
}

export async function getAdminReturnRequests() {
  try {
    return await getPrisma().returnRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true } },
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            grandTotal: true,
            status: true,
            payment: { select: { status: true } },
          },
        },
      },
    });
  } catch {
    return [];
  }
}
