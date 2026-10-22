"use client";

import { Building2, ChevronRight, CalendarDays, Menu, UserRoundPlus, ShieldCheck, UserPlus, X } from "lucide-react";
import { type ReactNode, useState } from "react";
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
  const active = views.find((item) => item.id === view)!;

  const chooseView = (next: View) => {
    setView(next);
    setMobileNav(false);
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`} aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={25} strokeWidth={2.4} /></div>
          <div><strong>Red Eagle</strong><span>Security Services</span></div>
          <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <nav className="nav-stack">
          <span className="nav-label">Management</span>
          {views.map((item) => (
            <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => chooseView(item.id)}>
              {item.icon}<span>{item.label}</span>{view === item.id && <ChevronRight size={15} className="nav-arrow" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer"><span className="sidebar-company">Red Eagle Counterforce</span></div>
      </aside>

      {mobileNav && <button className="sidebar-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation overlay" />}

      <section className="workspace">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="crumbs"><span>{active.eyebrow}</span><ChevronRight size={14} /><strong>{active.label}</strong></div>
          <div className="top-actions">
            <div className="user-menu"><div className="avatar">JM</div><div><strong>Jamie Mendoza</strong><span>{view === "applicant" ? "Human Resources" : view === "staff" ? "Super Admin" : "Operations"}</span></div></div>
          </div>
        </header>

        <div className="content-area">
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
