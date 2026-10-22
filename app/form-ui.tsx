"use client";
import { useId, type ReactNode, type ReactElement, cloneElement, isValidElement } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
export function Heading({ title, children }: { title: string; children: ReactNode }) { return <div className="page-intro"><div><h1>{title}</h1><p>{children}</p></div></div>; }
export function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="form-card"><div className="section-heading"><h2>{title}</h2></div>{children}</section>; }
export function InputField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactElement }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}{required && <span> *</span>}</label>{isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, { id, "aria-describedby": hint ? `${id}-help` : undefined }) : children}{hint && <small id={`${id}-help`}>{hint}</small>}</div>;
}
export function Notice({ message, success = false }: { message: string; success?: boolean }) { if (!message) return null; return <div className={success ? "saved-message" : "error-summary"} role={success ? "status" : "alert"}>{success ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}<span>{message}</span></div>; }
export function Facts({ items }: { items: [string, ReactNode][] }) { return <dl className="context-facts">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>; }
export function fileError(file: File, limit = 10) { return file.size > limit * 1024 * 1024 ? `Files must be ${limit} MB or smaller.` : !["image/jpeg", "image/png", "application/pdf"].includes(file.type) ? "Use a PDF, JPG, or PNG file." : ""; }
