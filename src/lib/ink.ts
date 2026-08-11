/** Ledger ink palette — one shared set for categories across tasks, meetings, notes */
export const INK_PALETTE = [
  { name: "Sage", hex: "#6B8F71" },
  { name: "Rust", hex: "#B5533C" },
  { name: "Brass", hex: "#C9A227" },
  { name: "Dusty Blue", hex: "#5C7A99" },
  { name: "Plum", hex: "#7A5C74" },
  { name: "Teal", hex: "#4E7A72" },
  { name: "Ochre", hex: "#A8842C" },
  { name: "Slate", hex: "#6E7484" },
] as const;

export type InkColor = (typeof INK_PALETTE)[number]["hex"];

export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}
