"use server";

import { AdminAuditAction, OrderStatus, PaymentStatus, ProductLabel, ReturnStatus, StockMovementType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { writeAdminAudit } from "@/lib/admin-audit";
import { sendOrderEmail } from "@/lib/email";
import { setFlashToast } from "@/lib/flash-toast";
import { getPrisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toInt(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readLabels(formData: FormData) {
  const labels: ProductLabel[] = [];
  if (formData.get("isNewArrival")) labels.push(ProductLabel.NEW_ARRIVAL);
  if (formData.get("isBestSeller")) labels.push(ProductLabel.BEST_SELLER);
  if (formData.get("isDiscount")) labels.push(ProductLabel.DISCOUNT);
  return labels;
}

function readIds(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value)).filter(Boolean);
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));

  if (!name || !slug) return;

  await getPrisma().productCategory.upsert({
    where: { slug },
    update: { name, description, isActive: true },
    create: { name, slug, description },
  });

  revalidatePath("/admin/kategori");
  revalidatePath("/produk");
  await writeAdminAudit({ action: AdminAuditAction.CREATE, entity: "ProductCategory", summary: `Simpan kategori ${name}` });
  await setFlashToast("Kategori berhasil disimpan.");
}

export async function deactivateCategory(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().productCategory.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/admin/kategori");
  revalidatePath("/produk");
  await setFlashToast("Kategori berhasil dihapus atau dinonaktifkan.");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().$transaction(async (tx) => {
    const linkedProducts = await tx.product.count({ where: { categoryId: id } });

    if (linkedProducts > 0) {
      await tx.productCategory.update({ where: { id }, data: { isActive: false } });
      return;
    }

    await tx.productCategory.delete({ where: { id } });
  });

  revalidatePath("/admin/kategori");
  revalidatePath("/produk");
  await writeAdminAudit({ action: AdminAuditAction.DELETE, entity: "ProductCategory", entityId: id, summary: "Hapus aman atau nonaktifkan kategori" });
  await setFlashToast("Kategori berhasil diperbarui.");
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = toInt(formData.get("sortOrder"));
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id || !name || !slug) return;

  await getPrisma().productCategory.update({
    where: { id },
    data: { name, slug, description, sortOrder, isActive },
  });

  revalidatePath("/admin/kategori");
  revalidatePath("/produk");
  await setFlashToast("Kategori berhasil diperbarui.");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const normalPrice = toInt(formData.get("normalPrice"));
  const discountPrice = toInt(formData.get("discountPrice"));
  const imageUrl = String(formData.get("imageUrl") ?? "/images/products/pashmina-rose.svg").trim();

  if (!name || !slug || !description || !categoryId || normalPrice <= 0) return;

  await getPrisma().product.create({
    data: {
      name,
      slug,
      description,
      categoryId,
      normalPrice,
      discountPrice: discountPrice > 0 ? discountPrice : null,
      labels: readLabels(formData),
      images: {
        create: {
          url: imageUrl || "/images/products/pashmina-rose.svg",
          alt: name,
        },
      },
    },
  });

  revalidatePath("/admin/produk");
  revalidatePath("/produk");
  await writeAdminAudit({ action: AdminAuditAction.CREATE, entity: "Product", summary: `Tambah produk ${name}` });
  await setFlashToast("Produk berhasil disimpan.");
}

export async function deactivateProduct(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().product.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/admin/produk");
  revalidatePath("/produk");
  await setFlashToast("Produk berhasil dinonaktifkan.");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().$transaction(async (tx) => {
    const [cartItems, orderItems, reviews, wishlistItems] = await Promise.all([
      tx.cartItem.count({ where: { productId: id } }),
      tx.orderItem.count({ where: { productId: id } }),
      tx.review.count({ where: { productId: id } }),
      tx.wishlist.count({ where: { productId: id } }),
    ]);

    if (cartItems || orderItems || reviews || wishlistItems) {
      await tx.product.update({ where: { id }, data: { isActive: false } });
      await tx.productVariant.updateMany({ where: { productId: id }, data: { isActive: false } });
      return;
    }

    await tx.product.delete({ where: { id } });
  });

  revalidatePath("/admin/produk");
  revalidatePath("/admin/varian");
  revalidatePath("/produk");
  await writeAdminAudit({ action: AdminAuditAction.DELETE, entity: "Product", entityId: id, summary: "Hapus aman atau nonaktifkan produk" });
  await setFlashToast("Produk berhasil dihapus atau dinonaktifkan.");
}

export async function updateProductStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";
  if (!id) return;

  await getPrisma().product.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/produk");
  revalidatePath("/produk");
  await writeAdminAudit({ action: AdminAuditAction.STATUS_CHANGE, entity: "Product", entityId: id, summary: `Ubah status produk menjadi ${isActive ? "aktif" : "nonaktif"}` });
  await setFlashToast("Status produk berhasil diperbarui.");
}

export async function bulkUpdateProducts(formData: FormData) {
  await requireAdmin();

  const ids = readIds(formData, "productId");
  const action = String(formData.get("bulkAction") ?? "");
  if (!ids.length || !["activate", "deactivate"].includes(action)) return;

  const isActive = action === "activate";
  await getPrisma().product.updateMany({
    where: { id: { in: ids } },
    data: { isActive },
  });

  if (!isActive) {
    await getPrisma().productVariant.updateMany({
      where: { productId: { in: ids } },
      data: { isActive: false },
    });
  }

  revalidatePath("/admin/produk");
  revalidatePath("/produk");
  await writeAdminAudit({ action: AdminAuditAction.STATUS_CHANGE, entity: "Product", summary: `Bulk ${isActive ? "aktifkan" : "nonaktifkan"} ${ids.length} produk`, metadata: { ids } });
  await setFlashToast(`${ids.length} produk berhasil ${isActive ? "diaktifkan" : "dinonaktifkan"}.`);
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const normalPrice = toInt(formData.get("normalPrice"));
  const discountPrice = toInt(formData.get("discountPrice"));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id || !name || !slug || !description || !categoryId || normalPrice <= 0) return;

  await getPrisma().$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        categoryId,
        normalPrice,
        discountPrice: discountPrice > 0 ? discountPrice : null,
        labels: readLabels(formData),
        isActive,
      },
    });

    if (!imageUrl) return;

    const image = await tx.productImage.findFirst({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    });

    if (image) {
      await tx.productImage.update({
        where: { id: image.id },
        data: { url: imageUrl, alt: name },
      });
    } else {
      await tx.productImage.create({
        data: { productId: id, url: imageUrl, alt: name },
      });
    }
  });

  revalidatePath("/admin/produk");
  revalidatePath(`/admin/produk/${id}`);
  revalidatePath("/produk");
  revalidatePath(`/produk/${slug}`);
  await writeAdminAudit({ action: AdminAuditAction.UPDATE, entity: "Product", entityId: id, summary: `Update produk ${name}` });
  await setFlashToast("Produk berhasil diperbarui.");
}

export async function createVariant(formData: FormData) {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const color = String(formData.get("color") ?? "").trim();
  const colorHex = String(formData.get("colorHex") ?? "").trim();
  const material = String(formData.get("material") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const stock = toInt(formData.get("stock"));

  if (!productId || !color || !material || !sku) return;

  await getPrisma().$transaction(async (tx) => {
    const existingVariant = await tx.productVariant.findUnique({ where: { sku }, select: { id: true, stock: true } });
    const variant = await tx.productVariant.upsert({
      where: { sku },
      update: { productId, color, colorHex, material, stock, isActive: true },
      create: { productId, color, colorHex, material, sku, stock },
    });

    const stockBefore = existingVariant?.stock ?? 0;
    if (stockBefore !== stock) {
      await tx.stockMovement.create({
        data: {
          variantId: variant.id,
          type: StockMovementType.ADJUSTMENT,
          quantity: stock - stockBefore,
          stockBefore,
          stockAfter: stock,
          note: existingVariant ? "Update stok varian dari admin" : "Input stok awal varian dari admin",
        },
      });
    }
  });

  revalidatePath("/admin/varian");
  revalidatePath("/admin/produk");
  revalidatePath(`/admin/produk/${productId}`);
  revalidatePath("/produk");
  await writeAdminAudit({ action: AdminAuditAction.STOCK_ADJUSTMENT, entity: "ProductVariant", summary: `Simpan varian ${sku}`, metadata: { productId, stock } });
  await setFlashToast("Varian berhasil disimpan.");
}

export async function deleteVariant(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().$transaction(async (tx) => {
    const linkedItems = await tx.orderItem.count({ where: { variantId: id } });
    const linkedCartItems = await tx.cartItem.count({ where: { variantId: id } });

    if (linkedItems || linkedCartItems) {
      await tx.productVariant.update({ where: { id }, data: { isActive: false } });
      return;
    }

    await tx.productVariant.delete({ where: { id } });
  });

  revalidatePath("/admin/varian");
  revalidatePath("/admin/produk");
  revalidatePath("/produk");
  await writeAdminAudit({ action: AdminAuditAction.DELETE, entity: "ProductVariant", entityId: id, summary: "Hapus aman atau nonaktifkan varian" });
  await setFlashToast("Varian berhasil dihapus atau dinonaktifkan.");
}

export async function updateVariant(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const color = String(formData.get("color") ?? "").trim();
  const colorHex = String(formData.get("colorHex") ?? "").trim();
  const material = String(formData.get("material") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const stock = toInt(formData.get("stock"));
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id || !productId || !color || !material || !sku) return;

  await getPrisma().$transaction(async (tx) => {
    const existingVariant = await tx.productVariant.findUnique({ where: { id }, select: { stock: true } });

    await tx.productVariant.update({
      where: { id },
      data: { productId, color, colorHex, material, sku, stock, isActive },
    });

    if (existingVariant && existingVariant.stock !== stock) {
      await tx.stockMovement.create({
        data: {
          variantId: id,
          type: StockMovementType.ADJUSTMENT,
          quantity: stock - existingVariant.stock,
          stockBefore: existingVariant.stock,
          stockAfter: stock,
          note: "Adjustment stok dari admin",
        },
      });
    }
  });

  revalidatePath("/admin/varian");
  revalidatePath("/admin/produk");
  revalidatePath(`/admin/produk/${productId}`);
  revalidatePath("/produk");
  await writeAdminAudit({ action: AdminAuditAction.STOCK_ADJUSTMENT, entity: "ProductVariant", entityId: id, summary: `Update varian ${sku}`, metadata: { productId, stock } });
  await setFlashToast("Varian berhasil diperbarui.");
}

export async function createCoupon(formData: FormData) {
  await requireAdmin();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const discountPercent = toInt(formData.get("discountPercent"));
  const discountAmount = toInt(formData.get("discountAmount"));
  const minPurchase = toInt(formData.get("minPurchase"));
  const quota = toInt(formData.get("quota"));

  if (!code || (!discountPercent && !discountAmount)) return;

  await getPrisma().coupon.upsert({
    where: { code },
    update: {
      description,
      discountPercent: discountPercent > 0 ? discountPercent : null,
      discountAmount: discountAmount > 0 ? discountAmount : null,
      minPurchase,
      quota: quota > 0 ? quota : null,
      isActive: true,
    },
    create: {
      code,
      description,
      discountPercent: discountPercent > 0 ? discountPercent : null,
      discountAmount: discountAmount > 0 ? discountAmount : null,
      minPurchase,
      quota: quota > 0 ? quota : null,
    },
  });

  revalidatePath("/admin/voucher");
  await writeAdminAudit({ action: AdminAuditAction.CREATE, entity: "Coupon", summary: `Simpan voucher ${code}` });
  await setFlashToast("Voucher berhasil disimpan.");
}

export async function deactivateCoupon(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().coupon.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin/voucher");
  await setFlashToast("Voucher berhasil dinonaktifkan.");
}

export async function deleteCoupon(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().$transaction(async (tx) => {
    const linkedOrders = await tx.order.count({ where: { couponId: id } });

    if (linkedOrders > 0) {
      await tx.coupon.update({ where: { id }, data: { isActive: false } });
      return;
    }

    await tx.coupon.delete({ where: { id } });
  });

  revalidatePath("/admin/voucher");
  revalidatePath("/checkout");
  await writeAdminAudit({ action: AdminAuditAction.DELETE, entity: "Coupon", entityId: id, summary: "Hapus aman atau nonaktifkan voucher" });
  await setFlashToast("Voucher berhasil dihapus atau dinonaktifkan.");
}

export async function updateCoupon(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const discountPercent = toInt(formData.get("discountPercent"));
  const discountAmount = toInt(formData.get("discountAmount"));
  const minPurchase = toInt(formData.get("minPurchase"));
  const quota = toInt(formData.get("quota"));
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id || !code || (!discountPercent && !discountAmount)) return;

  await getPrisma().coupon.update({
    where: { id },
    data: {
      code,
      description,
      discountPercent: discountPercent > 0 ? discountPercent : null,
      discountAmount: discountAmount > 0 ? discountAmount : null,
      minPurchase,
      quota: quota > 0 ? quota : null,
      isActive,
    },
  });

  revalidatePath("/admin/voucher");
  await writeAdminAudit({ action: AdminAuditAction.UPDATE, entity: "Coupon", entityId: id, summary: `Update voucher ${code}` });
  await setFlashToast("Voucher berhasil diperbarui.");
}

export async function createBanner(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || "/images/products/pashmina-rose.svg";
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const sortOrder = toInt(formData.get("sortOrder"));

  if (!title) return;

  await getPrisma().banner.create({
    data: { title, subtitle, imageUrl, ctaLabel, ctaHref, sortOrder },
  });

  revalidatePath("/admin/banner");
  revalidatePath("/");
  await writeAdminAudit({ action: AdminAuditAction.CREATE, entity: "Banner", summary: `Tambah banner ${title}` });
  await setFlashToast("Banner berhasil disimpan.");
}

export async function deactivateBanner(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().banner.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin/banner");
  revalidatePath("/");
  await writeAdminAudit({ action: AdminAuditAction.DELETE, entity: "Banner", entityId: id, summary: "Hapus banner" });
  await setFlashToast("Banner berhasil dihapus.");
}

export async function deleteBanner(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().banner.delete({ where: { id } });

  revalidatePath("/admin/banner");
  revalidatePath("/");
  await setFlashToast("Banner berhasil dihapus.");
}

export async function deleteCustomer(formData: FormData) {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id || id === session.user.id) return;

  await getPrisma().$transaction(async (tx) => {
    const customer = await tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!customer || customer.role !== UserRole.CUSTOMER || customer._count.orders > 0) return;

    await tx.cart.deleteMany({ where: { userId: id } });
    await tx.shippingAddress.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/customer");
  await writeAdminAudit({ action: AdminAuditAction.DELETE, entity: "User", entityId: id, summary: "Hapus customer tanpa order" });
  await setFlashToast("Customer berhasil dihapus jika memenuhi syarat.");
}

export async function updateBanner(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || "/images/products/pashmina-rose.svg";
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const sortOrder = toInt(formData.get("sortOrder"));
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id || !title) return;

  await getPrisma().banner.update({
    where: { id },
    data: { title, subtitle, imageUrl, ctaLabel, ctaHref, sortOrder, isActive },
  });

  revalidatePath("/admin/banner");
  revalidatePath("/");
  await writeAdminAudit({ action: AdminAuditAction.UPDATE, entity: "Banner", entityId: id, summary: `Update banner ${title}` });
  await setFlashToast("Banner berhasil diperbarui.");
}

export async function updateStoreSetting(formData: FormData) {
  await requireAdmin();

  await getPrisma().storeSetting.upsert({
    where: { id: "store-setting" },
    update: {
      storeName: String(formData.get("storeName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      instagram: String(formData.get("instagram") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    },
    create: {
      id: "store-setting",
      storeName: String(formData.get("storeName") ?? "Zimeira Hijab Store").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      instagram: String(formData.get("instagram") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    },
  });

  revalidatePath("/admin/pengaturan");
  await writeAdminAudit({ action: AdminAuditAction.UPDATE, entity: "StoreSetting", entityId: "store-setting", summary: "Update pengaturan toko" });
  await setFlashToast("Pengaturan toko berhasil disimpan.");
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const paymentStatus = String(formData.get("paymentStatus") ?? "") as PaymentStatus;

  if (!id || !Object.values(OrderStatus).includes(status) || !Object.values(PaymentStatus).includes(paymentStatus)) {
    return;
  }

  const updatedOrder = await getPrisma().order.update({
    where: { id },
    data: {
      status,
      payment: {
        update: {
          status: paymentStatus,
          paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
        },
      },
    },
    include: { payment: true },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pesanan");
  revalidatePath("/pesanan");
  await writeAdminAudit({ action: AdminAuditAction.STATUS_CHANGE, entity: "Order", entityId: id, summary: `Update order ke ${status} / ${paymentStatus}` });
  if (paymentStatus === PaymentStatus.PAID) {
    await sendOrderEmail({
      to: updatedOrder.customerEmail,
      userId: updatedOrder.userId,
      orderId: updatedOrder.id,
      subject: `Pembayaran ${updatedOrder.orderNumber} diterima`,
      message: `Halo ${updatedOrder.customerName}, pembayaran pesanan ${updatedOrder.orderNumber} sudah diterima. Pesanan akan segera diproses.`,
    });
  }
  if (status === OrderStatus.DELIVERED) {
    await sendOrderEmail({
      to: updatedOrder.customerEmail,
      userId: updatedOrder.userId,
      orderId: updatedOrder.id,
      subject: `Pesanan ${updatedOrder.orderNumber} selesai`,
      message: `Halo ${updatedOrder.customerName}, pesanan ${updatedOrder.orderNumber} sudah selesai. Terima kasih sudah belanja di Zimeira Hijab Store.`,
    });
  }
  await setFlashToast("Status pesanan berhasil diperbarui.");
}

export async function bulkUpdateOrders(formData: FormData) {
  await requireAdmin();

  const ids = readIds(formData, "orderId");
  const status = String(formData.get("bulkStatus") ?? "") as OrderStatus;
  if (!ids.length || !Object.values(OrderStatus).includes(status)) return;

  await getPrisma().order.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pesanan");
  revalidatePath("/pesanan");
  await writeAdminAudit({ action: AdminAuditAction.STATUS_CHANGE, entity: "Order", summary: `Bulk update ${ids.length} order ke ${status}`, metadata: { ids, status } });
  await setFlashToast(`${ids.length} order berhasil diubah ke ${status}.`);
}

export async function updateOrderTracking(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const shippingProvider = String(formData.get("shippingProvider") ?? "").trim();
  const shippingService = String(formData.get("shippingService") ?? "").trim();
  const shippingEstimate = String(formData.get("shippingEstimate") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  if (!id) return;

  const updatedOrder = await getPrisma().order.update({
    where: { id },
    data: {
      shippingProvider: shippingProvider || null,
      shippingService: shippingService || null,
      shippingEstimate: shippingEstimate || null,
      trackingNumber: trackingNumber || null,
    },
  });

  revalidatePath("/admin/pesanan");
  revalidatePath("/pesanan");
  await writeAdminAudit({ action: AdminAuditAction.UPDATE, entity: "Order", entityId: id, summary: `Update resi ${trackingNumber || "-"}` });
  if (trackingNumber) {
    await sendOrderEmail({
      to: updatedOrder.customerEmail,
      userId: updatedOrder.userId,
      orderId: updatedOrder.id,
      subject: `Pesanan ${updatedOrder.orderNumber} dikirim`,
      message: `Halo ${updatedOrder.customerName}, pesanan ${updatedOrder.orderNumber} sudah dikirim via ${updatedOrder.shippingProvider ?? "kurir"} ${updatedOrder.shippingService ?? ""}. Resi: ${trackingNumber}.`,
    });
  }
  await setFlashToast("Data resi berhasil diperbarui.");
}

export async function updateReturnRequest(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ReturnStatus;
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  const refundAmount = toInt(formData.get("refundAmount"));

  if (!id || !Object.values(ReturnStatus).includes(status)) return;

  const returnRequest = await getPrisma().returnRequest.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: true,
          payment: true,
        },
      },
    },
  });

  if (!returnRequest) return;

  await getPrisma().$transaction(async (tx) => {
    await tx.returnRequest.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || null,
        refundAmount: refundAmount > 0 ? refundAmount : null,
      },
    });

    const shouldReturnStock = status === ReturnStatus.RECEIVED || status === ReturnStatus.REFUNDED;
    if (shouldReturnStock) {
      const existingReturnMovement = await tx.stockMovement.count({
        where: { orderId: returnRequest.orderId, type: StockMovementType.RETURN, note: { contains: "retur" } },
      });

      if (existingReturnMovement === 0) {
        for (const item of returnRequest.order.items) {
          if (!item.variantId) continue;

          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { stock: true },
          });

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });

          if (variant) {
            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                orderId: returnRequest.orderId,
                type: StockMovementType.RETURN,
                quantity: item.quantity,
                stockBefore: variant.stock,
                stockAfter: variant.stock + item.quantity,
                note: `Stok dikembalikan dari retur ${returnRequest.order.orderNumber}`,
              },
            });
          }
        }
      }
    }

    if (status === ReturnStatus.REFUNDED) {
      await tx.payment.update({
        where: { orderId: returnRequest.orderId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: new Date(),
          refundReason: adminNote || returnRequest.reason,
        },
      });
    }
  });

  revalidatePath("/admin/pesanan");
  revalidatePath(`/admin/pesanan/${returnRequest.order.orderNumber}`);
  revalidatePath("/pesanan");
  revalidatePath(`/pesanan/${returnRequest.order.orderNumber}`);
  await writeAdminAudit({ action: AdminAuditAction.STATUS_CHANGE, entity: "ReturnRequest", entityId: id, summary: `Update retur ${returnRequest.order.orderNumber} ke ${status}` });
  await setFlashToast("Status retur/refund berhasil diperbarui.");
}

export async function deleteProblemOrder(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getPrisma().$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: {
        items: { select: { id: true, quantity: true, variantId: true } },
        payment: { select: { status: true } },
        shippingAddress: { select: { id: true, userId: true } },
      },
    });

    if (!order) return;

    const canDelete =
      order.status === OrderStatus.CANCELLED ||
      order.items.length === 0 ||
      order.payment?.status === PaymentStatus.FAILED ||
      order.payment?.status === PaymentStatus.EXPIRED ||
      order.payment?.status === PaymentStatus.REFUNDED ||
      (order.status === OrderStatus.PENDING && order.payment?.status === PaymentStatus.UNPAID);

    if (!canDelete) return;

    const shippingAddressId = order.shippingAddressId;
    const canDeleteAddress = Boolean(order.shippingAddress && !order.shippingAddress.userId);

    for (const item of order.items) {
      if (!item.variantId) continue;

      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true },
      });

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });

      if (variant) {
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            orderId: order.id,
            type: StockMovementType.RETURN,
            quantity: item.quantity,
            stockBefore: variant.stock,
            stockAfter: variant.stock + item.quantity,
            note: `Stok dikembalikan dari hapus order ${order.orderNumber}`,
          },
        });
      }
    }

    await tx.order.delete({ where: { id } });

    if (shippingAddressId && canDeleteAddress) {
      const remainingOrders = await tx.order.count({ where: { shippingAddressId } });
      if (remainingOrders === 0) {
        await tx.shippingAddress.delete({ where: { id: shippingAddressId } });
      }
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pesanan");
  revalidatePath("/pesanan");
  await writeAdminAudit({ action: AdminAuditAction.DELETE, entity: "Order", entityId: id, summary: "Hapus order bermasalah dan kembalikan stok" });
  await setFlashToast("Order bermasalah berhasil dihapus jika memenuhi syarat.");
}
