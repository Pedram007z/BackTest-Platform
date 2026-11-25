/** A ready-made indicator of the platform, written in Pine Script (run by src/pine like the user's own). */
export interface LibraryIndicator {
  id: string;
  /** TradingView's name */
  name: string;
  nameFa: string;
  /** drawn over the candles (the script's own `overlay` decides; this is for the dialog's badge) */
  overlay: boolean;
  code: string;
}
