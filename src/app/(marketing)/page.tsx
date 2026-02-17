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
  FlaskConical,
  Sprout,
  Globe,
  Mail,
  Zap,
  Server,
  Brain,
  Lock,
  Camera,
  Droplets,
  Gauge,
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

const serif = "var(--font-instrument-serif), 'Instrument Serif', serif";
const sans = "var(--font-dm-sans), 'DM Sans', -apple-system, system-ui, sans-serif";

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
        <div className="flex items-center gap-2 mb-8">
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: brand.moss, fontWeight: 600 }}
          >
            Biological Documentation Infrastructure
          </span>
        </div>

        <h1
          className="text-4xl md:text-5xl lg:text-6xl mb-10"
          style={{
            color: brand.forest,
            fontFamily: serif,
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          Generations of botanical knowledge.
          <br />
          Never connected. <em>Until now.</em>
        </h1>

        <p
          className="text-lg md:text-xl leading-relaxed mb-6 max-w-3xl"
          style={{ color: brand.bark, lineHeight: 1.7 }}
        >
          Molecular phylogenetics is rewriting how we classify <em>Anthurium</em> — proving
          that morphology alone was never enough. Meanwhile, decades of phenological
          observations, environmental response data, and breeding knowledge remain
          locked in monographs, field notebooks, and growers&apos; heads.
        </p>

        <p
          className="text-lg md:text-xl leading-relaxed mb-10 max-w-3xl"
          style={{ color: brand.forest, fontWeight: 500, lineHeight: 1.7 }}
        >
          Cladari connects what&apos;s never been connected — structured phenotypic
          documentation, environmental data, breeding records, and eventually genomic
          markers — creating a living dataset where novel correlations become visible
          for the first time.
        </p>

        <div className="flex flex-wrap gap-4 mb-16">
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
        </div>

        <a
          href="#platform"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: brand.moss }}
        >
          See how it works <ChevronDown className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

// ── The Problem ──────────────────────────────────
function ProblemSection() {
  const gaps = [
    {
      icon: BookOpen,
      title: "The Classification is Changing",
      desc: "DNA-based phylogenetics has shown that most traditional morphology-based sections aren\u2019t monophyletic. The genus is being reclassified in real time \u2014 but the tools for breeders and collectors to keep up don\u2019t exist.",
    },
    {
      icon: Microscope,
      title: "Phenotype Without Context",
      desc: "Millions of herbarium specimens are being digitized. But preserved plants can\u2019t tell you how morphology responds to cultivation conditions, elevation changes, or hybridization. That data lives only in living collections \u2014 and it\u2019s not being captured.",
    },
    {
      icon: Shield,
      title: "Provenance Evaporates",
      desc: "A plant gets traded, divided, relabeled. Within two generations, nobody can verify what it actually is. Mislabeled species circulate freely. Hybrid origins vanish. The genetic integrity that conservation depends on erodes quietly.",
    },
  ];

  return (
    <section className="py-20 px-6" style={{ backgroundColor: "#f5f2ed" }}>
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-2xl md:text-3xl mb-4"
          style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
        >
          The genus is being rewritten.
          <br />
          The infrastructure hasn&apos;t caught up.
        </h2>
        <p className="text-base mb-12 max-w-2xl" style={{ color: brand.bark }}>
          Institutions are digitizing the past. Molecular systematics is redefining
          relationships. But nobody is building the forward-looking data layer for
          living collections — the place where phenotype, environment, provenance,
          and genetics converge.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {gaps.map((g, i) => (
            <Card
              key={i}
              className="border-0 shadow-none"
              style={{ backgroundColor: brand.cream }}
            >
              <CardContent className="pt-6">
                <g.icon className="w-5 h-5 mb-4" style={{ color: brand.moss }} />
                <h3 className="text-base mb-3" style={{ color: brand.forest, fontWeight: 600 }}>
                  {g.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: brand.bark }}>
                  {g.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ─────────────────────────────────
function HowItWorksSection() {
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
        <p className="text-base mb-12 max-w-2xl" style={{ color: brand.bark }}>
          At the individual level, it&apos;s a plant care interface — as simple as
          snapping a photo, logging a watering, or noting a new leaf. Behind that
          simplicity, every interaction becomes structured, timestamped,
          queryable data that compounds over time.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Left: What you do */}
          <div className="rounded-xl p-8" style={{ backgroundColor: "#f5f2ed" }}>
            <h3
              className="text-lg mb-6"
              style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
            >
              What you do
            </h3>
            <div className="space-y-5">
              {[
                {
                  icon: Camera,
                  text: "Take photos during care rounds",
                  sub: "Growth, leaf condition, flowering \u2014 timestamped and tied to the plant",
                },
                {
                  icon: Droplets,
                  text: "Log care activity",
                  sub: "Watering, fertilizing, repotting, treatments \u2014 tap and go",
                },
                {
                  icon: Leaf,
                  text: "Record observations",
                  sub: "New growth, pest signs, flowering events, morphology notes",
                },
                {
                  icon: GitBranch,
                  text: "Document breeding and lineage",
                  sub: "Crosses, harvests, seed batches, divisions \u2014 the full chain",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${brand.moss}18` }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: brand.moss }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: brand.forest, fontWeight: 600 }}>
                      {item.text}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: brand.bark }}>
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: What it enables */}
          <div className="rounded-xl p-8" style={{ backgroundColor: brand.forest }}>
            <h3
              className="text-lg mb-6"
              style={{ color: brand.cream, fontFamily: serif, fontWeight: 400 }}
            >
              What it enables
            </h3>
            <div className="space-y-5">
              {[
                {
                  icon: Microscope,
                  text: "Phenotypic data at scale",
                  sub: "Structured morphological records across collections, not just anecdotes",
                },
                {
                  icon: FlaskConical,
                  text: "Environmental correlations",
                  sub: "Connect care outcomes to temperature, humidity, VPD, light, and substrate chemistry",
                },
                {
                  icon: Dna,
                  text: "Breeding intelligence",
                  sub: "Track trait inheritance across generations with documented parentage and growing conditions",
                },
                {
                  icon: Shield,
                  text: "Provenance that holds up",
                  sub: "Continuous documentation chains that verify identity through narrative, not claims",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(250,246,240,0.1)" }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: brand.clay }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: brand.cream, fontWeight: 600 }}>
                      {item.text}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(250,246,240,0.6)" }}>
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plain-language bridge */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm leading-relaxed" style={{ color: brand.bark }}>
            Whether you&apos;re a hobbyist who wants better care insights or a
            researcher who needs structured phenotypic data — the work is the
            same. The platform meets you where you are and the data matures with
            your collection.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Platform ─────────────────────────────────────
function PlatformSection() {
  const layers = [
    {
      icon: Database,
      label: "Structured Observation",
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
      label: "Lineage & Provenance",
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
      label: "Environmental Intelligence",
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
          className="text-2xl md:text-3xl mb-12"
          style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
        >
          What&apos;s under the hood
        </h2>

        <div className="space-y-16">
          {layers.map((layer, i) => (
            <div key={i} className="grid md:grid-cols-5 gap-8 items-start">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${brand.forest}10` }}
                  >
                    <layer.icon className="w-5 h-5" style={{ color: brand.forest }} />
                  </div>
                  <span
                    className="text-xs tracking-widest uppercase"
                    style={{ color: brand.moss, fontWeight: 600 }}
                  >
                    {layer.label}
                  </span>
                </div>
                <h3
                  className="text-xl mb-3"
                  style={{ color: brand.forest, fontFamily: serif, fontWeight: 400 }}
                >
                  {layer.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: brand.bark }}>
                  {layer.desc}
                </p>
              </div>

              <div className="md:col-span-3">
                <div className="rounded-xl p-6" style={{ backgroundColor: "#f5f2ed" }}>
                  <ul className="space-y-3">
                    {layer.details.map((d, j) => (
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
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Sovria Section ───────────────────────────────
function SovriaSection() {
  return (
    <section id="sovria" className="py-20 px-6" style={{ backgroundColor: "#f5f2ed" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
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
              Botanical intelligence that outperforms
              frontier models — on the power budget
              of a desktop.
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: brand.bark }}>
              Ask a general-purpose AI to discuss <em>Anthurium</em> sect.
              <em> Cardiolonchium</em> with taxonomic precision, and you&apos;ll
              quickly find the limits. Botanical Latin, morphometric nuance,
              and sectional classification aren&apos;t in the training data — at
              least not with the accuracy that serious work demands.
            </p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: brand.bark }}>
              Sovria is a domain-specific AI stack built for accuracy,
              efficiency, and data sovereignty. It combines semantic vector
              databases, structured embeddings, and fine-tuned botanical models
              to deliver intelligence that&apos;s grounded in verified datasets —
              not probabilistic guesses from trillion-parameter models.
            </p>

            <Button
              variant="outline"
              className="gap-2"
              style={{ borderColor: brand.clay, color: brand.clay }}
            >
              Learn more about Sovria <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: Zap,
                title: "Efficient by Design",
                desc: "Domain-specific models trained on verified botanical data outperform frontier LLMs on taxonomic tasks \u2014 while running on hardware you could put under a desk. Better results, a fraction of the compute.",
              },
              {
                icon: Lock,
                title: "Data Sovereignty",
                desc: "Your data, your terms. Private by default \u2014 but with opt-in pathways for contributors who want their observations to strengthen the shared dataset. The best insights require community-scale data. The model only works if participation is voluntary and transparent.",
              },
              {
                icon: Brain,
                title: "Source of Truth Architecture",
                desc: "Cladari provides the verified data. Sovria makes sense of it. Every insight traces back to documented observations, not hallucinated correlations. When it tells you something, it can show you why.",
              },
              {
                icon: Server,
                title: "Domain-Specific Stack",
                desc: "Semantic vector search, structured embeddings, statistical analyzers, and fine-tuned models \u2014 purpose-built for botanical intelligence. Sovria is designed to power domain expertise across verticals.",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: brand.cream }}>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${brand.clay}15` }}
                >
                  <item.icon className="w-4 h-4" style={{ color: brand.clay }} />
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: brand.forest, fontWeight: 600 }}>
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: brand.bark }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


// ── Research Vision ──────────────────────────────
function ResearchSection() {
  const questions = [
    "How does Cardiolonchium blade morphology vary across elevation in cultivation vs. native habitat?",
    "Do intersectional F1 hybrids express spathe characteristics from the maternal or paternal parent?",
    "Can environmental stress signatures predict flowering periodicity in velvet-leaf species?",
    "What substrate chemistry profiles correlate with optimal growth across taxonomic sections?",
    "Can phenotypic clustering from photographic data identify misclassified taxa in mixed collections?",
    "Where do morphology-based and DNA-based classifications diverge \u2014 and what does that mean for breeders?",
  ];

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
            <p className="text-sm leading-relaxed mb-4" style={{ color: brand.bark }}>
              Institutions are investing in digitizing herbarium collections —
              transforming millions of preserved specimens into searchable
              datasets. That work is essential. But it captures the past.
            </p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: brand.bark }}>
              Cladari captures the present: how living plants respond to
              cultivation conditions, which traits emerge in F1 hybrids, how
              phenotype shifts across environments. When structured phenotypic
              data from living collections pairs with genomic markers, genuinely
              novel correlations — invisible to both individual growers and
              herbarium-based research — become possible.
            </p>

            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: brand.cream }}>
              <Dna className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: brand.moss }} />
              <div>
                <p className="text-sm mb-1" style={{ color: brand.forest, fontWeight: 600 }}>
                  Future: Genomic Integration
                </p>
                <p className="text-xs leading-relaxed" style={{ color: brand.bark }}>
                  Nanopore sequencing will add DNA-based identity to the biological
                  biography. As molecular phylogenetics continues to reclassify
                  the genus, Cladari&apos;s structured phenotype data becomes the bridge
                  between what the genome says and what the plant shows.
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
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: brand.cream }}
                >
                  <span
                    className="text-xs mt-0.5 flex-shrink-0"
                    style={{ color: brand.moss, fontWeight: 700, fontFamily: "monospace" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: brand.forest }}>
                    <em>{q}</em>
                  </p>
                </div>
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
      <PlatformSection />
      <SovriaSection />
      <ResearchSection />
      <JournalSection />
      <WaitlistSection />
      <Footer />
    </div>
  );
}
