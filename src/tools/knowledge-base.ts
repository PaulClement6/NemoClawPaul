import { FaqEntry } from "../types";
import { loadData } from "./data-loader";

/**
 * Search the FAQ knowledge base using simple keyword matching.
 * Splits the query into words, scores each FAQ entry by keyword overlap
 * (matching against question, answer, and keywords fields), and returns
 * the top 3 matches.
 */
export function searchKnowledgeBase(query: string): object {
  let entries: FaqEntry[];
  try {
    entries = loadData<FaqEntry[]>("faq.json");
  } catch {
    return { error: "Knowledge base is currently unavailable." };
  }

  const queryWords = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) {
    return { error: "Query is too short or contains no searchable terms." };
  }

  const scored = entries.map((entry) => {
    const corpus = [
      entry.question,
      entry.answer,
      ...(entry.keywords || []),
      entry.category || "",
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const word of queryWords) {
      if (corpus.includes(word)) {
        score += 1;
      }
    }
    // Bonus for keyword-field exact matches
    for (const word of queryWords) {
      if (
        entry.keywords &&
        entry.keywords.some((k) => k.toLowerCase() === word)
      ) {
        score += 0.5;
      }
    }
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const topMatches = scored.filter((s) => s.score > 0).slice(0, 3);

  if (topMatches.length === 0) {
    return {
      results: [],
      message:
        "No matching FAQ entries found. Consider rephrasing the query or escalating to a specialist.",
    };
  }

  return {
    results: topMatches.map((m) => ({
      id: m.entry.id,
      question: m.entry.question,
      answer: m.entry.answer,
      category: m.entry.category,
      relevance_score: m.score,
    })),
  };
}
