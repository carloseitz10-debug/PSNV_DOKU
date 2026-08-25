export type Gender = 'weiblich' | 'männlich' | 'divers' | 'unbekannt';
export type Role = 'Betroffene:r' | 'Angehörige:r' | 'Zeug:in' | 'Einsatzkraft' | 'Andere';

export interface Affected {
  name: string; // "N.N." allowed
  age: string; // free text (child, elderly, "45", "unbekannt")
  gender: Gender;
  role: Role;
}

export interface Mission {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  // Einsatzdaten
  einsatzDatum: string; // ISO date (YYYY-MM-DD)
  einsatzZeit: string; // HH:mm
  einsatzOrt: string;
  stichwort: string; // Ereignisart / Stichwort
  einsatzkraft: string;
  organisation: string;
  einsatzNummer: string;
  // Betroffene
  betroffene: Affected[];
  // Zustand & Symptome
  symptome: string[]; // selected chips
  symptomeNotiz: string;
  // Maßnahmen
  massnahmen: string[]; // selected chips
  massnahmenNotiz: string;
  // Verlauf
  verlauf: string;
  // Übergabe
  uebergabeAn: string;
  uebergabeNotiz: string;
  // Custom / Freitext
  eigeneNotizen: string;
  dauerMinuten: string;
  locked: boolean;
}

export interface Settings {
  einsatzkraft: string;
  organisation: string;
}

export const SYMPTOME_OPTIONS = [
  'Schock',
  'Trauer',
  'Angst / Panik',
  'Weinen',
  'Hyperventilation',
  'Erstarrung',
  'Verwirrtheit / Desorientierung',
  'Aggression',
  'Schweigen / Rückzug',
  'Schuldgefühle',
  'Körperliche Reaktion (Zittern, Übelkeit)',
];

export const MASSNAHMEN_OPTIONS = [
  'Erstkontakt / Präsenz',
  'Stabilisierung',
  'Gesprächsführung / Aktives Zuhören',
  'Beruhigung / Reorientierung',
  'Information / Aufklärung',
  'Ressourcenaktivierung',
  'Kontakt zu Angehörigen',
  'Vermittlung Weiterversorgung',
  'Abschied ermöglichen',
  'Kinderspezifische Betreuung',
];

export const UEBERGABE_OPTIONS = [
  'Angehörige',
  'Hausarzt / Klinik',
  'Seelsorge',
  'Kriseninterventionsteam',
  'Polizei / Behörde',
  'Keine (selbständig)',
  'Andere',
];
