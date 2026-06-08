import { cookies } from "next/headers";

export async function setFlashToast(message: string, tone: "success" | "error" | "info" = "success") {
  const cookieStore = await cookies();
  cookieStore.set("zimeira_toast", JSON.stringify({ message, tone }), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
  });
}
