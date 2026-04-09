// Performance tiers based on points
export const PERFORMANCE_TIERS = [
  { pts: 10, label: "Nice!", color: "#aaa", emoji: "✨" },
  { pts: 30, label: "Sweet!", color: "#FF9F43", emoji: "🍬" },
  { pts: 60, label: "Tasty!", color: "#4ECDC4", emoji: "😋" },
  { pts: 100, label: "Delicious!", color: "#FF6B9D", emoji: "🤩" },
  { pts: 150, label: "On Fire!", color: "#FFD93D", emoji: "🔥" },
  { pts: 200, label: "UNSTOPPABLE!", color: "#A55EEA", emoji: "💥" },
  { pts: 300, label: "CANDY LEGEND!", color: "#fff", emoji: "👑" },
];

// Chain combo words
export const CHAIN_WORDS = [
  "Sweet!",
  "Incredible!",
  "Amazing!!",
  "LEGENDARY!!!",
  "GODLIKE!!!!",
  "UNSTOPPABLE!!!!!",
];

// Get performance label based on points
export function getPerformanceLabel(pts: number) {
  let best = PERFORMANCE_TIERS[0];
  for (const tier of PERFORMANCE_TIERS) {
    if (pts >= tier.pts) best = tier;
  }
  return best;
}

// Get rank based on total score
export function getRankLabel(score: number) {
  if (score < 50) return { emoji: "😅", label: "Newbie", color: "#aaa" };
  if (score < 150) return { emoji: "🍬", label: "Caramel", color: "#FF9F43" };
  if (score < 300) return { emoji: "🍊", label: "Citrus", color: "#4ECDC4" };
  if (score < 500) return { emoji: "🍭", label: "Lollipop", color: "#FF6B9D" };
  if (score < 750) return { emoji: "⭐", label: "Starman", color: "#FFD93D" };
  if (score < 1000) return { emoji: "🔥", label: "Blazer", color: "#A55EEA" };
  return { emoji: "👑", label: "CANDY GOD", color: "#fff" };
}
