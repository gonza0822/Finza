import { AlertCircle } from "lucide-react";
import { proyeccionContent } from "@/lib/content/proyeccion";

interface NegativeProjectionAlertProps {
  currencies: string[];
}

/** Warns when projected account cash goes below zero in the horizon. */
export function NegativeProjectionAlert({ currencies }: NegativeProjectionAlertProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-3xl border border-warm/30 bg-cream px-5 py-4"
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-warm" aria-hidden />
      <div>
        <p className="font-semibold text-foreground">{proyeccionContent.negativeTitle}</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          {proyeccionContent.negativeBody(currencies)}
        </p>
      </div>
    </div>
  );
}
