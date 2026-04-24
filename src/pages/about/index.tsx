import { Calendar, Users, CheckCircle, Bell, Shield, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Event Management",
    description:
      "Create and manage corporate training, conferences, and community gatherings with an intuitive dashboard.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Delegate tasks, manage groups, and coordinate members across your organization effortlessly.",
  },
  {
    icon: CheckCircle,
    title: "QR Check-In",
    description:
      "Streamline attendee check-in with secure, single-use QR codes and real-time attendance tracking.",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description:
      "Keep everyone informed with push notifications, in-app alerts, and email updates powered by FCM and AWS SES.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Built with OAuth 2.0, MFA, RBAC, encrypted storage, and comprehensive audit logging from day one.",
  },
  {
    icon: BarChart3,
    title: "Resource Tracking",
    description:
      "Monitor budgets, working hours, and materials with data-driven insights for continuous improvement.",
  },
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
            <Shield className="h-4 w-4" />
            Secure Event Collaboration Platform
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Chrono<span className="text-blue-300">Flow</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100">
            A lightweight, secure-by-design event collaboration system that
            bridges the gap between complex project management tools and
            fragmented communication channels.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm">
            <Stat value="OAuth 2.0 + MFA" label="Authentication" />
            <Stat value="AES-256" label="Encryption at Rest" />
            <Stat value="TLS 1.3" label="Encryption in Transit" />
            <Stat value="RBAC" label="Authorization" />
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-800">
          Everything You Need for Secure Event Coordination
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
          Zero learning curve for non-professional organizers. Enterprise-grade
          security for every organization.
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

      {/* Architecture Strip */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold text-slate-800">
            Built for Security at Every Layer
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <LayerCard
              title="Web Frontend"
              tech="React 19 + TypeScript"
              items={[
                "CSP & HSTS headers",
                "CSRF protection",
                "Zod input validation",
                "Semgrep SAST",
              ]}
            />
            <LayerCard
              title="Mobile App"
              tech="Flutter (iOS & Android)"
              items={[
                "Keychain / Keystore",
                "Secure WebView",
                "mobsfscan on PRs",
                "Firebase Auth",
              ]}
            />
            <LayerCard
              title="Backend Services"
              tech="Spring Boot + Dubbo RPC"
              items={[
                "Sa-Token + TOTP MFA",
                "Rate limiting",
                "BCrypt hashing",
                "Audit logging",
              ]}
            />
            <LayerCard
              title="Infrastructure"
              tech="GKE on GCP + Terraform"
              items={[
                "Cloud Armor WAF",
                "VPC segmentation",
                "External Secrets",
                "Private registry",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-slate-400">
          <p className="font-medium text-slate-600">
            ChronoFlow &mdash; Team 3
          </p>
          <p className="mt-1">
            NUS-ISS Graduate Certificate in Securing Ubiquitous Systems
          </p>
          <p className="mt-1">
            Htet Aung &middot; Lu Shuwen &middot; Shirley Chow &middot; Thet
            Naung Soe &middot; Walfarid Hermawan Limbong
          </p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm">
      <div className="font-semibold">{value}</div>
      <div className="text-xs text-blue-200">{label}</div>
    </div>
  );
}

function LayerCard({
  title,
  tech,
  items,
}: {
  title: string;
  tech: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-400">{tech}</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-sm text-slate-600"
          >
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}