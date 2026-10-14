import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-sm border border-paper-line bg-paper-card shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-paper-line px-5 py-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-faint">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-deep">
          EduManage Ledger
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Button({
  children, onClick, type = "button", variant = "primary", disabled, className = "",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-forest text-paper hover:bg-forest-deep shadow-ledger",
    secondary: "border border-forest/30 bg-paper-card text-forest hover:bg-forest-mist",
    ghost: "text-forest hover:bg-forest-mist",
    danger: "bg-ledger-red text-white hover:opacity-90",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-sm px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-sm border border-paper-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15";

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "green" | "red" | "amber" | "gold"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    neutral: "border-paper-line bg-paper-deep text-ink-soft",
    green: "border-ledger-green/30 bg-ledger-green/10 text-ledger-green",
    red: "border-ledger-red/30 bg-ledger-red/10 text-ledger-red",
    amber: "border-ledger-amber/30 bg-ledger-amber/10 text-ledger-amber",
    gold: "border-gold-deep/40 bg-gold-mist text-gold-deep",
  };
  return <span className={`stamp border ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-display text-lg italic text-ink-faint">{title}</p>
      {body && <p className="mt-1 text-sm text-ink-faint">{body}</p>}
    </div>
  );
}

export function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`border-b border-paper-line bg-paper-deep/70 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`border-b border-paper-line/70 px-4 py-3 text-sm text-ink ${className}`}>{children}</td>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-paper-line border-t-forest" />
    </div>
  );
}
