/** Pipeline velocity: content created per week, grouped by status. */
export interface PipelineVelocityRow {
  week: string;
  status: string;
  count: number;
}

/** Series performance: total content and views per series type. */
export interface SeriesPerformanceRow {
  series_type: string;
  count: number;
  total_views: number;
}

/** Summary of Typefully drafts (lightweight, for the analytics card). */
export interface TypefullySummary {
  connected: boolean;
  draftCount: number;
  error: string | null;
}
