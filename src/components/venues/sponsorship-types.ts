/** Shared types for venue sponsorship board components. */

export interface Slot {
  id: string;
  startDate: string;
  endDate: string;
  price?: number;
  status: string;
  sponsorId?: string;
  sponsorName?: string;
  campaign?: string;
}

export interface PlacementWithSlots {
  id: string;
  startDate: string;
  endDate?: string;
  machineName?: string;
  slots: Slot[];
}

export interface SponsorOption {
  id: string;
  name: string;
}
