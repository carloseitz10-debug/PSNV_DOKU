export type Gender = 'weiblich' | 'männlich' | 'divers' | 'unbekannt';
export type Role = 'Betroffene:r' | 'Angehörige:r' | 'Zeug:in' | 'Einsatzkraft' | 'Andere';

export interface Affected {
  name: string;
  age: string;
  gender: Gender;
  role: Role;
}

export interface Mission {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Einsatzdaten – neue Zeitstempel
  alarmierungDatum: string; // YYYY-MM-DD
  alarmierungZeit: string;  // HH:mm
  eintreffenDatum: string;
  eintreffenZeit: string;
  einsatzendeDatum: string;
  einsatzendeZeit: string;

  einsatzOrt: string;
  einsatzNummer: string;
  einsatzkraft: string;

  // Organisation – Einzelauswahl aus Liste + optional benutzerdefiniert
  organisation: string;

  // Stichwort/Ereignisart – Mehrfachauswahl + optional Freitext
  stichworte: string[];
  stichwortSonstiges: string;

  // Betroffene
  betroffene: Affected[];

  // Situation an der Einsatzstelle
  einsatzkraefteVorOrt: string[];
  nachforderungen: string[];
  nachforderungenSonstiges: string;

  // Setting (früher: Zustand & Symptome)
  setting: string[];              // 'gut' und/oder 'optimiert'
  settingNotiz: string;           // Freitext direkt nach den Checkboxen
  weitereBeobachtungen: string;   // bleibt

  // Maßnahmen
  massnahmen: string[];
  massnahmenNotiz: string;

  // Verlauf
  verlauf: string;

  // Übergabe
  uebergabeAn: string;
  uebergabeNotiz: string;

  // Eigene Notizen
  eigeneNotizen: string;

  // Automatisch berechnet aus (einsatzende - alarmierung) in Minuten
  dauerMinuten: number;

  locked: boolean;
}

export interface Settings {
  einsatzkraft: string;
  organisation: string;                // Standard-Vorauswahl
  customStichworte: string[];          // vom Nutzer ergänzt
  customOrganisationen: string[];      // vom Nutzer ergänzt
}

export const STICHWORT_DEFAULT_OPTIONS = [
  'Tod im häuslichen Bereich – nicht suizid',
  'Tod im öffentlichen Bereich',
  'Tod eines Kindes unter 18',
  'SIDS (Sudden Infant Death Syndrom)',
  'Suizid',
  'Suizidversuch',
  'Überbringung Todesnachricht',
  'Überbringung Unfallnachricht',
  'Verkehrsunfall',
  'Betriebs-/Arbeitsunfall',
  'Einsatz abgebrochen/abbestellt',
  'Gewalterfahrung',
];

export const ORGANISATION_DEFAULT_OPTIONS = [
  'BRK',
  'Malteser',
  'kath. Kirche',
  'ev. Kirche',
];

export const EINSATZKRAEFTE_VOR_ORT_OPTIONS = [
  'Rettungsdienst',
  'Notarzt',
  'Polizei',
  'Kriminaldauerdienst',
];

export const NACHFORDERUNG_OPTIONS = [
  'weitere PSNV Kräfte',
  'Leitung PSNV',
  'SEG Betreuung',
  'Seelsorge',
  'weitere',
];

export const SETTING_OPTIONS = ['gut', 'optimiert'];

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
  'aktives empathisches Zuhören',
  'Aktivierung soziales Netz',
  'Strukturierung der nächsten Tage',
  'Vermittlung institutioneller Hilfe',
  'Begleitung der/des Betroffenen',
  'Seelsorgerische Einrichtung',
  'Psychosoziale Einrichtung',
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
