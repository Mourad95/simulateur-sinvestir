export const metadata = {
  title: "Démo embarquée · Simulateur S'investir",
};

/**
 * Démontre concrètement l'embarquabilité : le simulateur est ici chargé dans une
 * <iframe> pointant sur /embed, exactement comme il vivrait sur sinvestir.fr.
 */
export default function DemoEmbedPage() {
  const snippet = `<iframe
  src="https://VOTRE-DOMAINE/embed?coin=BTC_USDT&amount=100"
  width="100%"
  height="720"
  style="border:0;border-radius:12px"
  title="Simulateur crypto S'investir"
></iframe>`;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Aperçu intégré (embedding)</h1>
      <p className="mt-2 max-w-2xl text-text-muted">
        Le simulateur ci-dessous est chargé via une <code>&lt;iframe&gt;</code> pointant
        sur la route <code>/embed</code>. C&apos;est ainsi qu&apos;il s&apos;intégrerait
        sur <strong>sinvestir.fr</strong> sans dépendre du reste de l&apos;application.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <iframe
          src="/embed?coin=BTC_USDT&amount=100"
          width="100%"
          height={760}
          style={{ border: 0 }}
          title="Simulateur crypto S'investir (embarqué)"
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold">Code d&apos;intégration</h2>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-soft p-4 text-sm text-text-muted">
        <code>{snippet}</code>
      </pre>
    </main>
  );
}
