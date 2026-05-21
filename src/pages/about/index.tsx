import { Calendar, Users, CheckCircle, Bell, ClipboardList, BarChart3, Zap, Globe } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Effortless Event Creation",
    description:
      "Set up corporate training, conferences, and community gatherings in minutes. No complex tools needed.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Organize members into groups, delegate tasks, and keep everyone on the same page with shared workspaces.",
  },
  {
    icon: ClipboardList,
    title: "Smart Task Management",
    description:
      "Assign tasks, track progress, and manage working hours. Everyone knows what to do and when.",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description:
      "Instant push notifications and email alerts keep your team informed about updates, changes, and deadlines.",
  },
  {
    icon: CheckCircle,
    title: "QR Code Check-In",
    description:
      "Fast, contactless attendee check-in with unique QR codes. See real-time attendance at a glance.",
  },
  {
    icon: BarChart3,
    title: "Budget & Resource Tracking",
    description:
      "Monitor budgets, materials, and manpower allocation. Make data-driven decisions for your next event.",
  },
];

const stats = [
  { value: "10,000+", label: "Concurrent Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "< 200ms", label: "Response Time" },
  { value: "24/7", label: "Monitoring" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Chrono<span className="text-blue-300">Flow</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100">
            The simplest way to plan, coordinate, and run events for your
            organization. From small team meetings to large conferences &mdash;
            ChronoFlow handles it all.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm"
              >
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-xs text-blue-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Why ChronoFlow */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-800">
          Why ChronoFlow?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
          Stop juggling spreadsheets, emails, and chat messages. ChronoFlow
          brings everything into one place with zero learning curve.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3 text-blue-700">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold text-slate-800">
            How It Works
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <Step
              step="1"
              icon={Globe}
              title="Create Your Organization"
              description="Set up your organization, invite members, and assign roles. Organizers manage events while members collaborate on tasks."
            />
            <Step
              step="2"
              icon={Zap}
              title="Plan & Coordinate"
              description="Create events, break them into tasks, form groups, set budgets, and track resources. Everyone gets notified instantly."
            />
            <Step
              step="3"
              icon={CheckCircle}
              title="Execute & Review"
              description="Run your event with QR check-in for attendees, real-time dashboards, and post-event analytics for continuous improvement."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">
            Ready to Simplify Your Events?
          </h2>
          <p className="mt-4 text-blue-200">
            ChronoFlow gives every organizer the tools they need &mdash; without
            the complexity they don&apos;t.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} ChronoFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function Step({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
        <Icon className="h-7 w-7" />
      </div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
        Step {step}
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}
