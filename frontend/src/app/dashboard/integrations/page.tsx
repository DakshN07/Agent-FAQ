import IntegrationsView from "./IntegrationsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations · Agent-FAQ",
  description: "Connect your Discord, Slack and Telegram channels.",
};

/**
 * Server Component shell.
 *
 * The OAuth return redirect lands here with `?connected=<platform>` (or
 * `?connected=none&reason=<code>`), so we read it with the `searchParams` prop
 * and hand the values down as plain props.
 *
 * Doing it this way rather than with `useSearchParams()` in the client
 * component is deliberate: a client component that calls `useSearchParams` in a
 * statically-rendered route must sit under a `<Suspense>` boundary or the
 * production build fails. Passing the values down avoids the bailout entirely.
 */
export default async function IntegrationsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.searchParams;

  const first = (key: string): string | null => {
    const value = params[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  return (
    <IntegrationsView
      connectedParam={first("connected")}
      reasonParam={first("reason")}
      platformParam={first("platform")}
    />
  );
}
