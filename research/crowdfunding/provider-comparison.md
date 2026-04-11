## Provider comparison (direct donations / pure tips)

Context: We want to accept **voluntary contributions** on `reign-of-brabant.nl` with a **hosted checkout** flow (minimal code, minimal compliance burden, fast to launch).

### Non-goals (for now)
- No “supporter packs” / guaranteed perks.
- No custom backend required for launch (we can add webhooks later).
- No complex subscription/recurring flows on day 1.

---

## Option A: Stripe (Payment Links / Checkout) — recommended default

### Why it fits
- **Fastest path to live**: create hosted checkout pages and link to them from a static site.
- **Great developer tooling** (webhooks, API, dashboard) if/when we later add a donation counter, receipts, or automation.
- **NL-friendly**: supports iDEAL, and you can keep card payments for international supporters.

### Payment method coverage (relevant now)
- **iDEAL (NL)**: supported; Stripe lists iDEAL pricing on their NL pricing page. Source: `https://stripe.com/en-gb-nl/pricing`
- **Cards**: supported (Apple Pay / Google Pay via cards depending on setup).

### Fees (what to cite)
- iDEAL is listed as a **flat fee per successful transaction** on Stripe’s pricing page. Source: `https://stripe.com/en-gb-nl/pricing`
- Card fees vary by card region/type; Stripe publishes these on the same pricing page.

Important: fees can change and can differ by account; always confirm in the Stripe dashboard before going live.

### Disputes / fraud exposure
- **iDEAL**: Stripe docs state customers can’t dispute iDEAL payments with their bank (lower dispute surface than cards). Source: `https://docs.stripe.com/payments/ideal?locale=en-GB`
- **Cards**: normal chargeback risk applies (keep iDEAL as the “default” choice for NL).

### Integration with a static site
Two launch-friendly ways:
- **Dashboard-created Payment Links** (no code): create fixed-amount links (e.g. €5/€10/€25) and place them as buttons on `/doneer`.
- **Checkout Session** (code): only needed if we want custom amounts and more control immediately.

Docs:
- Payment Links overview/API: `https://stripe.com/docs/payment-links/api`

### 2026 note (iDEAL → Wero)
Stripe’s iDEAL docs mention iDEAL is being replaced by **Wero** over 2026–2027 (and requires rebranding steps). Source: `https://docs.stripe.com/payments/ideal?locale=en-GB`

Practical handling:
- Keep our donation UX wording generic (“betaal via je bank” / “iDEAL/Wero”) so it won’t age badly.
- Prefer Stripe “dynamic payment methods” where possible; Stripe handles method presentation.

---

## Option B: Mollie (Payment Links) — strong NL/BE alternative

### Why it fits
- Very strong **local payment method** positioning (NL/BE focus).
- **Payment Links** are first-class and dashboard-friendly, ideal for static sites.

### Payment method coverage (relevant now)
- **iDEAL | Wero**: published and supported. Source: `https://www.mollie.com/nl/pricing`
- **Bancontact (BE)**: available if we want to explicitly optimize for Belgian supporters. Source: `https://www.mollie.com/nl/pricing`
- **Cards**: supported; fees listed on Mollie pricing.

### Fees (what to cite)
- Mollie publishes per-method pricing publicly; iDEAL is listed as a **flat fee per successful transaction**. Source: `https://www.mollie.com/nl/pricing`

### Disputes / fraud exposure
- Similar high-level story: bank methods lower friction for NL, cards carry standard dispute risk.
- Mollie also supports recurring, but that’s not required for initial “tips” launch.

### Integration with a static site
- **Dashboard-created Payment Links** and embed as buttons.
- If later needed: Payment Links API for automation.

Docs:
- Mollie Payment Links guide: `https://docs.mollie.com/docs/payment-links`
- Create payment link (API): `https://docs.mollie.com/reference/create-payment-link`

---

## Recommendation (for Reign of Brabant right now)

### Default: Stripe Payment Links
Reasons:
- quickest to ship end-to-end for a solo dev,
- strong path to recurring support later (if desired),
- excellent dev tooling to evolve into a “donation counter + transparency dashboard” later.

### When to pick Mollie instead
Pick Mollie if:
- NL/BE is overwhelmingly the audience and we want “most local-feeling” checkout,
- we specifically want to push **Bancontact** hard early.

---

## Implementation decision (what we will do next)
For the first release:
- create **3–4 fixed amount** hosted checkout links (e.g. €5 / €10 / €25 / custom link later),
- wire them into `/doneer`,
- redirect back to `/thanks` after successful payment (provider setting).

