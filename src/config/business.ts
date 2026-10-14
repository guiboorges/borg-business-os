/**
 * The business the 6 agents serve.
 *
 * To adapt BORG OS to another business, edit ONLY this file: the agents read the
 * context, audience, price, goal and Obsidian vault anchor notes from here.
 *
 * The values below describe a FICTIONAL example business ("Lumen").
 * This file goes into the system prompt (the stable, cached block), so don't put
 * dates or numbers that change every day here — those come from the data tools.
 */
export const BUSINESS = {
  name: "Lumen",
  whatItIs:
    "a booking app for small yoga and pilates studios: students book and pay in one tap; the studio manages classes, waiting lists and class packs",
  customers: "yoga and pilates studios with 1 to 3 rooms",
  niches: "yoga, pilates and dance studios",
  mainChannel: "Instagram",
  model: "monthly subscription per studio",
  monthlyPrice: "€49/month",
  stage: "the stage of acquiring the first customers",
  team: "a single founder",
  alternatives: "manual WhatsApp, Excel spreadsheets and generic schedulers",
  differentiator:
    "built for small studios + set up by us in one day + automatic reminders that cut no-shows",
  customerProblem: "I waste hours answering bookings on WhatsApp and students don't show up without warning",
  quantifiablePain: "no-shows per month × class price",
  highIntentSearch: "booking software for yoga studios",
  yearGoal: "30 paying studios with MRR of €1,500 by December",
  shortGoal: "MRR €1,500 by December",
  runsAds: false,
  language: "English",

  // Obsidian vault notes each agent reads first (paths relative to the vault root).
  notes: {
    overview: "00 - Context/MASTER-CONTEXT.md",
    goals: "00 - Context/Goals.md",
    decisions: "00 - Context/Decisions",
    strategy: "01 - Strategy",
    brand: "03 - Marketing/Positioning.md",
    website: "03 - Marketing/Website.md",
  },
} as const;

/** Knowledge bases shared by all agents (copied into the vault by `npm run seed:knowledge`). */
export const KNOWLEDGE = [
  "09 - Agents/Knowledge/g4-methodology.md",
  "09 - Agents/Knowledge/frameworks-by-agent.md",
];
