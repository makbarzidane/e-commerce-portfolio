"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProductImageFieldProps = {
  defaultValue?: string;
  form?: string;
  name?: string;
  placeholder?: string;
};

export function ProductImageField({
  defaultValue = "/images/products/pashmina-rose.svg",
  form,
  name = "imageUrl",
  placeholder = "/images/products/pashmina-rose.svg",
}: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(defaultValue);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function uploadSelectedFile() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setMessage("Pilih file gambar terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/admin/upload/image", {
        method: "POST",
        body: payload,
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Upload gagal.");
        window.dispatchEvent(new CustomEvent("zimeira:toast", { detail: { tone: "error", message: result.error ?? "Upload gambar gagal." } }));
        return;
      }

      setImageUrl(result.url);
      setMessage("Upload berhasil. URL gambar sudah terisi.");
      window.dispatchEvent(new CustomEvent("zimeira:toast", { detail: { tone: "success", message: "Upload gambar berhasil." } }));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Input form={form} name={name} value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder={placeholder} />
      <div className="flex flex-wrap items-center gap-2">
        <Input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="max-w-64" />
        <Button type="button" variant="outline" onClick={uploadSelectedFile} disabled={isPending}>
          <Upload data-icon="inline-start" />
          {isPending ? "Upload..." : "Upload"}
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
