import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type PaginationControlsProps = {
  basePath: string;
  page: number;
  hasNext: boolean;
  params: Record<string, string | undefined>;
};

export function PaginationControls({ basePath, page, hasNext, params }: PaginationControlsProps) {
  const previousHref = buildHref(basePath, params, Math.max(1, page - 1));
  const nextHref = buildHref(basePath, params, page + 1);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Halaman {page}</p>
      <div className="flex gap-2">
        <Link
          href={previousHref}
          aria-disabled={page <= 1}
          className={buttonVariants({
            variant: "outline",
            className: page <= 1 ? "pointer-events-none opacity-50" : "",
          })}
        >
          Previous
        </Link>
        <Link
          href={nextHref}
          aria-disabled={!hasNext}
          className={buttonVariants({
            variant: "outline",
            className: !hasNext ? "pointer-events-none opacity-50" : "",
          })}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  searchParams.set("page", String(page));
  return `${basePath}?${searchParams.toString()}`;
}
