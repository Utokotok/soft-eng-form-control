"use client";

import { Building2, ChevronRight, CalendarDays, Menu, UserRoundPlus, ShieldCheck, UserPlus, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { RecruitmentForm } from "./recruitment-form";
import { StaffRegistrationForm } from "./staff-registration";
import { DeploymentForm, ClientSiteForm } from "./operations-forms";

type View = "staff" | "applicant" | "deployment" | "clients";

const views: Array<{ id: View; label: string; eyebrow: string; icon: ReactNode }> = [
  { id: "applicant", label: "Applicant intake", eyebrow: "Human resources", icon: <UserPlus size={18} /> },
  { id: "staff", label: "Staff registration", eyebrow: "Administration", icon: <UserRoundPlus size={18} /> },
  { id: "deployment", label: "Deployment & scheduling", eyebrow: "Operations", icon: <CalendarDays size={18} /> },
  { id: "clients", label: "Client & site registration", eyebrow: "Operations", icon: <Building2 size={18} /> },
];

export default function Home() {
  const [view, setView] = useState<View>("staff");
  const [mobileNav, setMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const viewChanged = useRef(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => { setIsMobile(media.matches); if (!media.matches) setMobileNav(false); };
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => { if (viewChanged.current) document.querySelector<HTMLElement>("h1")?.focus(); }, [view]);
  useEffect(() => {
    if (!isMobile || !mobileNav) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLElement>("button")?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isMobile, mobileNav]);
  function closeNav() { setMobileNav(false); requestAnimationFrame(() => menuButton.current?.focus()); }
  const active = views.find((item) => item.id === view)!;

  const chooseView = (next: View) => {
    viewChanged.current = true;
    setView(next);
    setMobileNav(false);
    if (view === next) requestAnimationFrame(() => document.querySelector<HTMLElement>("h1")?.focus());
  };

  return (
    <main className="app-shell">
      <a className="skip-link" href="#form-content">Skip to form</a>
      <aside ref={sidebar} id="primary-navigation" inert={isMobile && !mobileNav} aria-hidden={isMobile && !mobileNav ? true : undefined} className={`sidebar ${mobileNav ? "sidebar-open" : ""}`} aria-label="Primary navigation" onKeyDown={event => {
        if (!isMobile || !mobileNav) return;
        if (event.key === "Escape") { event.preventDefault(); closeNav(); }
        if (event.key === "Tab") {
          const buttons = sidebar.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
          if (!buttons?.length) return;
          const first = buttons[0], last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={25} strokeWidth={2.4} /></div>
          <div><strong>Red Eagle</strong><span>Security Services</span></div>
          <button className="mobile-close" onClick={closeNav} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <nav className="nav-stack">
          <span className="nav-label">Management</span>
          {views.map((item) => (
            <button key={item.id} aria-current={view === item.id ? "page" : undefined} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => chooseView(item.id)}>
              {item.icon}<span>{item.label}</span>{view === item.id && <ChevronRight size={15} className="nav-arrow" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer"><span className="sidebar-company">Red Eagle Counterforce</span></div>
      </aside>

      {mobileNav && <button className="sidebar-scrim" tabIndex={-1} onClick={closeNav} aria-label="Close navigation overlay" />}

      <section className="workspace" inert={isMobile && mobileNav}>
        <header className="topbar">
          <button ref={menuButton} className="menu-button" aria-expanded={mobileNav} aria-controls="primary-navigation" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="crumbs"><span>{active.eyebrow}</span><ChevronRight size={14} /><strong>{active.label}</strong></div>
          <div className="top-actions">
            <div className="user-menu"><div className="avatar">JM</div><div><strong>Jamie Mendoza</strong><span>{view === "applicant" ? "Human Resources" : view === "staff" ? "Super Admin" : "Operations"}</span></div></div>
          </div>
        </header>

        <div id="form-content" tabIndex={-1} className="content-area">
          <div className="mobile-view-switcher" aria-label="Choose form">
            {views.map((item) => <button key={item.id} className={view === item.id ? "selected" : ""} onClick={() => chooseView(item.id)}>{item.icon}<span>{item.label}</span></button>)}
          </div>
          {view === "staff" && <StaffRegistrationForm />}
          {view === "applicant" && <RecruitmentForm />}
          {view === "deployment" && <DeploymentForm />}
          {view === "clients" && <ClientSiteForm />}
        </div>
      </section>
    </main>
  );
}
