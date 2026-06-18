/**
 * Physical machine-build value constants and shared types.
 *
 * Kept in a plain module (NOT a `"use server"` file) so the runtime value
 * `SPIRAL_SIZES` can be exported and imported by client components. A
 * `"use server"` file may only export async functions, so these live here
 * rather than alongside the configuration server actions.
 */

/** Physical vend mechanism for a single machine lane / column. */
export type MachineMechanism = "belt" | "pusher" | "spiral";
export type MachineWidth = "single" | "double";
export type SpiralSize = 5 | 6 | 7 | 11 | 15;

export interface MachineLane {
  mechanism: MachineMechanism;
  width: MachineWidth;
  /** Only meaningful when mechanism === "spiral". */
  spiralSize?: SpiralSize;
  /** Name of the product loaded into this lane (from the product mix). */
  product?: string;
}

export const SPIRAL_SIZES: SpiralSize[] = [5, 6, 7, 11, 15];
