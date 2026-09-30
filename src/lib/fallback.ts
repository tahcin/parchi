import type { Explanation } from "./gemini";
import type { Language } from "./i18n";
import type { Audit } from "./rules";

// Used only when Gemini can't write the explanation (free-tier quota spent or the service down).
// The verdict itself comes from the rule engine either way, so the farmer still gets the stamp,
// a line per product and the dealer note. The words are plainer: the level labels from the UI
// strings in the farmer's language, and the rule engine's own English details for the dealer.
export function fallbackWords(a: Audit, lang: Language): Explanation {
  const s = lang.s;
  const headline = s[a.level];
  const products = a.products.map((p) => ({ id: p.id, line: s[p.level] }));
  const spoken = [headline, ...a.products.map((p) => `${p.written}: ${s[p.level]}`)].join(". ");

  const flagged = a.products.filter((p) => p.flags.length);
  const english = flagged.length
    ? "According to CIB&RC, Government of India records: " +
      flagged.map((p) => `${p.written}: ${p.flags[0].detail.replace(/\.$/, "")}.`).join(" ") +
      " Please give me a product approved for this crop instead."
    : "According to CIB&RC, Government of India records, every product on this chit is approved for this crop. Please write the dose as per the label.";

  return { headline, spoken, products, dealerCard: { local: headline, english }, whatToDo: [] };
}
