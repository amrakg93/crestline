"use client";

import Link from "next/link";
import { BookOpen, Lightbulb, Zap, ArrowRight, Globe, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="w-full max-w-2xl mx-auto text-center py-10 sm:py-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-6">
          <Globe className="w-3.5 h-3.5" />
          IGCSE &middot; O-Level &middot; Secondary School Worldwide
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-5">
          Climb to the Top{" "}
          <span className="text-gradient">in Science &amp; Maths</span>
        </h1>

        <p className="text-sm sm:text-lg text-muted leading-relaxed mb-8 max-w-md mx-auto">
          Structured walkthroughs, expert tips, and practice questions — built for
          secondary school students who want to truly understand, not just memorise.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard" className="btn-primary w-full sm:w-auto text-sm sm:text-base">
            Start Learning
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            Free &middot; No sign-up required
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="w-full max-w-sm sm:max-w-lg mx-auto grid grid-cols-3 gap-3 mb-12 animate-slide-up">
        {[
          { value: "5", label: "Subjects" },
          { value: "348", label: "Topics" },
          { value: "3", label: "Year Groups" },
        ].map((s) => (
          <div key={s.label} className="card text-center py-4 sm:py-5">
            <div className="text-2xl sm:text-3xl font-extrabold text-accent tabular-nums">{s.value}</div>
            <div className="text-[11px] sm:text-xs text-muted mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Feature cards */}
      <section className="w-full max-w-[900px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        <FeatureCard
          icon={<BookOpen className="w-5 h-5" />}
          color="#22d3ee"
          title="Concept-First Walkthroughs"
          description="Prerequisite-aware learning paths that build understanding from first principles — not rote memorisation."
        />
        <FeatureCard
          icon={<Lightbulb className="w-5 h-5" />}
          color="#a855f7"
          title="Expert Tips & Tricks"
          description="Time-saving shortcuts and common pitfalls — exactly what top students know that others don't."
        />
        <FeatureCard
          icon={<Zap className="w-5 h-5" />}
          color="#f59e0b"
          title="Track Your Progress"
          description="Earn streaks and badges as you work through topics. See exactly how far you've come."
        />
      </section>
    </div>
  );
}

function FeatureCard({
  icon, color, title, description,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card text-left hover:border-accent/20 transition-all duration-300 group">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 group-hover:scale-110"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
      <p className="text-xs text-muted leading-relaxed">{description}</p>
    </div>
  );
}
