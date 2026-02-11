import { TotpSettings } from "./components/TotpSettings";

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and security preferences.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          <TotpSettings />
        </section>
      </div>
    </div>
  );
}
