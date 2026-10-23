"use client";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type ReactElement, cloneElement, isValidElement } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
export function Heading({ title, children }: { title: string; children: ReactNode }) { return <div className="page-intro"><div><h1 tabIndex={-1}>{title}</h1><p>{children}</p></div></div>; }
export function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="form-card"><div className="section-heading"><h2 tabIndex={-1}>{title}</h2></div>{children}</section>; }
export function InputField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactElement }) {
  const id = useId();
  const [invalid, setInvalid] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  useEffect(() => {
    const input = inputRef.current, form = input?.form;
    const reset = () => { input?.setCustomValidity(""); setInvalid(""); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);
  const props = children.props as { type?: string; required?: boolean; placeholder?: string; maxLength?: number; onInput?: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; onInvalid?: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; "aria-invalid"?: boolean };
  const isRequired = required || props.required;
  const type = props.type || "text";
  const textControl = children.type === "textarea" || (children.type === "input" && ["text", "email", "tel", "password", "search", "url"].includes(type));
  const help = invalid || hint || (type === "datetime-local" ? "Philippine time (UTC+8)." : type === "date" ? "Choose a valid calendar date." : children.type === "select" ? "Choose an option from the list." : type === "file" ? "Choose the required document." : "");
  const control = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, {
    id, ref: inputRef, required: Boolean(isRequired), "aria-required": Boolean(isRequired), "aria-invalid": Boolean(invalid || props["aria-invalid"]), "aria-describedby": help ? `${id}-help` : undefined,
    ...(textControl ? { placeholder: props.placeholder || `Enter ${label.toLowerCase()}${isRequired ? "" : " (optional)"}`, maxLength: props.maxLength ?? (children.type === "textarea" ? 1000 : 120) } : {}),
    onInvalid: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setInvalid(event.currentTarget.validationMessage); props.onInvalid?.(event); },
    onInput: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const input = event.currentTarget;
      input.setCustomValidity(isRequired && textControl && input.value && !input.value.trim() ? "Enter a value, not only spaces." : "");
      setInvalid(""); props.onInput?.(event);
    },
  }) : children;
  return <div className={`field${invalid ? " field-error" : ""}`}><label htmlFor={id}>{label}{isRequired && <span> *</span>}</label>{control}{help && <small className={invalid ? "error-text" : undefined} id={`${id}-help`}>{help}</small>}</div>;
}
export function Notice({ message }: { message: string }) {
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => { if (message) summary.current?.focus(); }, [message]);
  if (!message) return null;
  return <div ref={summary} tabIndex={-1} className="error-summary" role="alert"><XCircle size={18}/><span>{message}</span></div>;
}
export function SuccessDialog({ message, title = "Saved successfully", onDismiss, children }: { message: string; title?: string; onDismiss: () => void; children?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!message || !element) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close(); document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => {
        if (document.querySelector("dialog[open]")) return;
        if (previousFocus?.isConnected && previousFocus !== document.body && !previousFocus.matches(":disabled") && !previousFocus.closest("[inert]")) previousFocus.focus();
        else document.querySelector<HTMLElement>("h1")?.focus();
      });
    };
  }, [message]);
  return <dialog ref={dialog} className="success-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`} onCancel={event => { event.preventDefault(); onDismiss(); }}>
    <div className="success-dialog-icon"><CheckCircle2 size={28} aria-hidden="true"/></div>
    <h2 id={`${id}-title`}>{title}</h2>
    <p id={`${id}-message`}>{message}</p>
    {children && <div className="success-dialog-details">{children}</div>}
    <div className="success-dialog-actions"><button type="button" autoFocus className="button primary" onClick={onDismiss}>Done</button></div>
  </dialog>;
}
export function Facts({ items }: { items: [string, ReactNode][] }) { return <dl className="context-facts">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>; }
