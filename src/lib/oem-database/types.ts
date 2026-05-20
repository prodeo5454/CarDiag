import type { DTCCategory, DTCSeverity } from '@/types';

/** Compact row in dtc-bundle.json: [manufacturer, description, category, severity] */
export type CompactDTCRow = [string, string, DTCCategory, DTCSeverity];

export interface OEMDTCBundle {
  version: number;
  updated: string;
  attribution: string[];
  stats: {
    uniqueCodes: number;
    totalDefinitions: number;
    sourceFiles: number;
  };
  codes: Record<string, CompactDTCRow[]>;
}

export interface OEMLookupResult {
  code: string;
  description: string;
  manufacturer: string;
  category: DTCCategory;
  severity: DTCSeverity;
}
