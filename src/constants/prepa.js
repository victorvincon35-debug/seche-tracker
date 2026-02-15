export const PREPA_CATEGORIES = [
  {
    id: "mesures",
    label: "Mesures",
    emoji: "📏",
    color: "#4a90d9",
    items: [
      { id: "metre", label: "Mètre de couture", emoji: "📏" },
      { id: "balance", label: "Balance de précision", emoji: "⚖️" },
    ],
  },
  {
    id: "equipement",
    label: "Équipement",
    emoji: "🏋️",
    color: "#e94560",
    items: [
      { id: "elastique", label: "Élastique de résistance", emoji: "🔴" },
      { id: "tapis", label: "Tapis de sol", emoji: "🧘" },
      { id: "shaker", label: "Shaker", emoji: "🥤" },
    ],
  },
  {
    id: "supplements",
    label: "Suppléments",
    emoji: "💊",
    color: "#ff9800",
    items: [
      { id: "whey", label: "Whey protéine", emoji: "🥛" },
      { id: "creatine", label: "Créatine", emoji: "💪" },
      { id: "magnesium", label: "Magnésium", emoji: "🧪" },
      { id: "omega3", label: "Oméga 3", emoji: "🐟" },
      { id: "vitd", label: "Vitamine D", emoji: "☀️" },
      { id: "zinc", label: "Zinc", emoji: "🔬" },
      { id: "collagene", label: "Collagène", emoji: "🦴" },
      { id: "calcium", label: "Calcium", emoji: "🥛" },
      { id: "probiotiques", label: "Probiotiques", emoji: "🦠" },
      { id: "curcuma", label: "Curcuma", emoji: "🌿" },
      { id: "psyllium", label: "Psyllium", emoji: "🌾" },
    ],
  },
  {
    id: "divers",
    label: "Divers",
    emoji: "📦",
    color: "#4caf50",
    items: [
      { id: "carnet", label: "Carnet de suivi", emoji: "📓" },
      { id: "thermometre", label: "Thermomètre", emoji: "🌡️" },
    ],
  },
];

export function getAllPrepaItems() {
  const items = [];
  for (const cat of PREPA_CATEGORIES) {
    for (const item of cat.items) {
      items.push({ ...item, category: cat.id });
    }
  }
  return items;
}
