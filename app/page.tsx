
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Smart Course Management",
    description:
      "Create structured courses, organize lessons, publish content, and manage your learning materials in one place.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: Brain,
    title: "AI Learning Assistant",
    description:
      "Get AI-powered learning support and ask questions to better understand your educational content.",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: ClipboardCheck,
    title: "Assignments & Assessments",
    description:
      "Submit assignments, manage deadlines, review submissions, and receive instructor feedback.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: BarChart3,
    title: "Learning Progress",
    description:
      "Track completed sections, monitor enrollment progress, and stay focused on your learning goals.",
    color: "bg-orange-100 text-orange-700",
  },
  {
    icon: Users,
    title: "Role-Based Portals",
    description:
      "Dedicated experiences for students, instructors, and administrators with appropriate access.",
    color: "bg-pink-100 text-pink-700",
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    description:
      "Authentication, role-based authorization, and protected assignment file access.",
    color: "bg-cyan-100 text-cyan-700",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Register as a student or instructor and access your personalized portal.",
  },
  {
    number: "02",
    title: "Explore and learn",
    description: "Discover courses, access lessons, and interact with learning resources.",
  },
  {
    number: "03",
    title: "Track your progress",
    description: "Complete sections, submit assignments, and monitor your learning journey.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200">
              <GraduationCap size={23} />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Scholar<span className="text-blue-600">Flow</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">
              How it works
            </a>
            <a href="#about" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        <div className="absolute -left-40 top-0 -z-10 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-200">
              <Sparkles size={16} />
              AI-Assisted Learning Platform
            </div>

            <h1 className="max-w-2xl text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Learn smarter.
              <br />
              Grow <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">together.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              Discover a better way to learn, teach, and manage education.
              ScholarFlow brings courses, assignments, progress tracking, and
              AI-powered learning support together in one platform.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-7 py-4 font-bold text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-1 hover:bg-blue-400"
              >
                Start Learning <ArrowRight size={19} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-4 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-400" />
                Personalized portals
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-400" />
                AI-assisted learning
              </span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 blur-2xl" />
            <div className="relative rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm text-blue-200">Your learning space</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Welcome to ScholarFlow</h2>
                </div>
                <div className="rounded-xl bg-blue-400/20 p-3 text-blue-200">
                  <GraduationCap size={27} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <BookOpen className="mb-4 text-blue-300" size={23} />
                  <p className="text-sm text-slate-300">Course learning</p>
                  <p className="mt-1 font-bold text-white">Organized lessons</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <Brain className="mb-4 text-violet-300" size={23} />
                  <p className="text-sm text-slate-300">AI support</p>
                  <p className="mt-1 font-bold text-white">Smart assistance</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-400/15 p-2.5 text-emerald-300">
                      <Layers3 size={21} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Learning journey</p>
                      <p className="text-xs text-slate-300">Stay on track with your goals</p>
                    </div>
                  </div>
                  <ArrowRight className="text-slate-300" size={20} />
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-blue-400 to-violet-400" />
                </div>
                <p className="mt-2 text-right text-xs text-slate-300">
                  Progress tracking preview
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-300/20 bg-blue-400/10 p-4">
                <Sparkles className="shrink-0 text-blue-200" size={22} />
                <p className="text-sm leading-6 text-blue-100">
                  Learn with structured content and AI-powered assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Platform features
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to move forward
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              A connected learning experience that supports students,
              instructors, and administrators at every step.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50"
                >
                  <div className={`mb-6 inline-flex rounded-2xl p-3 ${feature.color}`}>
                    <Icon size={25} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* About / roles */}
      <section id="about" className="scroll-mt-24 bg-slate-50 px-6 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Built for everyone
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              One platform.
              <br />
              Three connected experiences.
            </h2>
            <p className="mt-6 max-w-xl leading-8 text-slate-600">
              ScholarFlow provides dedicated tools for every role, helping
              create a connected and organized educational environment.
            </p>

            <div className="mt-8 space-y-5">
              {[
                ["Students", "Discover courses, learn through lessons, submit assignments, and track progress."],
                ["Instructors", "Create courses, manage lessons, publish assignments, and evaluate submissions."],
                ["Administrators", "Access platform statistics and manage user information."],
              ].map(([title, description]) => (
                <div key={title} className="flex gap-4">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <CheckCircle2 size={17} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 leading-7 text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-10">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-violet-700 p-7 text-white">
              <Sparkles size={30} />
              <h3 className="mt-5 text-2xl font-bold">Learning meets intelligence</h3>
              <p className="mt-3 leading-7 text-blue-100">
                Combine structured educational content with AI-assisted
                support to make learning more accessible.
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <Brain className="text-violet-600" size={25} />
                <p className="mt-3 font-bold text-slate-900">AI Assistant</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Ask questions and get learning support.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <ClipboardCheck className="text-emerald-600" size={25} />
                <p className="mt-3 font-bold text-slate-900">Assessments</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Submit work and receive feedback.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Get started
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Your learning journey starts here
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative rounded-2xl border border-slate-200 p-8">
                <span className="text-4xl font-extrabold text-blue-100">{step.number}</span>
                <h3 className="mt-5 text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 px-8 py-16 text-center shadow-2xl shadow-blue-200 sm:px-16">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to transform your learning experience?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-100">
            Join ScholarFlow and explore a more connected way to learn, teach,
            and grow.
          </p>
          <Link
            href="/register"
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-blue-700 shadow-lg transition hover:-translate-y-1 hover:bg-blue-50"
          >
            Create Your Account <ArrowRight size={19} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-950 px-6 py-12 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-2">
                <GraduationCap size={22} />
              </div>
              <span className="text-xl font-extrabold">
                Scholar<span className="text-blue-400">Flow</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              An AI-assisted learning management platform for modern education.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-slate-300">
            <Link href="/login" className="transition hover:text-white">Login</Link>
            <Link href="/register" className="transition hover:text-white">Register</Link>
            <a href="#features" className="transition hover:text-white">Features</a>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ScholarFlow. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
