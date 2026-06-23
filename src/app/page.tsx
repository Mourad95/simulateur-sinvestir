import { Simulator } from "@/components/Simulator";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-16">
      <header className="mb-8 max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          Simulateur S&apos;investir
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Simulateur d&apos;investissement crypto
        </h1>
        <p className="mt-3 text-text-muted">
          Visualisez ce qu&apos;un investissement en cryptomonnaie aurait donné, en une
          fois ou via des apports réguliers (DCA), sur des données historiques réelles —
          et comparez-le à un Livret&nbsp;A.
        </p>
      </header>

      <Simulator />
    </main>
  );
}
