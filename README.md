# Simulateur d'investissement crypto — S'investir

Transposition du [simulateur crypto S'investir](https://sinvestir.fr/simulateur-crypto-monnaie/)
aux standards visuels de la [suite de simulateurs](https://simulateurs.sinvestir.fr/).

Backtest rétrospectif d'un investissement en cryptomonnaie, **en une fois** ou en
**DCA** (apports réguliers), sur **données de marché historiques réelles**, avec
comparaison à un Livret A.

**Démo en ligne** : https://simulateur-sinvestir-omega.vercel.app

---

## Lancer le projet

```bash
npm install
npm run dev      # http://localhost:3000
```

Autres commandes :

```bash
npm run build    # build de production
npm test         # tests unitaires domaine + infra (Vitest)
npm run lint
```

Aucune variable d'environnement n'est requise : la source de prix (Gate.io) est une
API publique sans clé.

### Routes

| Route         | Rôle                                                              |
| ------------- | ---------------------------------------------------------------- |
| `/`           | Le simulateur complet.                                           |
| `/embed`      | Version épurée (sans header/footer) pensée pour l'`<iframe>`.    |
| `/demo-embed` | Démonstration de l'intégration : le simulateur chargé en iframe. |
| `/api/prices` | Proxy interne : historique de prix d'une paire (cache).          |
| `/api/coins`  | Proxy interne : liste des paires USDT triées par volume (cache). |

---

## Partis pris techniques

### Stack — alignée sur celle de S'investir

**Next.js 16 (App Router) + TypeScript strict + Tailwind v4**, déployable sur Vercel.
C'est exactement la stack interne mentionnée : le rendu peut prendre la place du
simulateur actuel sans friction d'intégration.

- **TypeScript `strict`**, zéro `any`, types `readonly`, discriminated unions.
- **Tailwind v4** avec des _design tokens_ extraits du CSS de production de
  `simulateurs.sinvestir.fr` (voir [`globals.css`](src/app/globals.css)) : bleu de
  marque `#1098f7`, accent or `#f8d047`, surfaces sombres, sémantique vert/rouge pour
  les gains/pertes, police **Lexend**. L'objectif était la fidélité visuelle, pas une
  approximation.

### Architecture — couches nommées par responsabilité

Clean Architecture dimensionnée au projet. Chaque dossier a un rôle explicite et la
dépendance va toujours vers l'intérieur (`app` → `ui`/`hooks`/`api` → `core`) :

```
src/
├─ core/              # MÉTIER PUR, sans réseau ni framework (le cœur de la valeur)
│  ├─ backtest.ts     #   calcul DCA / one-shot + CAGR
│  ├─ constants.ts    #   valeurs métier & temporelles partagées
│  ├─ types.ts        #   types + isValidCoin (type guard) + fallback coins
│  ├─ time.ts         #   conversions ms/s/jours (pure functions)
│  └─ format.ts       #   formatage € / % / dates (fr-FR)
├─ config/            # configuration externe centralisée (URL/cache du fournisseur)
├─ services/          # accès aux systèmes externes
│  └─ gateio/         #   gateio.ts : prix + liste des paires (remplaçable)
├─ api/               # clients HTTP côté front (appellent les API routes internes)
│  ├─ prices.ts
│  └─ coins.ts
├─ hooks/             # état serveur React (usePriceHistory, useCoins — TanStack Query)
├─ ui/                # présentation
│  ├─ simulator/      #   Simulator (orchestration) + Result/Form/Combobox/Chart/Cards
│  └─ primitives/     #   composants génériques (Card, Field, inputs…)
└─ app/               # Next.js : pages, layout, et API routes (proxy serveur)
   └─ api/            #   /prices et /coins : proxy + cache + gestion d'erreurs
```

- **Le cœur métier (`core/`) est pur et testé** ([backtest.test.ts](src/core/backtest.test.ts),
  [types.test.ts](src/core/types.test.ts)) et la couche `services` parse/filtre/trie les
  données externes sous test ([gateio.test.ts](src/services/gateio/gateio.test.ts)) —
  **23 tests** au total. La source de prix n'est qu'un détail remplaçable sans toucher
  au calcul.
- **`<Simulator/>` est autonome et embeddable** : il reçoit ses valeurs par défaut en
  props (`defaultCoinId`, `defaultAmount`, `compact`), peu de dépendances, aucun état
  global. Il peut vivre dans la suite S'investir ou être chargé en iframe ailleurs.

### Source de données — Gate.io (et pourquoi pas CoinGecko)

Le simulateur d'origine s'appuie sur des données historiques. J'ai d'abord visé
**CoinGecko** (le plus courant), mais leur API publique limite désormais l'historique
aux **365 derniers jours** sans clé payante — rédhibitoire pour un backtest DCA
pluriannuel.

→ J'ai retenu l'**API publique de klines de Gate.io** : pas de clé, pas de secret à
gérer, ~1000 jours d'historique journalier par requête. La **liste des cryptos est
elle aussi dynamique** : les ~2000 paires USDT tradables sont récupérées via Gate.io
(`currency_pairs` + `tickers` en parallèle), **triées par volume 24h** pour mettre les
cryptos majeures en tête, et parcourues dans un combobox de recherche. La démo est
ainsi **100 % reproductible** par l'évaluateur sans configuration.

Les prix sont en **USDT (≈ USD)**, devise réelle des données — affichée telle quelle
par honnêteté plutôt que convertie approximativement.

### Résilience & performance

- **API routes comme proxy** (`/api/prices`, `/api/coins`) : le composant ne connaît
  pas le fournisseur. Le cache (mémoire process + `revalidate` Next) amortit les appels
  et gère les _rate limits_ ; les erreurs sont traduites en messages clairs côté UI.
- **State serveur via TanStack Query** : cache, dédoublonnage et gestion native des
  requêtes obsolètes (pas de _race condition_ au changement de crypto/période). Une
  liste minimale en dur sert de _fallback_ si l'API des paires échoue.
- **Combobox maison** (sans dépendance) : recherche par symbole/nom sur 2000+ paires,
  résultats plafonnés, navigable au clavier et accessible (ARIA).
- **Responsive vérifié** (390 px → `scrollWidth == innerWidth`, zéro débordement),
  graphique Recharts contraint à son conteneur.

---

## Limites assumées (périmètre demi-journée)

- Historique borné à ~1000 jours (limite Gate.io en une requête) — paginable si besoin.
- CAGR (perf. annualisée) calculé sur la durée totale de la période ; pour du DCA,
  c'est une approximation pédagogique, pas un TRI exact.
- Liste des cryptos chargée dynamiquement (paires USDT Gate.io) ; nom complet quand
  le fournisseur l'expose, sinon symbole.
- Pas de tests sur la couche présentation (priorité au domaine et à l'infra).

---

## Suggestions d'amélioration (regard de partenaire)

Quelques pistes après exploration des outils S'investir :

1. **Mutualiser un design system** entre simulateurs (tokens + composants UI partagés
   dans un package interne). Aujourd'hui les tokens vivent dans le CSS compilé ;
   les exposer en source faciliterait la cohérence et l'ajout de nouveaux simulateurs.
2. **Cache de prix côté Supabase** (table `price_history` alimentée par un cron n8n)
   plutôt que dépendre d'une API tierce au runtime : indépendance, vitesse, et données
   maîtrisées — directement dans votre stack.
3. **Partage de simulation par URL** (params encodés) + export PNG/PDF du résultat :
   levier d'acquisition fort pour un outil pédagogique partagé sur les réseaux.
4. **Lead capture intégré** : "recevez votre simulation par email" → entrée HubSpot,
   transformant le simulateur en canal d'acquisition mesurable.
5. **Couche IA** (cœur du poste) : un commentaire généré par LLM qui interprète le
   résultat ("sur cette période, le DCA a lissé la volatilité de X %…"), avec garde-fous
   (pas de conseil en investissement, output structuré).
