# Neighbri Pricing Research & Strategy

**Date:** April 10, 2026
**Prepared by:** CrumbLabz LLC

---

## 1. Competitive Landscape

### Direct Competitors — HOA Amenity/Management Software

| Product | Pricing Model | Starting Price | Amenity Booking Tier | Free Tier |
|---------|--------------|----------------|---------------------|-----------|
| **Condo Control** | Per-unit tiers | $49/mo (0-50 units) | $135/mo+ (100+ units) | No |
| **AmenityBoss** | Flat monthly | $145/mo | Included | No |
| **Omnify** | Flat monthly | $149/mo | Included | No |
| **PayHOA** | Flat tiers by unit count | $49/mo (0-25 units) | Included | Previously free <20 |
| **HOALife** | Flat tiers | $49-$195/mo | Included | Free trial |
| **Pilera** | Per-unit modular | $0.10-$0.16/unit/mo | Add-on module | No |
| **BuildingLink** | Per-unit | ~$1-3/unit/mo | Plus tier+ | No |
| **Buildium** | Flat tiers | $62/mo (Essential) | $192/mo+ (Growth) | No |
| **AppFolio** | Per-unit + minimum | $1.40/unit/mo, $280 min | Included | No |
| **TownSq** | Per-unit + free tier | $1-2/unit/mo | Paid tier | Yes (basic) |
| **HOA Messenger** | Flat | Free / $25/mo premium | **Included in free** | **Yes** |
| **BoardStack** | Flat tiers | $20-99/mo | Included | No |
| **ManageCasa** | Per-unit + base | $100/mo + $1/unit | Included | No |
| **Effortless HOA** | Per-home flat | $3/home/mo | Included | No |

### Key Insights

1. **Amenity-only booking is a gap.** Nearly every competitor bundles amenity booking into a full HOA management suite (accounting, violations, ARC, communications). A focused amenity-first product is differentiated.

2. **The $49-$150/mo range is crowded** for full-suite HOA software. But most require $135+ to unlock amenity booking specifically.

3. **HOA Messenger is the only free competitor** with amenity scheduling included. Their premium is $25/mo.

4. **Per-unit pricing creates pain** for larger communities. Flat tiers are gaining favor.

5. **Setup fees are common** at the enterprise level ($1K-$10K for BuildingLink) but rare for self-service products.

---

## 2. Infrastructure Costs (Our Marginal Cost)

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel** (hosting) | $20/mo Pro | Covers all communities |
| **Firebase** (auth + db) | Free tier | Up to 50K reads/day, 20K writes/day |
| **Resend** (email) | $0-$20/mo | Free: 3K emails/mo, Pro: 50K for $20 |
| **Stripe** (payments) | 2.9% + $0.30/txn | Passed to community or absorbed |

**Marginal cost per community:** Near zero. Firebase and Resend free tiers cover small communities. Stripe fees are per-transaction and can be passed through.

---

## 3. What Neighbri Offers vs. Competitors

Neighbri is **amenity-first** — not a full HOA management suite. This is a feature, not a limitation:

| Feature | Neighbri | Full HOA Suites |
|---------|----------|----------------|
| Amenity booking calendar | Yes | Yes (often mid-tier+) |
| Stripe payments & deposits | Yes | Sometimes |
| Approval workflows | Yes | Yes |
| Waitlist management | Yes | Rare |
| Janitorial/cleaning scheduling | Yes | Very rare |
| Multi-community support | Yes | Some |
| Self-service onboarding | Yes | Rare (usually sales-driven) |
| Accounting/GL | No | Yes |
| Violation tracking | No | Yes |
| ARC/architectural reviews | No | Yes |
| Dues collection | No | Yes |
| Document management | No | Yes |

**Positioning:** Neighbri does one thing exceptionally well — amenity booking. Communities that need a full management suite will use Buildium/AppFolio/etc. Communities that just need residents to book the clubhouse, pool, and tennis courts use Neighbri.

---

## 4. Recommended Pricing Model

### Model: Flat tiers by community size (not per-unit)

Flat pricing is simpler, more predictable, and avoids the sticker shock of per-unit models. Tiers based on what features matter at different scales.

### Recommended Tiers

| | **Starter** | **Standard** | **Pro** |
|--|------------|-------------|---------|
| **Price** | **Free** | **$29/mo** | **$79/mo** |
| Annual billing | Free | $24/mo ($288/yr) | $66/mo ($792/yr) |
| Amenities | 3 | 15 | Unlimited |
| Members | 50 | 500 | Unlimited |
| Booking calendar | Yes | Yes | Yes |
| Email notifications | Yes | Yes | Yes |
| Approval workflows | Yes | Yes | Yes |
| Waitlist management | Yes | Yes | Yes |
| Stripe payments | No | Yes | Yes |
| Janitorial scheduling | No | Yes | Yes |
| Access instructions | No | Yes | Yes |
| Booking insights | No | Yes | Yes |
| Custom branding | No | No | Yes |
| Priority support | No | No | Yes |
| Multiple admins | 1 | 3 | Unlimited |

### Why These Prices

**Free tier ($0):**
- Captures small communities and drives word-of-mouth
- HOA Messenger proves free amenity booking is viable
- Near-zero marginal cost makes this sustainable
- Conversion funnel: free → paid when they outgrow 3 amenities or need payments

**Standard ($29/mo):**
- Undercuts every competitor with amenity booking (Condo Control $135+, Buildium $192+, AmenityBoss $145)
- Sweet spot for the typical HOA (100-400 homes, 5-10 amenities)
- Stripe payments unlock at this tier, which is the main upgrade trigger
- $29 is an easy "just approve it" expense for any HOA board

**Pro ($79/mo):**
- For larger communities or those wanting premium features
- Still cheaper than every competitor except HOA Messenger
- Unlimited everything removes friction
- Custom branding and priority support justify the premium

### Revenue Projections

| Scenario | Communities | Mix | MRR |
|----------|-----------|-----|-----|
| Conservative (6 months) | 20 | 10 free, 8 standard, 2 pro | $390/mo |
| Moderate (12 months) | 100 | 40 free, 45 standard, 15 pro | $2,490/mo |
| Growth (24 months) | 500 | 200 free, 225 standard, 75 pro | $12,375/mo |

---

## 5. Transaction Revenue Opportunity

In addition to subscription fees, there's an opportunity to take a small platform fee on Stripe transactions:

| Model | Rate | Example (500 bookings/mo @ $75 avg) |
|-------|------|--------------------------------------|
| Pass-through (current) | 0% | $0 |
| Small platform fee | 1% | $375/mo |
| Moderate platform fee | 2% | $750/mo |

**Recommendation:** Start with pass-through (0% platform fee) to minimize friction during early growth. Introduce a 1% platform fee after establishing product-market fit, or offer it as a toggle where communities can choose to absorb it or pass it to residents.

---

## 6. Competitive Positioning Summary

```
Price
  │
  │  BuildingLink ($300-3000/mo)
  │  AppFolio ($280+ min)
  │  Buildium ($192+ for amenities)
  │  AmenityBoss ($145)
  │  Omnify ($149)
  │  Condo Control ($135+ for amenities)
  │  ManageCasa ($100+)
  │  ─────────────────────── Most competitors ───
  │  Neighbri Pro ($79)    ◄── Premium tier
  │  PayHOA ($49-275)
  │  HOALife ($49-195)
  │  Neighbri Standard ($29) ◄── Sweet spot
  │  HOA Messenger ($25)
  │  BoardStack ($20-99)
  │  ─────────────────────── Low-cost tier ──────
  │  Neighbri Starter (Free) ◄── Entry point
  │  HOA Messenger (Free)
  └────────────────────────────────────── Features
        Amenity-only          Full HOA Suite
```

Neighbri wins by being the **best amenity booking tool at the lowest price point**, not by being another mediocre full-suite HOA product.
