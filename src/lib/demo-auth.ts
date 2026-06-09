import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const demoAuthCookie = "zimeira_demo_auth";
const demoPassword = "password123";

export const demoUsers = [
  {
    id: "demo-admin",
    name: "Admin Zimeira",
    email: "admin@zimeirahijab.test",
    role: "ADMIN" as const,
  },
  {
    id: "demo-customer",
    name: "Nadia Zimeira",
    email: "customer@zimeirahijab.test",
    role: "CUSTOMER" as const,
  },
];

type DemoAuthState = {
  registered?: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
  };
  reset?: {
    email: string;
    codeHash: string;
    expiresAt: string;
  };
  passwordOverrides?: Record<
    string,
    {
      id: string;
      name: string;
      passwordHash: string;
      role: "CUSTOMER" | "ADMIN";
    }
  >;
};

export async function getDemoCredentialsUser(email: string, password?: string) {
  if (process.env.DATABASE_URL || !password) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const state = await readDemoAuthState();
  const override = state.passwordOverrides?.[normalizedEmail];
  if (override && (await bcrypt.compare(password, override.passwordHash))) {
    return {
      id: override.id,
      name: override.name,
      email: normalizedEmail,
      role: override.role,
    };
  }

  if (state.registered?.email === normalizedEmail && (await bcrypt.compare(password, state.registered.passwordHash))) {
    return {
      id: state.registered.id,
      name: state.registered.name,
      email: state.registered.email,
      role: "CUSTOMER" as const,
    };
  }

  if (password === demoPassword) {
    return demoUsers.find((user) => user.email === normalizedEmail) ?? null;
  }

  return null;
}

export async function saveDemoRegisteredCustomer(input: { name: string; email: string; password: string }) {
  const state = await readDemoAuthState();
  const normalizedEmail = input.email.trim().toLowerCase();
  state.registered = {
    id: `demo-registered-${Buffer.from(normalizedEmail).toString("base64url").slice(0, 18)}`,
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(input.password, 10),
  };
  await writeDemoAuthState(state);
}

export async function createDemoResetCode(email: string) {
  const state = await readDemoAuthState();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  state.reset = {
    email: email.trim().toLowerCase(),
    codeHash: await bcrypt.hash(code, 10),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
  await writeDemoAuthState(state);
  return code;
}

export async function resetDemoPassword(email: string, code: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const state = await readDemoAuthState();
  const reset = state.reset;
  if (!reset || reset.email !== normalizedEmail || new Date(reset.expiresAt).getTime() < Date.now()) return false;
  if (!(await bcrypt.compare(code, reset.codeHash))) return false;

  const passwordHash = await bcrypt.hash(password, 10);
  if (state.registered?.email === normalizedEmail) {
    state.registered.passwordHash = passwordHash;
  } else {
    const builtin = demoUsers.find((user) => user.email === normalizedEmail);
    state.passwordOverrides = {
      ...(state.passwordOverrides ?? {}),
      [normalizedEmail]: {
        id: builtin?.id ?? `demo-reset-${Buffer.from(normalizedEmail).toString("base64url").slice(0, 18)}`,
        name: builtin?.name ?? "Customer Zimeira",
        role: builtin?.role ?? "CUSTOMER",
        passwordHash,
      },
    };
  }

  delete state.reset;
  await writeDemoAuthState(state);
  return true;
}

async function readDemoAuthState(): Promise<DemoAuthState> {
  const cookieStore = await cookies();
  const value = cookieStore.get(demoAuthCookie)?.value;
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as DemoAuthState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeDemoAuthState(state: DemoAuthState) {
  const cookieStore = await cookies();
  cookieStore.set(demoAuthCookie, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}
