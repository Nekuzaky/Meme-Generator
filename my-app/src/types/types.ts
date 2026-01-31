export interface Meme {
  id: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  box_count: number;
}

export type TextEffect = "none" | "arc" | "shake" | "outline" | "gradient";

export interface RecentMeme {
  id?: string;
  name: string;
  url: string;
  source?: "tendance" | "perso";
  box_count?: number;
}

export interface Box {
  index: number;
  text: string;
  color: string;
  outline_color: string;
  fontSize: number;
  fontFamily: string;
  effect: TextEffect;
}
