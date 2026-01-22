export interface TrackPoint {
  timestamp: number;
  player_id: string;
  x: number;
  y: number;
  speed: number;
}

export interface ParseResult {
  data: TrackPoint[];
  meta: {
    fields?: string[];
    [key: string]: unknown;
  };
  errors: unknown[];
}
