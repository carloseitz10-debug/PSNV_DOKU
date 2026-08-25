import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mission, Settings } from '../types';

const MISSIONS_KEY = '@psnv:missions';
const SETTINGS_KEY = '@psnv:settings';

// Migrate legacy fields onto current schema
function migrate(raw: any): Mission {
  const alarmDatum = raw.alarmierungDatum ?? raw.einsatzDatum ?? '';
  const alarmZeit = raw.alarmierungZeit ?? raw.einsatzZeit ?? '';
  const legacyStichwort: string | undefined = raw.stichwort;
  const stichworte: string[] = Array.isArray(raw.stichworte)
    ? raw.stichworte
    : legacyStichwort
      ? [legacyStichwort]
      : [];
  const dauer =
    typeof raw.dauerMinuten === 'number'
      ? raw.dauerMinuten
      : typeof raw.dauerMinuten === 'string' && raw.dauerMinuten.trim()
        ? parseInt(raw.dauerMinuten, 10) || 0
        : 0;

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? raw.createdAt,
    alarmierungDatum: alarmDatum,
    alarmierungZeit: alarmZeit,
    eintreffenDatum: raw.eintreffenDatum ?? '',
    eintreffenZeit: raw.eintreffenZeit ?? '',
    einsatzendeDatum: raw.einsatzendeDatum ?? '',
    einsatzendeZeit: raw.einsatzendeZeit ?? '',
    einsatzOrt: raw.einsatzOrt ?? '',
    einsatzNummer: raw.einsatzNummer ?? '',
    einsatzkraft: raw.einsatzkraft ?? '',
    organisation: raw.organisation ?? '',
    stichworte,
    stichwortSonstiges: raw.stichwortSonstiges ?? '',
    betroffene:
      Array.isArray(raw.betroffene) && raw.betroffene.length > 0
        ? raw.betroffene
        : [{ name: '', age: '', gender: 'unbekannt', role: 'Betroffene:r' }],
    einsatzkraefteVorOrt: Array.isArray(raw.einsatzkraefteVorOrt)
      ? raw.einsatzkraefteVorOrt
      : [],
    nachforderungen: Array.isArray(raw.nachforderungen) ? raw.nachforderungen : [],
    nachforderungenSonstiges: raw.nachforderungenSonstiges ?? '',
    setting: Array.isArray(raw.setting) ? raw.setting : [],
    settingNotiz: raw.settingNotiz ?? '',
    weitereBeobachtungen: raw.weitereBeobachtungen ?? raw.symptomeNotiz ?? '',
    massnahmen: Array.isArray(raw.massnahmen) ? raw.massnahmen : [],
    massnahmenNotiz: raw.massnahmenNotiz ?? '',
    verlauf: raw.verlauf ?? '',
    uebergabeAn: raw.uebergabeAn ?? '',
    uebergabeNotiz: raw.uebergabeNotiz ?? '',
    eigeneNotizen: raw.eigeneNotizen ?? '',
    dauerMinuten: dauer,
    locked: raw.locked ?? false,
  };
}

export async function getAllMissions(): Promise<Mission[]> {
  try {
    const raw = await AsyncStorage.getItem(MISSIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as any[];
    const normalized = list.map(migrate);
    return normalized.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}

export async function getMission(id: string): Promise<Mission | null> {
  const all = await getAllMissions();
  return all.find((m) => m.id === id) ?? null;
}

export async function saveMission(mission: Mission): Promise<void> {
  const all = await getAllMissions();
  const idx = all.findIndex((m) => m.id === mission.id);
  if (idx >= 0) {
    all[idx] = mission;
  } else {
    all.unshift(mission);
  }
  await AsyncStorage.setItem(MISSIONS_KEY, JSON.stringify(all));
}

export async function deleteMission(id: string): Promise<void> {
  const all = await getAllMissions();
  const filtered = all.filter((m) => m.id !== id);
  await AsyncStorage.setItem(MISSIONS_KEY, JSON.stringify(filtered));
}

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        einsatzkraft: '',
        organisation: '',
        customStichworte: [],
        customOrganisationen: [],
      };
    }
    const parsed = JSON.parse(raw);
    return {
      einsatzkraft: parsed.einsatzkraft ?? '',
      organisation: parsed.organisation ?? '',
      customStichworte: Array.isArray(parsed.customStichworte)
        ? parsed.customStichworte
        : [],
      customOrganisationen: Array.isArray(parsed.customOrganisationen)
        ? parsed.customOrganisationen
        : [],
    };
  } catch {
    return {
      einsatzkraft: '',
      organisation: '',
      customStichworte: [],
      customOrganisationen: [],
    };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function addCustomStichwort(value: string): Promise<Settings> {
  const s = await getSettings();
  const clean = value.trim();
  if (clean && !s.customStichworte.includes(clean)) {
    const next = { ...s, customStichworte: [...s.customStichworte, clean] };
    await saveSettings(next);
    return next;
  }
  return s;
}

export async function addCustomOrganisation(value: string): Promise<Settings> {
  const s = await getSettings();
  const clean = value.trim();
  if (clean && !s.customOrganisationen.includes(clean)) {
    const next = {
      ...s,
      customOrganisationen: [...s.customOrganisationen, clean],
    };
    await saveSettings(next);
    return next;
  }
  return s;
}

export async function removeCustomStichwort(value: string): Promise<Settings> {
  const s = await getSettings();
  const next = { ...s, customStichworte: s.customStichworte.filter((x) => x !== value) };
  await saveSettings(next);
  return next;
}

export async function removeCustomOrganisation(value: string): Promise<Settings> {
  const s = await getSettings();
  const next = {
    ...s,
    customOrganisationen: s.customOrganisationen.filter((x) => x !== value),
  };
  await saveSettings(next);
  return next;
}

export function newMissionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
