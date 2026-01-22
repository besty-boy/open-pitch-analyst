export interface TrackPoint {
  timestamp: number;
  player_id: string;
  player_name?: string;
  jersey_number?: number;
  team_id?: string;
  half?: number;
  x: number;
  y: number;
  speed: number;
  heart_rate?: number;
  event?: string;
}

export interface ParseResult {
  data: TrackPoint[];
  meta: {
    fields?: string[];
    [key: string]: unknown;
  };
  errors: unknown[];
}
