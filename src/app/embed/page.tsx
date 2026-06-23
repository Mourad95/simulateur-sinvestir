import { Simulator } from "@/components/Simulator";
import { SUPPORTED_COINS, type CoinId } from "@/domain/types";

/**
 * Version épurée pour l'embedding (iframe) : aucun header/footer du site.
 * Paramétrable via query string : /embed?coin=ethereum&amount=50
 */
export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ coin?: string; amount?: string }>;
}) {
  const { coin, amount } = await searchParams;
  const validCoin = SUPPORTED_COINS.some((c) => c.id === coin)
    ? (coin as CoinId)
    : "BTC_USDT";
  const parsedAmount = Number(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 100;

  return (
    <main className="p-4">
      <Simulator defaultCoinId={validCoin} defaultAmount={validAmount} compact />
    </main>
  );
}
