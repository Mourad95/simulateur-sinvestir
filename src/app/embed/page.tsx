import { Simulator } from "@/components/Simulator";
import { isValidCoin } from "@/domain/types";
import { DEFAULT_COIN_ID, DEFAULT_AMOUNT } from "@/domain/constants";

/**
 * Version épurée pour l'embedding (iframe) : aucun header/footer du site.
 * Paramétrable via query string : /embed?coin=ETH_USDT&amount=50
 */
export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ coin?: string; amount?: string }>;
}) {
  const { coin, amount } = await searchParams;
  const validCoin = isValidCoin(coin) ? coin : DEFAULT_COIN_ID;
  const parsedAmount = Number(amount);
  const validAmount =
    Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : DEFAULT_AMOUNT;

  return (
    <main className="p-4">
      <Simulator defaultCoinId={validCoin} defaultAmount={validAmount} compact />
    </main>
  );
}
