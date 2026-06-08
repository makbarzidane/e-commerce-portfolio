"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingLabel?: string;
};

export function SubmitButton({ children, pendingLabel = "Menyimpan...", disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} disabled={disabled || pending}>
      {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}

type ConfirmSubmitButtonProps = SubmitButtonProps & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({ confirmMessage, onClick, ...props }: ConfirmSubmitButtonProps) {
  return (
    <SubmitButton
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    />
  );
}
