"use server";

import { AdminAuditAction } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

type AuditInput = {
  action: AdminAuditAction;
  entity: string;
  entityId?: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAdminAudit(input: AuditInput) {
  try {
    const session = await getServerSession(authOptions);

    await getPrisma().adminAuditLog.create({
      data: {
        actorId: session?.user?.id,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        summary: input.summary,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.warn("[admin-audit]", input.summary, error);
  }
}
