import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mission, Settings } from '../types';

const MISSIONS_KEY = '@psnv:missions';
const SETTINGS_KEY = '@psnv:settings';

export async function getAllMissions(): Promise<Mission[]> {
  try {
    const raw = await AsyncStorage.getItem(MISSIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Mission[];
    // newest first
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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
    if (!raw) return { einsatzkraft: '', organisation: '' };
    return JSON.parse(raw) as Settings;
  } catch {
    return { einsatzkraft: '', organisation: '' };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function newMissionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
