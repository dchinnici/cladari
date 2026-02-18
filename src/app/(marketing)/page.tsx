"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  Leaf,
  Dna,
  Database,
  BookOpen,
  Shield,
  ArrowRight,
  ChevronDown,
  Microscope,
  GitBranch,
  Sprout,
  Globe,
  Mail,
  Brain,
  Camera,
  Droplets,
  Gauge,
  Target,
} from "lucide-react";

// ── Cladari brand tokens ─────────────────────────
const brand = {
  forest: "#1a3a2f",
  forestLight: "#2a5a45",
  cream: "#faf6f0",
  bark: "#8b7355",
  clay: "#c4956a",
  moss: "#5a7a5a",
  mossLight: "#6d946d",
};

const serif = "var(--font-fraunces), 'Fraunces', serif";
const sans = "var(--font-outfit), 'Outfit', -apple-system, system-ui, sans-serif";

// ── Navigation ───────────────────────────────────
function Nav({ activeSection, isLoggedIn }: { activeSection: string; isLoggedIn: boolean }) {
  const links = [
    { id: "mission", label: "Mission" },
    { id: "platform", label: "Platform" },
    { id: "sovria", label: "Sovria" },

    { id: "research", label: "Research" },
    { id: "blog", label: "Journal" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        backgroundColor: "rgba(250, 246, 240, 0.95)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(139, 115, 85, 0.15)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: brand.forest }}
          >
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span
            className="text-xl"
            style={{ color: brand.forest, fontWeight: 600, fontFamily: sans, letterSpacing: "0.02em" }}
          >
            Cladari
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="text-sm transition-colors"
              style={{
                color: activeSection === l.id ? brand.forest : brand.bark,
                fontWeight: activeSection === l.id ? 600 : 400,
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {isLoggedIn ? (
          <Link href="/dashboard">
            <Button
              size="sm"
              className="text-sm"
              style={{ backgroundColor: brand.forest, color: "#fff" }}
            >
              Go to Dashboard
            </Button>
          </Link>
        ) : (
          <a href="#waitlist">
            <Button
              size="sm"
              className="text-sm"
              style={{ backgroundColor: brand.forest, color: "#fff" }}
            >
              Request Access
            </Button>
          </a>
        )}
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────
function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section
      id="mission"
      className="pt-32 pb-20 px-6"
      style={{ backgroundColor: brand.cream }}
    >
      <div className="max-w-4xl mx-auto">
        <h1
          className="text-4xl md:text-5xl lg:text-6xl mb-6"
          style={{
            color: brand.forest,
            fontFamily: serif,
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          We&apos;re losing biological knowledge
          <br />
          faster than we&apos;re creating it.
        </h1>

        <p
          className="text-lg md:text-xl leading-relaxed mb-10 max-w-3xl"
          style={{ color: brand.bark, lineHeight: 1.7 }}
        >
          Cladari turns plant care into biological knowledge — structured,
          verified, and built to last.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="gap-2"
                style={{ backgroundColor: brand.forest, color: "#fff" }}
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <a href="#waitlist">
              <Button
                size="lg"
                className="gap-2"
                style={{ backgroundColor: brand.forest, color: "#fff" }}
              >
                Join the Beta <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          )}
          <a
            href="#platform"
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: brand.moss }}
          >
            See How It Works <ChevronDown className="w-4 h-4" />
          </a>
        </div>

        <p
          className="text-sm"
          style={{ color: brand.bark, opacity: 0.7 }}
        >
          Biological documentation infrastructure for conservation breeding and genetic research.
        </p>
      </div>
    </section>
  );
}

// ── The Problem ──────────────────────────────────
function ProblemSection() {
  const gaps = [
    {
      icon: BookOpen,
      title: "Classification is shifting",
      desc: "DNA phylogenetics is proving most morphology-based sections aren\u2019t monophyletic.",
    },
    {
      icon: Microscope,
      title: "Phenotype lacks context",
      desc: "Herbarium sheets can\u2019t tell you how a plant responds to cultivation.",
    },
    {
      icon: Shield,
      title: "Provenance evaporates",
      desc: "A plant gets traded, divided, relabeled. Within two generations, nobody can verify what it is.",
    },
  ];

  return (
    <section className="py-16 px-6" style={{ backgroundColor: "#f5f2ed" }}>
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-2xl md:text-3xl mb-10"
          style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
        >
          The genus <em>Anthurium</em> is being reclassified in real time.
          <br />
          The tools haven&apos;t caught up.
        </h2>

        <div className="space-y-4">
          {gaps.map((g, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-lg"
              style={{ backgroundColor: brand.cream }}
            >
              <g.icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: brand.moss }} />
              <p className="text-sm leading-relaxed" style={{ color: brand.forest }}>
                <strong>{g.title}</strong>
                <span style={{ color: brand.bark }}> — {g.desc}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ─────────────────────────────────
function HowItWorksSection() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const cards = [
    {
      icon: Camera,
      title: "Photo documentation",
      detail: "Growth, leaf condition, flowering — timestamped and tied to the individual plant. Anatomical tagging classifies each image for ML analysis.",
    },
    {
      icon: Droplets,
      title: "Care logging",
      detail: "Watering, fertilizing, repotting, treatments — tap and go. EC/pH substrate chemistry tracked per specimen over time.",
    },
    {
      icon: GitBranch,
      title: "Breeding pipeline",
      detail: "Crosses, harvests, seed batches, selections — the full chain with documented parentage and generation tracking.",
    },
    {
      icon: Shield,
      title: "Provenance tracking",
      detail: "Continuous documentation chains that verify identity through narrative, not claims. QR-linked records that travel with the plant.",
    },
  ];

  return (
    <section className="py-20 px-6" style={{ backgroundColor: brand.cream }}>
      <div className="max-w-5xl mx-auto">
        <span
          className="text-xs tracking-widest uppercase mb-4 block"
          style={{ color: brand.moss, fontWeight: 600 }}
        >
          How It Works
        </span>
        <h2
          className="text-2xl md:text-3xl mb-4"
          style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
        >
          You take care of your plants.
          <br />
          Cladari takes care of the data.
        </h2>
        <p className="text-base mb-10 max-w-2xl" style={{ color: brand.bark }}>
          Every interaction becomes structured, timestamped, queryable data —
          building phenotypic datasets, environmental correlations, and breeding
          intelligence over time.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => setExpandedCard(expandedCard === i ? null : i)}
              className="text-left rounded-xl p-5 transition-all duration-200"
              style={{
                backgroundColor: expandedCard === i ? brand.forest : "#f5f2ed",
                cursor: "pointer",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: expandedCard === i ? "rgba(250,246,240,0.1)" : `${brand.moss}18`,
                  }}
                >
                  <card.icon
                    className="w-4 h-4"
                    style={{ color: expandedCard === i ? brand.clay : brand.moss }}
                  />
                </div>
                <span
                  className="text-sm flex-1"
                  style={{
                    color: expandedCard === i ? brand.cream : brand.forest,
                    fontWeight: 600,
                  }}
                >
                  {card.title}
                </span>
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-200 flex-shrink-0"
                  style={{
                    color: expandedCard === i ? "rgba(250,246,240,0.5)" : brand.bark,
                    transform: expandedCard === i ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </div>
              {expandedCard === i && (
                <p
                  className="text-sm leading-relaxed mt-3 pl-12"
                  style={{ color: "rgba(250,246,240,0.7)" }}
                >
                  {card.detail}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── For Breeders ─────────────────────────────────
function BreederBlock() {
  const reveals = [
    "Which parent combinations produce specific outcomes",
    "How growing conditions influence expression",
    "Which lines consistently carry target traits",
  ];

  return (
    <section className="py-16 px-6" style={{ backgroundColor: "#f5f2ed" }}>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 items-start">
          <div className="md:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${brand.forest}10` }}
              >
                <Target className="w-5 h-5" style={{ color: brand.forest }} />
              </div>
              <span
                className="text-xs tracking-widest uppercase"
                style={{ color: brand.moss, fontWeight: 600 }}
              >
                For Breeders
              </span>
            </div>

            <h2
              className="text-2xl md:text-3xl mb-4"
              style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
            >
              Cladari doesn&apos;t just record your crosses.
              <br />
              It helps you design better ones.
            </h2>

            <p className="text-sm leading-relaxed mb-6" style={{ color: brand.bark }}>
              By tracking traits across generations and environments, Cladari reveals:
            </p>

            <div className="space-y-3 mb-8">
              {reveals.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: brand.moss }}
                  />
                  <span className="text-sm" style={{ color: brand.forest, fontWeight: 500 }}>
                    {r}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-sm leading-relaxed" style={{ color: brand.bark }}>
              Over time, breeding becomes less guesswork and more strategy.
            </p>
          </div>

          <div
            className="md:col-span-2 rounded-xl p-6"
            style={{ backgroundColor: brand.cream }}
          >
            <p
              className="text-lg leading-snug mb-4"
              style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
            >
              Fewer generations.
              <br />
              Clearer goals.
              <br />
              More intentional crosses.
            </p>
            <p className="text-sm" style={{ color: brand.bark, fontStyle: "italic" }}>
              A living cookbook for hybrid design.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Platform ─────────────────────────────────────
function PlatformSection() {
  const [activeTab, setActiveTab] = useState(0);

  const layers = [
    {
      icon: Database,
      tab: "Observation",
      title: "Continuous biological documentation",
      desc: "Every care event, morphological observation, flowering cycle, and environmental reading becomes structured, timestamped data. Not notes in a spreadsheet \u2014 queryable records with full context that accumulate into biological narratives.",
      details: [
        "Morphometric measurements tied to photographic evidence",
        "EC/pH substrate chemistry tracking per specimen",
        "Full breeding pipeline: pollination \u2192 harvest \u2192 seed batch \u2192 selection",
        "Photo classification with anatomical and intent tagging (leaf, root, pest evidence, emergence)",
      ],
    },
    {
      icon: GitBranch,
      tab: "Lineage",
      title: "Every specimen tells its full story",
      desc: "From pollination record through every division, trade, and generation \u2014 Cladari creates documentation chains that build over time. A plant with two years of structured history tells a story that counterfeiting cannot replicate.",
      details: [
        "Complete breeding records with maternal/paternal lineage",
        "Generation tracking: F1, F2, S1, backcross documentation",
        "Clone and division provenance chains",
        "Reference specimens for external parent documentation",
        "QR-linked records that travel with the plant",
      ],
    },
    {
      icon: Gauge,
      tab: "Environment",
      title: "Autonomous data collection, continuous context",
      desc: "Sensor plugins connect consumer and commercial hardware for autonomous environmental monitoring. Every data point is correlated with the care record \u2014 so when something changes in your collection, you can see exactly what the environment was doing.",
      details: [
        "Temperature, humidity, and VPD \u2014 continuous logging with stress event detection",
        "DLI (daily light integral) and PPFD \u2014 quantified light exposure, not guesswork",
        "CO\u2082 concentration \u2014 track supplementation impact on growth rates",
        "Barometric pressure \u2014 correlate atmospheric shifts with transpiration behavior",
        "Weather integration \u2014 precipitation, outdoor temp, UV index from local stations",
        "Plugin architecture \u2014 SensorPush, Ecowitt, Trolmaster, or any sensor with an API",
      ],
    },
  ];

  const active = layers[activeTab];

  return (
    <section id="platform" className="py-20 px-6" style={{ backgroundColor: brand.cream }}>
      <div className="max-w-5xl mx-auto">
        <span
          className="text-xs tracking-widest uppercase mb-4 block"
          style={{ color: brand.moss, fontWeight: 600 }}
        >
          The Platform
        </span>
        <h2
          className="text-2xl md:text-3xl mb-10"
          style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
        >
          What&apos;s under the hood
        </h2>

        {/* Segmented control */}
        <div
          className="inline-flex rounded-lg p-1 mb-10"
          style={{ backgroundColor: "#f5f2ed" }}
        >
          {layers.map((layer, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all duration-200"
              style={{
                backgroundColor: activeTab === i ? brand.forest : "transparent",
                color: activeTab === i ? "#fff" : brand.bark,
                fontWeight: activeTab === i ? 600 : 400,
                cursor: "pointer",
              }}
            >
              <layer.icon className="w-4 h-4" />
              {layer.tab}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <div className="grid md:grid-cols-5 gap-8 items-start">
          <div className="md:col-span-2">
            <h3
              className="text-xl mb-3"
              style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
            >
              {active.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: brand.bark }}>
              {active.desc}
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="rounded-xl p-6" style={{ backgroundColor: "#f5f2ed" }}>
              <ul className="space-y-3">
                {active.details.map((d, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: brand.moss }}
                    />
                    <span className="text-sm" style={{ color: brand.forest }}>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Sovria Section ───────────────────────────────
function SovriaSection() {
  return (
    <section id="sovria" className="py-16 px-6" style={{ backgroundColor: "#f5f2ed" }}>
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${brand.clay}15` }}
        >
          <Brain className="w-5 h-5" style={{ color: brand.clay }} />
        </div>
        <span
          className="text-xs tracking-widest uppercase mb-4 block"
          style={{ color: brand.clay, fontWeight: 600 }}
        >
          Powered by Sovria
        </span>
        <h2
          className="text-2xl md:text-3xl mb-6"
          style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
        >
          Domain-specific botanical AI
        </h2>
        <p className="text-base leading-relaxed mb-8" style={{ color: brand.bark }}>
          Sovria outperforms frontier models on taxonomic tasks — on a fraction of
          the compute. Private by default. Every insight traces back to documented
          observations, not probabilistic guesses.
        </p>

        <Button
          variant="outline"
          className="gap-2"
          style={{ borderColor: brand.clay, color: brand.clay }}
        >
          Learn more about Sovria <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}


// ── Research Vision ──────────────────────────────
function ResearchSection() {
  const questions = [
    "Can phenotypic clustering from photographic data identify misclassified taxa in mixed collections?",
    "How does Cardiolonchium blade morphology vary across elevation in cultivation vs. native habitat?",
    "Do intersectional F1 hybrids express spathe characteristics from the maternal or paternal parent?",
    "Can environmental stress signatures predict flowering periodicity in velvet-leaf species?",
    "What substrate chemistry profiles correlate with optimal growth across taxonomic sections?",
    "Where do morphology-based and DNA-based classifications diverge \u2014 and what does that mean for breeders?",
  ];

  const [activeQ, setActiveQ] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQ((prev) => (prev + 1) % questions.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [questions.length]);

  return (
    <section id="research" className="py-20 px-6" style={{ backgroundColor: "#f5f2ed" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <span
              className="text-xs tracking-widest uppercase mb-4 block"
              style={{ color: brand.moss, fontWeight: 600 }}
            >
              Research Vision
            </span>
            <h2
              className="text-2xl md:text-3xl mb-6"
              style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
            >
              Questions we can&apos;t answer yet —
              <br />
              but the data will let us.
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: brand.bark }}>
              Institutions are digitizing the dead. Cladari documents the living —
              how plants respond to cultivation, which traits emerge in hybrids,
              how phenotype shifts across environments. When structured data from
              living collections pairs with genomic markers, genuinely novel
              correlations become possible.
            </p>

            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: brand.cream }}>
              <Dna className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: brand.moss }} />
              <div>
                <p className="text-sm mb-1" style={{ color: brand.forest, fontWeight: 600 }}>
                  Future: Genomic Integration
                </p>
                <p className="text-xs leading-relaxed" style={{ color: brand.bark }}>
                  Nanopore sequencing will add DNA-based identity to the biological
                  biography — bridging what the genome says and what the plant shows.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: brand.moss, fontWeight: 600 }}
            >
              Questions the platform enables
            </p>

            {/* Single question display with rotation */}
            <div
              className="p-6 rounded-xl min-h-[120px] flex flex-col justify-center"
              style={{ backgroundColor: brand.cream }}
            >
              <span
                className="text-xs mb-3 block"
                style={{ color: brand.moss, fontWeight: 700, fontFamily: "monospace" }}
              >
                {String(activeQ + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
              </span>
              <p
                className="text-base leading-relaxed"
                style={{ color: brand.forest, fontFamily: serif }}
              >
                <em>{questions[activeQ]}</em>
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2 mt-4">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveQ(i)}
                  className="transition-all duration-200"
                  style={{
                    width: activeQ === i ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: activeQ === i ? brand.moss : `${brand.moss}30`,
                    cursor: "pointer",
                    border: "none",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Journal / Blog tease ─────────────────────────
function JournalSection() {
  const posts = [
    {
      tag: "Thesis",
      title: "Authenticity Isn\u2019t a State \u2014 It\u2019s a Story",
      excerpt:
        "Why continuous biological documentation is the only reliable framework for provenance verification in rare plant conservation. The Stream Protocol thesis.",
      date: "Coming soon",
    },
    {
      tag: "Conservation",
      title: "Breeding Pure Species in a Hybrid Market",
      excerpt:
        "The case for conservation-focused breeding programs that prioritize genetic integrity over novelty \u2014 and why pure species value is expected to increase.",
      date: "Coming soon",
    },
    {
      tag: "Data",
      title: "The Cardiolonchium Gap: What the Literature Reveals",
      excerpt:
        "147 taxa structured from published descriptions \u2014 but the most horticulturally significant section is dramatically underrepresented. Mapping where the knowledge gaps are.",
      date: "Coming soon",
    },
  ];

  return (
    <section id="blog" className="py-20 px-6" style={{ backgroundColor: brand.cream }}>
      <div className="max-w-5xl mx-auto">
        <span
          className="text-xs tracking-widest uppercase mb-4 block"
          style={{ color: brand.moss, fontWeight: 600 }}
        >
          The Cladari Journal
        </span>
        <h2
          className="text-2xl md:text-3xl mb-12"
          style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
        >
          Thinking in public about plants, data,
          <br />
          and what verification could look like.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((p, i) => (
            <Card
              key={i}
              className="border-0 shadow-none cursor-pointer group"
              style={{ backgroundColor: "#f5f2ed" }}
            >
              <CardContent className="pt-6">
                <span
                  className="text-xs tracking-wider uppercase mb-3 block"
                  style={{ color: brand.clay, fontWeight: 600 }}
                >
                  {p.tag}
                </span>
                <h3
                  className="text-base mb-3 group-hover:underline"
                  style={{ color: brand.forest, fontWeight: 600, fontFamily: serif }}
                >
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: brand.bark }}>
                  {p.excerpt}
                </p>
                <span className="text-xs" style={{ color: brand.moss }}>
                  {p.date}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Waitlist / CTA ───────────────────────────────
function WaitlistSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      if (res.ok) {
        setStatus("sent");
        setName("");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="waitlist" className="py-20 px-6" style={{ backgroundColor: brand.forest }}>
      <div className="max-w-3xl mx-auto text-center">
        <Sprout className="w-8 h-8 mx-auto mb-6" style={{ color: brand.clay }} />
        <h2
          className="text-2xl md:text-3xl mb-4"
          style={{ color: brand.cream, fontFamily: serif, fontWeight: 400 }}
        >
          Built with the community, for the community.
        </h2>
        <p className="text-sm leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: "rgba(250,246,240,0.7)" }}>
          Cladari is in private beta with a small group of serious breeders and
          conservationists. If you&apos;re running a breeding program, maintaining a
          conservation collection, or conducting research on <em>Anthurium</em> — we&apos;d
          like to hear from you.
        </p>

        {status === "sent" ? (
          <div className="py-8">
            <p className="text-lg mb-2" style={{ color: brand.cream, fontFamily: serif }}>
              Thank you, {name || "friend"}.
            </p>
            <p className="text-sm" style={{ color: "rgba(250,246,240,0.6)" }}>
              We&apos;ll be in touch soon to learn about your collection.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 max-w-md mx-auto mb-6">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: "rgba(250,246,240,0.1)",
                  border: "1px solid rgba(250,246,240,0.2)",
                  color: brand.cream,
                }}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "rgba(250,246,240,0.1)",
                    border: "1px solid rgba(250,246,240,0.2)",
                    color: brand.cream,
                  }}
                />
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={status === "sending"}
                  style={{ backgroundColor: brand.clay, color: "#fff", opacity: status === "sending" ? 0.7 : 1 }}
                >
                  <Mail className="w-4 h-4" /> {status === "sending" ? "Sending..." : "Request Access"}
                </Button>
              </div>
            </div>

            {status === "error" && (
              <p className="text-xs mb-4" style={{ color: "#e88" }}>
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}

        <p className="text-xs" style={{ color: "rgba(250,246,240,0.4)" }}>
          Not a mailing list. We&apos;ll reach out personally to discuss your collection and goals.
        </p>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 px-6" style={{ backgroundColor: "#141f1a" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Leaf className="w-4 h-4" style={{ color: brand.moss }} />
              <span
                className="text-base"
                style={{ color: brand.cream, fontWeight: 600, fontFamily: serif }}
              >
                Cladari
              </span>
            </div>
            <p className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(250,246,240,0.4)" }}>
              Biological documentation infrastructure for conservation breeding
              and genetic research. Built in Fort Lauderdale, FL.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="text-xs mb-3 tracking-wider uppercase" style={{ color: "rgba(250,246,240,0.3)", fontWeight: 600 }}>
                Platform
              </p>
              <div className="space-y-2">
                {["Research", "Journal", "Sovria"].map((l) => (
                  <p key={l} className="text-sm cursor-pointer hover:underline" style={{ color: "rgba(250,246,240,0.6)" }}>
                    {l}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs mb-3 tracking-wider uppercase" style={{ color: "rgba(250,246,240,0.3)", fontWeight: 600 }}>
                Community
              </p>
              <div className="space-y-2">
                {["Beta Program", "For Researchers", "Contact"].map((l) => (
                  <p key={l} className="text-sm cursor-pointer hover:underline" style={{ color: "rgba(250,246,240,0.6)" }}>
                    {l}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator style={{ backgroundColor: "rgba(250,246,240,0.08)" }} />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <p className="text-xs" style={{ color: "rgba(250,246,240,0.3)" }}>
            &copy; 2026 Cladari &middot; Powered by Sovria
          </p>
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" style={{ color: "rgba(250,246,240,0.3)" }} />
            <span className="text-xs" style={{ color: "rgba(250,246,240,0.3)" }}>
              www.cladari.ai
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Landing Page ─────────────────────────────────
export default function LandingPage() {
  const [activeSection] = useState("mission");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    createSupabaseClient()
      .auth.getUser()
      .then(({ data }) => {
        setIsLoggedIn(!!data.user);
      });
  }, []);

  return (
    <div style={{ fontFamily: sans }}>
      <Nav activeSection={activeSection} isLoggedIn={isLoggedIn} />
      <Hero isLoggedIn={isLoggedIn} />
      <ProblemSection />
      <HowItWorksSection />
      <BreederBlock />
      <PlatformSection />
      <SovriaSection />
      <ResearchSection />
      <JournalSection />
      <WaitlistSection />
      <Footer />
    </div>
  );
}
