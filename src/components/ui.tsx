import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Loader2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useApp, type Toast } from "../lib/store";

/* ------------------------------------------------------------------ *
 *  Button
 * ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "subtle";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "accent-grad text-white shadow-[0_14px_30px_-14px_var(--accent)] hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface-3/80 text-ink border border-line-strong hover:bg-surface-3 hover:border-accent/40",
  outline: "border border-line-strong text-ink hover:border-accent/60 hover:bg-accent/5",
  ghost: "text-muted hover:text-ink hover:bg-surface-2/80",
  subtle: "accent-soft hover:brightness-110",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const SIZES: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-[11px] gap-1.5 rounded-lg",
  sm: "h-9 px-3.5 text-[13px] gap-2 rounded-xl",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2.5 rounded-2xl",
  icon: "h-9 w-9 justify-center rounded-xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "sm",
  icon: Icon,
  trailingIcon: Trailing,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-200 select-none",
        "disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        Icon && <Icon className={size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
      {children}
      {Trailing && <Trailing className="h-3.5 w-3.5 opacity-70" />}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 *  Superfícies
 * ------------------------------------------------------------------ */

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padded?: boolean;
}

export function Panel({ hover, padded = true, className, children, ...rest }: PanelProps) {
  return (
    <div
      {...rest}
      className={cn("panel", padded && "p-5", hover && "hover-lift", className)}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl accent-soft">
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
        <div>
          <h2 className="font-display text-[15px] font-semibold tracking-tight sm:text-base">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  accent,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-line bg-surface/60 p-5 backdrop-blur-xl sm:p-7">
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl opacity-30"
        style={{ background: accent ?? "var(--accent)" }}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          {eyebrow && (
            <p className="label-xs mb-2 flex items-center gap-2">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 *  Dados
 * ------------------------------------------------------------------ */

export function Badge({
  children,
  color,
  className,
  dot,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        !color && "bg-surface-3/70 text-muted border border-line",
        className,
      )}
      style={
        color
          ? {
              background: `color-mix(in oklab, ${color} 16%, transparent)`,
              color: `color-mix(in oklab, ${color} 88%, var(--ink))`,
              border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
            }
          : undefined
      }
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color ?? "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  tone = "accent",
  spark,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  delta?: number;
  tone?: string;
  spark?: number[];
}) {
  const toneColor = tone.startsWith("#") ? tone : `var(--${tone})`;
  return (
    <Panel hover padded={false} className="group relative overflow-hidden p-4 sm:p-5">
      <div
        className="pointer-events-none absolute inset-x-0 -top-16 h-32 opacity-[0.16] blur-2xl transition-opacity group-hover:opacity-25"
        style={{ background: `radial-gradient(closest-side, ${toneColor}, transparent)` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-xs truncate">{label}</p>
          <p className="num mt-2 font-display text-[22px] leading-none font-bold tracking-tight sm:text-[26px]">
            {value}
          </p>
        </div>
        {Icon && (
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
            style={{
              background: `color-mix(in oklab, ${toneColor} 14%, transparent)`,
              borderColor: `color-mix(in oklab, ${toneColor} 28%, transparent)`,
              color: toneColor,
            }}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="relative mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11.5px] text-muted">
          {typeof delta === "number" && (
            <span
              className={cn(
                "num inline-flex items-center gap-0.5 font-semibold",
                delta >= 0 ? "text-positive" : "text-danger",
              )}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}%
            </span>
          )}
          {hint && <span className="truncate">{hint}</span>}
        </div>
        {spark && spark.length > 1 && <Sparkline data={spark} color={toneColor} />}
      </div>
    </Panel>
  );
}

export function Sparkline({
  data,
  color = "var(--accent)",
  width = 68,
  height = 24,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`)
    .join(" ");
  const id = React.useId();
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#${id})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Progress({
  value,
  max = 100,
  color = "var(--accent)",
  height = 6,
  className,
  striped,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  className?: string;
  striped?: boolean;
}) {
  const percent = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-surface-3/70", className)}
      style={{ height }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn("h-full rounded-full", striped && "animate-shimmer")}
        style={{
          background: striped
            ? `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 40%, white), ${color})`
            : `linear-gradient(90deg, color-mix(in oklab, ${color} 70%, transparent), ${color})`,
          backgroundSize: striped ? "200% 100%" : undefined,
          boxShadow: `0 0 14px -2px color-mix(in oklab, ${color} 60%, transparent)`,
        }}
      />
    </div>
  );
}

export function Ring({
  value,
  max = 100,
  size = 132,
  thickness = 11,
  color = "var(--accent)",
  label,
  sub,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: React.ReactNode;
  sub?: string;
}) {
  const percent = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const id = React.useId();
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span className="num font-display text-2xl font-bold tracking-tight">{label}</span>
        {sub && <span className="label-xs mt-1">{sub}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Formulários
 * ------------------------------------------------------------------ */

const fieldBase =
  "w-full rounded-xl border border-line bg-surface-2/70 px-3 py-2 text-[13.5px] text-ink outline-none transition placeholder:text-faint focus:border-accent/60 focus:bg-surface-2 focus:ring-4 focus:ring-accent/10";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} {...props} className={cn(fieldBase, "h-10", className)} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} {...props} className={cn(fieldBase, "min-h-[84px] resize-y", className)} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      {...props}
      className={cn(fieldBase, "h-10 cursor-pointer appearance-none pr-9", className)}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-faint" />
  </div>
));
Select.displayName = "Select";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="label-xs mb-1.5 block">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-faint">{hint}</span>}
    </label>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string; icon?: LucideIcon }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-line bg-surface-2/60 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((o) => o.value).join("-")}`}
                className="absolute inset-0 rounded-lg border border-line-strong bg-surface-3"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string; count?: number }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("hide-scroll flex gap-1 overflow-x-auto", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative rounded-xl px-3.5 py-2 text-[12.5px] font-semibold whitespace-nowrap transition-colors",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-${options.map((o) => o.value).join("-")}`}
                className="absolute inset-0 rounded-xl border border-line-strong bg-surface-2"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {option.label}
              {typeof option.count === "number" && (
                <span className="num rounded-md bg-surface-3 px-1.5 py-0.5 text-[10.5px] text-muted">
                  {option.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <span className="min-w-0">
        {label && <span className="block text-[13.5px] font-semibold">{label}</span>}
        {hint && <span className="mt-0.5 block text-[11.5px] text-muted">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-transparent accent-grad" : "border-line bg-surface-3",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm",
            checked ? "left-[26px]" : "left-0.5",
          )}
          style={{ height: 18, width: 18 }}
        />
      </span>
    </button>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[22px] items-center justify-center rounded-md border border-line-strong bg-surface-3 px-1.5 py-0.5 font-sans text-[10.5px] font-semibold text-muted">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ *
 *  Overlays
 * ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" }[size];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "relative my-auto w-full rounded-3xl border border-line bg-surface shadow-[var(--shadow-pop)]",
              width,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div>
                <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
                {description && (
                  <p className="mt-1 text-[12.5px] text-muted">{description}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line p-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-2xl border border-danger/25 bg-danger/10 p-4 text-[13px] text-muted">
        <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
        Esta ação não pode ser desfeita.
      </div>
    </Modal>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-2/40 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl accent-soft">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-sm font-semibold">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Toasts
 * ------------------------------------------------------------------ */

export function ToastViewport() {
  const { toasts, dismiss } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
      <AnimatePresence>
        {toasts.map((toast: Toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="pointer-events-auto w-full max-w-sm rounded-2xl border border-line bg-surface/95 p-4 shadow-[var(--shadow-pop)] backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  toast.tone === "error"
                    ? "bg-danger"
                    : toast.tone === "success"
                      ? "bg-positive"
                      : "accent-grad",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-[12px] leading-snug text-muted">{toast.description}</p>
                )}
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      dismiss(toast.id);
                    }}
                    className="mt-2 text-[12px] font-semibold text-accent hover:underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-faint transition-colors hover:text-ink"
                aria-label="Fechar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Gráficos auxiliares
 * ------------------------------------------------------------------ */

export function MiniBars({
  data,
  color = "var(--accent)",
  height = 40,
  labels,
}: {
  data: number[];
  color?: string;
  height?: number;
  labels?: string[];
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((value, index) => (
        <div key={index} className="group flex flex-1 flex-col items-center justify-end gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(3, (value / max) * (height - 10))}px` }}
            transition={{ duration: 0.6, delay: index * 0.02, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-md transition-opacity group-hover:opacity-80"
            style={{ background: color, opacity: 0.35 + (value / max) * 0.65 }}
            title={labels?.[index]}
          />
        </div>
      ))}
    </div>
  );
}

export function HeatGrid({
  cells,
  columns = 14,
  onToggle,
  color = "var(--accent)",
  legend,
}: {
  cells: Array<{ key: string; value: number; label?: string }>;
  columns?: number;
  onToggle?: (key: string) => void;
  color?: string;
  legend?: [string, string];
}) {
  return (
    <div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, index) => (
          <motion.button
            key={cell.key}
            type="button"
            disabled={!onToggle}
            onClick={() => onToggle?.(cell.key)}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.002, 0.4) }}
            title={cell.label}
            className={cn(
              "aspect-square rounded-[5px] border transition-transform",
              onToggle && "cursor-pointer hover:scale-110",
            )}
            style={{
              background:
                cell.value > 0
                  ? `color-mix(in oklab, ${color} ${Math.min(18 + cell.value * 22, 100)}%, transparent)`
                  : "var(--surface-3)",
              borderColor: cell.value > 0 ? `color-mix(in oklab, ${color} 40%, transparent)` : "var(--line)",
            }}
          />
        ))}
      </div>
      {legend && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-faint">
          <span>{legend[0]}</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="h-2.5 w-2.5 rounded-[4px] border border-line"
              style={{
                background:
                  level === 0
                    ? "var(--surface-3)"
                    : `color-mix(in oklab, ${color} ${18 + level * 20}%, transparent)`,
              }}
            />
          ))}
          <span>{legend[1]}</span>
        </div>
      )}
    </div>
  );
}
