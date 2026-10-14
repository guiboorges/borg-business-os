---
title: Reference Frameworks by Agent (Goals, Operations, Marketing, Acquisition, Ads, Strategist)
scope: [all]
source_type: knowledge
origin: Web research on current frameworks (2025/2026) by area, 2026-08-08
note: In Phase 5 this file will be split into 6 notes, each scoped to a specific agent.
---

# Knowledge Base — 6 AI Agents (BORG OS)

Context: frameworks calibrated for a small business — a single founder, SaaS or a service with a monthly subscription (ticket of ~€50–300/month) and an MRR goal in the thousands of euros. The concrete business is described in `src/config/business.ts`.

---

## 1. GOALS AGENT

### Framework 1: OKRs (John Doerr, "Measure What Matters")
- **Structure**: Objective = qualitative, inspiring, memorable. Key Results = 3–5 measurable, time-bound results. Golden rule: **if it has no number, it's not a Key Result**.
- **Practical rules**: at most 3 Objectives per quarter (for 1 founder: 1–2); KRs measure *outcomes*, not tasks ("publish 12 posts" is a task; "generate 30 leads via LinkedIn" is an outcome); scoring 0.0–1.0, where 0.7 is success for aspirational ("stretch") goals and 1.0 is mandatory for "committed" goals (e.g. cash flow).
- **CFR** (Conversations, Feedback, Recognition): the weekly conversation cadence around the OKRs matters more than the document.
- **OKR vs KPI distinction**: OKRs measure *change*; KPIs measure *health*. A small business needs both: health KPIs (MRR, churn, margin) monitored at all times + quarterly OKRs for what it wants to change.

### Framework 2: SMART goals (for the operational level)
- Specific, Measurable, Achievable, Relevant, Time-bound. Use SMART for *tasks and projects* (weekly/monthly level); use OKRs for *direction* (quarterly). Common mistake: using SMART for everything and ending up with goals that are too safe and change nothing.

### Framework 3: North Star Metric + KPI Tree
- **NSM for a small SaaS**: strong candidate: **MRR** or "active customers with a demonstrated result this month".
- **KPI Tree**: break the NSM down into levers: MRR = (leads/month × meeting rate × close rate × average ticket) − churn. Each agent in the company "owns" a branch of the tree: Marketing → leads; Acquisition → close rate; Ads/Delivery → retention.
- Rule: each KPI has 1 owner, 1 target, 1 data source. No owner = it doesn't exist.

### Framework 4: Weekly scorecard (EOS style, adapted to a micro-business)
- 5–15 numbers, reviewed every week on the same day, each with a target and a green/red status. Suggestion: new leads, meetings booked, proposals sent, proposals closed, MRR, cash in the bank, overdue deliveries, customer check-ins.
- Rule: look at **13 weeks of history** (the trend), not just the current week.

### Framework 5: Review cadence
- **Weekly (30–60 min)**: scorecard + KR progress + unblock 1–3 issues.
- **Monthly (2h)**: review the KPI tree, pipeline, margin per customer; adjust tactics.
- **Quarterly (half a day)**: close/score the OKRs, set the next ones, decide what to *stop* doing.
- **Annual (1–2 days)**: 3-year vision, revenue/margin target, niche focus.

### Common mistakes
- Too many OKRs (more than 3 = none); confusing tasks with results; setting them and never reviewing them ("set and forget"); tying OKRs to self-punishment instead of learning; copying big-company metrics.

### Key metrics for this area
MRR, new customers/quarter, churn (%), average ticket, pipeline coverage (3x the target), cash runway (months), % recurring revenue vs projects (target: more than 50% recurring).

**Sources**: [What Matters — OKR definition & examples](https://www.whatmatters.com/faqs/okr-meaning-definition-example) · [Measure What Matters — summary](https://grahammann.net/book-notes/measure-what-matters-by-john-doerr) · [Perdoo — OKRs vs KPIs](https://www.perdoo.com/resources/blog/two-things-measure-what-matters-got-wrong) · [Breakout Growth — OKRs + North Star](https://breakoutgrowth.net/2021/01/26/how-to-win-with-okrs-and-a-north-star-metric/)

---

## 2. OPERATIONS AGENT

### Framework 1: EOS / Traction (Gino Wickman)
- **6 components**: Vision, People, Data, Issues, Process, Traction. Practical tools for a solo founder:
  - **V/TO (Vision/Traction Organizer)**: 1 page with core values, core focus, 10-year target, 3-year picture, 1-year plan, the quarter's Rocks.
  - **Rocks**: 3–7 quarterly priorities (for a solo founder: 3). Whatever isn't a Rock waits.
  - **Level 10 Meeting** (adapted to solo + AI agents): weekly, 45 min: scorecard (5 min) → Rocks on/off track (5 min) → customer headlines (5 min) → last week's to-dos (5 min) → **IDS: Identify, Discuss, Solve** for the top 3 issues (25 min).
  - **Issues List**: everything that bothers you goes on the list; it's solved by priority, not in order of arrival.
  - **Accountability Chart**: even alone, map the "seats" (sales, marketing, delivery, finance) and what each one owns — it's the map for delegating to AI agents and future freelancers.
- EOS is the recommended system for small/simple companies; easy to self-implement with the books *Traction* and *Get a Grip*.

### Framework 2: Scaling Up / Rockefeller Habits (Verne Harnish)
- **4 decisions**: People, Strategy, Execution, **Cash** — the difference vs EOS is the deeper financial and strategic layer.
- **One-Page Strategic Plan (OPSP)**: vision, BHAG, brand promise, annual/quarterly priorities on one page.
- **Meeting rhythm** (daily huddle 5–15 min, weekly, monthly, quarterly) and a **quarterly theme** with a celebration.
- **Cash Conversion Cycle**: how many days between spending €1 and getting it back. Shorten it by billing in advance.
- Practical recommendation: use **EOS as the operating system** + borrow from Scaling Up the **Power of One** (the cash effect of improving price by 1%, volume by 1%, collections by 1 day) and the cash discipline.

### Framework 3: Cash flow management (small services/SaaS)
- Rules:
  1. **Bill in advance**: prepaid subscriptions (day 1 of the month); setup fees with a 40–50% deposit at signing, the rest by milestones — never "at the end".
  2. **13-week cash forecast**, updated weekly: expected inflows (per customer, with a realistic date), fixed outflows, weekly position.
  3. **Reserve**: 3 months of operating costs in the bank; beyond that, invest in growth.
  4. **Automatic collection** (direct debit/Stripe) for subscriptions; maximum 15-day terms on invoices; stop service when more than 30 days overdue.
  5. Customers' media spend **always on the customer's card**, never advanced by you.

### Framework 4: Unit economics (2025 benchmarks)
- **Delivery margin per customer**: price − cost of hours/tools to serve. Target: **50–60%+ gross per customer**. Quick formula: effective hourly cost × estimated hours × 1.2 (buffer) ÷ (1 − target margin) = minimum price.
- **Net margin**: digital agencies average ~13%; healthy target 15–25%; niche players reach 40%+ through specialisation.
- **Customer concentration**: no customer above 20–25% of revenue.
- **LTV:CAC**: LTV = average subscription × gross margin × average retention months. Target above 3:1.

### Common mistakes
- Not measuring margin per customer (there are always 1–2 customers quietly losing money); accepting scope creep without repricing; competing on price instead of specialisation; mixing media-spend cash with company cash; implementing all of EOS at once (start with scorecard + weekly meeting + Rocks).

### Key metrics for this area
Gross margin per customer (>50%), net margin (>15%), DSO (days to collect, <30), cash runway, % recurring revenue, concentration of the largest customer.

**Sources**: [EOS Worldwide — EOS vs Scaling Up](https://www.eosworldwide.com/eos-vs-scaling-up) · [Traction — summary](https://minchowcoders.com/insights/traction-book-summary/) · [Monkhouse — EOS vs Scaling Up](https://www.monkhouseandcompany.com/resources/blog/eos-vs-scaling-up/) · [Predictable Profits — benchmarks from 300+ agencies](https://predictableprofits.com/2025-agency-growth-benchmark-key-metrics-from-300-7-8-figure-agencies/) · [tmetric — 2025 benchmarks](https://blog.tmetric.com/marketing-agency-profitability-benchmarks/) · [iota Finance — cash flow](https://iota-finance.com/iota-finance-blog/agency-cash-flow-management) · [Supervisible — utilisation](https://www.supervisible.com/blog/agency-utilization-rate-benchmark)

---

## 3. MARKETING AGENT

### Framework 1: Positioning — April Dunford ("Obviously Awesome")
- **5 (+1) components**: 1) Competitive alternatives (what the customer would do without you — often "the nephew who builds websites" or "do nothing"); 2) Unique attributes; 3) Value; 4) The segment that cares most about it; 5) The market category that gives context; (+1) a relevant trend.
- **10-step process** (summary): drop the baggage of the old positioning → list your best current customers and what they have in common → map the alternatives → isolate the unique attributes → translate them into value → identify who cares the most → choose the category → layer on a trend → capture it in a document → align everything (website, pitch, proposal).
- Application: the unique attribute is usually a combination (e.g. "built for one niche + set up by us + automated") against generic tools (no service) and agencies (no software of their own).

### Framework 2: StoryBrand / SB7 (Donald Miller)
- **The customer is the hero; the business is the guide.** 7 elements: a character (the customer) → has a problem (external: "I waste hours answering bookings on WhatsApp"; internal: "I feel like I'm losing customers"; philosophical: "small businesses deserve quality tools") → meets a guide (empathy + authority: cases, numbers) → who gives them a plan (3 simple steps) → and calls them to action (direct + transitional CTA) → that helps them avoid failure → and ends in success.
- Use it as the skeleton for the **website, proposals and pitch**. Rule: if a visitor can't answer within 5 seconds "what do they do, how does it make my life better, how do I buy", the website fails (the "grunt test").

### Framework 3: AARRR funnel (Pirate Metrics) adapted to local B2B
- **Acquisition** (visits, followers, leads) → **Activation** (meeting/demo held) → **Revenue** (subscription closes) → **Retention** (renewal; month 4+ is the critical point) → **Referral** (a systematic referral request on day 90 with results in hand).
- Rule: measure conversion between stages and work on **the biggest bottleneck**, not everything at once.

### Framework 4: B2B inbound/content
- **A "proof, not promise" strategy**: case studies with numbers (before/after), public teardowns (without humiliating anyone), educational content that answers pre-purchase questions (price, timelines, "why I lose customers to manual WhatsApp").
- Pillars: 1 case study/month + 1 guide/week + repurposing on LinkedIn/Instagram. Local/niche SEO: pages per service+segment ("booking software for yoga studios", "CRM for clinics") beat generic keywords.
- 60% of B2B buyers discover brands through creator content before filling in a form.

### Framework 5: Organic LinkedIn/Instagram (2025/2026)
- **The founder's personal profile gets 5–7x more reach than the company page** — the strategy is the founder brand; the page is social proof.
- Current rules: 3–5 posts/week; short video and carousels get the most reach; the first 2 lines decide everything (the hook); zero external links in the body (put them in the comments); reply to every comment within 60 min; leave substantive comments on 5–10 posts/day from potential customers.
- Content mix: 40% educational, 30% proof (cases, behind the scenes), 20% opinion/positioning, 10% personal.
- For local and niche businesses, Instagram is usually the channel where the target customers are — the same founder-brand rules apply.

### Common mistakes
- Positioning as a generalist; a website that talks about itself instead of the customer; content with no CTA or capture; posting for 1 month and giving up (it compounds after 3–6 months); chasing vanity (likes) instead of conversations generated.

### Key metrics for this area
Inbound leads/month, conversations started via social/month, website visitor→lead rate (2–5% average; >10% top), % of proposals that mention content, CAC per channel.

**Sources**: [Obviously Awesome — summary](https://readingraphics.com/book-summary-obviously-awesome/) · [Heinz Marketing — 10 steps](https://www.heinzmarketing.com/blog/10-step-positioning-process-an-obviously-awesome-book-summary-part-3/) · [Dunford — positioning canvas](https://www.kathirvel.com/guide-april-dunford-positioning-framework/) · [Avenue Z — organic LinkedIn 2026](https://avenuez.com/blog/linkedin-organic-social-media-guide-for-brands/) · [Brixon — LinkedIn algorithm 2026](https://brixongroup.com/en/linkedin-algorithm-dos-donts-for-organic-visibility-in-the-b2b-sector) · [LaGrowthMachine — LinkedIn strategy 2026](https://lagrowthmachine.com/linkedin-marketing-strategy-2026/)

---

## 4. CUSTOMER ACQUISITION AGENT

### Framework 1: Predictable Revenue (Aaron Ross) — adapted to solo
- **Core ideas**: 1) role specialisation — prospecting ≠ closing (in a solo business: AI agents do the research/lists/1st contact, the founder runs the meetings); 2) **"Seeds, Nets, Spears"** — Seeds: referrals (best conversion, doesn't scale); Nets: inbound (medium scale); Spears: targeted outbound (controllable, predictable). A micro-business lives on Seeds+Spears while it builds Nets.
- 3) **Cold Calling 2.0**: never truly "cold" — a short DM/email to open a conversation, not to sell. Pipeline metric = qualified meetings booked/month, not messages sent.
- An outbound funnel with realistic 2025/26 numbers: 200 hyper-segmented contacts/month → 3.4% average reply rate (5–10% if personalised) → ~8–15 conversations → 4–6 meetings → 1–2 customers.

### Framework 2: Cold outreach that works in 2025/2026
- The average reply rate dropped from 8.5% (2019) to ~3.4% (2026). **Volume is dead; precision wins**: generic 500+ send campaigns get 2.1%; 5 minutes of research per account multiplies replies 3–5x.
- **Technical rules (email)**: a secondary domain for outbound (never the main one); SPF+DKIM+DMARC; 2–3 weeks of warm-up; max 20–30 emails/day/inbox; deliverability is the #1 variable, above the copy.
- **Copy**: 50–125 words; 1 specific observation about the business ("I noticed there's no booking link in your bio") + 1 value sentence + a low-friction CTA ("can I show you in 2 lines?"). Best window: Wednesday/Thursday morning.
- **DM (Instagram/LinkedIn)**: engage with their content first → a DM that continues a real conversation. Typical sequence: connect → day 2–3 value/question → day 7 a relevant case → day 14 CTA. Intent signals are worth more than cold lists.

### Framework 3: Qualification — simplified BANT + a touch of MEDDIC
- For tickets of ~€50–300/month, full MEDDIC is overkill. Use **BANT in 4 questions** on the 1st call: **Budget** (qualifying price early eliminates 80% of lost proposals); **Authority** (who else decides?); **Need** (what does not solving it cost? — quantify it: e.g. no-shows/month × service price); **Timeline** (why now?).
- Borrow from MEDDIC: identify the **Champion** and the **Decision Criteria**. A lead with no quantifiable pain and no deadline = nurture, don't pitch.

### Framework 4: SPIN Selling (Neil Rackham) — the diagnostic meeting
- Sequence: **S**ituation (minimal — research beforehand) → **P**roblem ("what isn't working?") → **I**mplication (the most important: "how much does that cost per month?") → **N**eed-payoff (the customer puts the value into words).
- Rule: whoever asks implication questions sells value; whoever presents services sells on price. Only present a proposal after the customer has said out loud what the solution is worth.

### Framework 5: Follow-up cadences
- **80% of sales need 5+ follow-ups; most people give up after the 2nd.** Standard post-proposal cadence: day 2 (summary + next step), day 5 (new value: a similar case), day 9 (remove the likely objection), day 14 (call), day 21 (a polite "break-up" — often what closes it). Every follow-up brings new value.
- Proposals with an expiry date (14 days) and 3 price options (anchoring) close more.

### Common mistakes
- Selling instead of talking on the 1st contact; fake personalisation mass-generated by AI (detectable — it's the main driver of falling reply rates); not qualifying budget early; long proposals instead of 1 page with 3 options; giving up at the 2nd contact; measuring messages sent instead of meetings booked.

### Key metrics for this area
Qualified meetings/month (the #1 metric), reply rate (good: >5%; excellent: >10%), reply→meeting, meeting→proposal, proposal→close (target: >40% if you qualify well), sales cycle (days), 3x pipeline coverage, deliverability >95%.

**Sources**: [Predictable Revenue — summary](https://grahammann.net/book-notes/predictable-revenue-aaron-ross-marylou-tyler) · [Belkins — reply rates 2026](https://belkins.io/blog/cold-email-response-rates) · [Instantly — benchmark report 2026](https://instantly.ai/cold-email-benchmark-report-2026) · [UnifyGTM — deliverability and sequences](https://www.unifygtm.com/explore/cold-email-2026-domain-setup-deliverability-sequences) · [Martal — B2B statistics 2026](https://martal.ca/b2b-cold-email-statistics-lb/) · [Salesmotion — outbound playbook 2026](https://salesmotion.io/blog/cold-outreach-best-practices) · [B2B Playbook — 12 methodologies compared](https://theb2bplaybook.com/best-sales-methodologies)

---

## 5. ADS MANAGER AGENT

### Framework 1: Meta Ads in 2025/2026 (Advantage+)
- Advantage+ = **demand creation**: it finds people who match the conversion profile but aren't searching. ASC averages 4.52x ROAS, ~22% above manual campaigns — **when fed correctly**.
- Rules for small budgets (€500–1500/month): 1 Advantage+ sales/leads campaign (consolidation — no 5 ad sets competing); **10–12 active creatives** (a mix of short video, static, carousel) — in 2026 the creative IS the targeting; exclude existing customers; **cap retargeting at 15–20% of the budget**; minimum ~50 conversions/week per campaign — if you don't have them, optimise for an event higher up the funnel (lead instead of purchase).
- **Mandatory tracking**: Pixel + **CAPI (server-side)**; without clean conversion data no algorithm learns.

### Framework 2: Google Ads in 2025/2026 (Search + Performance Max)
- PMax = multi-channel **intent capture**. Rules: never start with PMax without a conversion history — start with **high-intent Search** (exact/phrase, 10–20 keywords, concentrated budget); PMax only with a feed or 30+ conversions/month; exclude brand from PMax (otherwise it cannibalises cheap brand searches).
- Enhanced Conversions on; weekly negative keyword reviews.
- **Allocation (2026 rule of thumb)**: under €3k/month → choose ONE platform (Meta if demand is latent/B2C/visual; Google Search if intent is clear); over €3k/month → both, full-funnel.

### Framework 3: Structure for small budgets (€500–3000/month)
- €500–1000: 1 platform, 1 campaign, 1 conversion objective, 3–6 creatives; no parallel tests.
- €1000–2000: 80% on the main campaign + 20% testing creatives/segments.
- €2000–3000: 2 platforms OR a full funnel on one (prospecting + capped retargeting).
- Management rules: daily budget ≥ 2–3x the target CPA; let the learning phase run 7 days/50 conversions without touching it; 1 change at a time; evaluate at 7 days, decide at 14–30; kill creatives with frequency >3–4 or a CPA 2x above target.

### Framework 4: Metrics and formulas
- **ROAS** = revenue/spend. Minimum viable ROAS = 1 ÷ gross margin (40% margin → 2.5x break-even). Set tROAS/tCPA only after real data.
- **CPA/CPL**: 2025 benchmarks — average Google Ads CPL ~$70 (B2B services ~$100+); Meta ~$28–42 and rising ~20%/year. Always use your industry's benchmark, not the overall average.
- **The full chain**: CPL is vanity if the leads don't close — measure **CPL → cost per qualified lead → CAC → LTV:CAC >3**. Monthly report in euros, not clicks.

### Framework 5: Landing pages / basic CRO
- Benchmarks: average conversion 2–6%; top 10% above 10%. A dedicated landing page per campaign (never the homepage).
- Minimum checklist: message match with the ad; a headline with benefit + proof; 1 single repeated CTA; a minimal form (3–4 fields); social proof near the CTA; <3s load on mobile; an objections section.
- Tests in order of impact: offer → headline → form → social proof → design. 1 test at a time.

### Common mistakes
- Touching the campaign during the learning phase; 10 campaigns at €10/day instead of 1 at €100; PMax with no conversions and no brand exclusion; trusting the platform's ROAS without looking at incrementality; paid traffic to the homepage; promising results in week 1 (it takes 4–6 weeks to stabilise).

### Key metrics for this area
ROAS (vs the calculated break-even), CPA/CPL vs the industry benchmark, CTR, CPM (a proxy for creative fatigue), frequency, landing page conversion rate, % qualified leads, LTV:CAC.

**Sources**: [Pixis — Advantage+ vs PMax 2026](https://pixis.ai/blog/advantage-vs-performance-max-head-to-head-2026/) · [Meixner — PMax vs Advantage+](https://meixner-tobias.com/en/blog/performance-max-vs-advantage-plus/) · [Ryze — Google/Meta allocation](https://www.get-ryze.ai/blog/budget-allocation-google-meta-ads-guide-2026) · [WordStream — 2025 benchmarks](https://www.wordstream.com/blog/2025-google-ads-benchmarks) · [Adamigo — Meta CPL 2026](https://www.adamigo.ai/blog/meta-ads-cost-per-lead-benchmarks-industry-2026) · [Landerlab — landing page conversion](https://landerlab.io/blog/landing-page-conversion-rate) · [Unbounce — CRO](https://unbounce.com/conversion-rate-optimization/cro-best-practices/)

---

## 6. STRATEGIST AGENT

### Framework 1: Practical competitive analysis
- A map in 3 rings: **direct** (competing software/platforms in the same niche), **indirect** (generic DIY tools, Excel spreadsheets, hiring an agency), **status quo** (doing nothing — the #1 competitor for small businesses).
- Per competitor: stated positioning, visible prices, niche, proof (cases), acquisition channels, reviews (competitors' complaints are your differentiation roadmap). A light quarterly refresh (2h).

### Framework 2: Basic Blue Ocean (Kim & Mauborgne)
- **Strategy Canvas**: X axis = the factors the industry competes on (price, features, support, location…); Y axis = offering level. Draw the curve of typical competitors vs your own.
- **ERRC grid**: **Eliminate**, **Reduce**, **Raise**, **Create** (e.g. setup done by us, automations in the customer's language, local legal requirements — factors generic tools don't offer).
- Note: Blue Ocean is not a synonym for niche — it's redesigning the value factors to make direct comparison irrelevant.

### Framework 3: Value-based pricing + price ladders
- Principle: price anchored on **value to the customer**, not on hours/costs. If the product recovers €500/month for the customer (e.g. no-shows avoided), €100/month is an obvious return; always communicate in that ratio.
- Safety floor (cost-plus as a sanity check): cost to serve × 1.2 ÷ target margin of 55–60% = minimum price. Never sell below it.
- **3 tiers per proposal** (anchoring): Essential / Recommended (the one you want to sell) / Premium.
- Hybrid models: setup fee + subscription works well (cash up front + recurring revenue).

### Framework 4: Productised services
- Turn offers into **products with a fixed scope, price and timeline**: e.g. "Complete setup in 14 days — €X"; "Digital audit — €X". A cheap, fast entry offer as the door to the subscription.
- Rules: a written scope including what is NOT included; a documented, repeatable process (it's what makes delegating to AI agents possible); the fastest-growing companies combine productised entry offers + recurring revenue for those who "graduate".

### Framework 5: Annual/quarterly strategic roadmap
- Cadence: **annual** — 3-year vision, 3–5 priorities for the year, financial targets; **quarterly** — 3 Rocks aligned with the annual priorities, a review of the competitive canvas, an explicit *stop doing* decision.
- Growth sequence for a solo founder: 1) prove 1 offer in a niche → 2) productise and raise the price → 3) stack subscriptions up to ~80% of capacity → 4) automate/delegate delivery → 5) only then broaden the offer or niche.

### Framework 6: Niche focus decision
- Scoring criteria (1–5 each; choose the niche with the highest total): existing experience/cases; ability to pay; urgent and quantifiable pain; reachability (can you get to them?); a large enough market (500+ companies); weak specialised competition; you enjoy working with them.
- Execution rule: choose 1 niche for 2 quarters, focus all marketing/outbound on it **without turning down** out-of-niche customers who come by referral ("a marketing niche, not a billing niche"). Niche companies reach much higher margins.

### Common mistakes
- Putting off choosing a niche for fear of missing opportunities; hourly pricing communicated to the customer; copying competitors' prices without knowing your own costs; an annual strategy nobody reviews; changing strategy every month out of anxiety (give each bet 2 quarters).

### Key metrics for this area
% of revenue from the target niche, average ticket (should rise every quarter of specialisation), proposal win rate (rises with focus), margin per offer type, % recurring revenue, time to sale, NPS/retention per segment.

**Sources**: [ManyRequests — productized services](https://www.manyrequests.com/blog/productized-service-guide) · [ManyRequests — pricing models](https://www.manyrequests.com/blog/agency-pricing-models) · [Toggl — pricing 2025](https://toggl.com/resources/agency-pricing/) · [GigRadar — retainers 2026](https://gigradar.io/blog/retainer-pricing) · [Space Ads — Blue Ocean applied](https://www.spaceads.agency/blog/what-is-blue-ocean-strategy-and-how-to-use-it) · [Blue Ocean Thinking — what it isn't](https://blueoceanthinking.substack.com/p/what-isnt-blue-ocean-strategy-niche) · [Culta — margins by type](https://culta.ai/blog/agency-profit-margins)

---

## Cross-cutting note (connects the 6 agents)

The KPI tree unifies everything: the **Strategist** defines niche/offer/price → **Marketing** generates demand (leads) → **Acquisition** converts (meetings→customers) → the **Ads Manager** delivers results that sustain retention → **Operations** safeguards margin and cash → **Goals** measures the whole cycle on a weekly/quarterly cadence. Each agent reports 3–5 metrics from its branch to the single weekly scorecard run by the Goals Agent.
