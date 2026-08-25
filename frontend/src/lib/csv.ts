import * as Sharing from 'expo-sharing';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { Mission } from '../types';
import { formatDuration } from './duration';

const SEP = ';';

function esc(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return '';
  const str = String(s);
  // Escape quotes, wrap in quotes if it contains sep/newline/quote
  if (str.includes(SEP) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function list(items: string[] | undefined): string {
  if (!items || items.length === 0) return '';
  return items.join(' | ');
}

const HEADERS = [
  'ID',
  'Erstellt am',
  'Zuletzt geändert',
  'Alarmierung Datum',
  'Alarmierung Uhrzeit',
  'Eintreffen Datum',
  'Eintreffen Uhrzeit',
  'Einsatzende Datum',
  'Einsatzende Uhrzeit',
  'Dauer (Minuten)',
  'Dauer (formatiert)',
  'Einsatzort',
  'Einsatz-Nr.',
  'Einsatzkraft',
  'Organisation',
  'Stichworte',
  'Stichwort Sonstiges',
  'Anzahl Betroffene',
  'Betroffene (Details)',
  'Einsatzkräfte vor Ort',
  'Nachforderungen',
  'Nachforderung Sonstiges',
  'Setting',
  'Setting Notiz',
  'Weitere Beobachtungen',
  'Maßnahmen',
  'Maßnahmen Notiz',
  'Verlauf',
  'Übergabe an',
  'Übergabe Notiz',
  'Eigene Notizen',
  'Schreibschutz',
];

function affectedDetail(m: Mission): string {
  return m.betroffene
    .map(
      (b, i) =>
        `#${i + 1}: ${b.name || 'N.N.'} (${b.age || '?'} / ${b.gender} / ${b.role})`,
    )
    .join(' || ');
}

function row(m: Mission): string {
  const values: (string | number)[] = [
    m.id,
    m.createdAt,
    m.updatedAt,
    m.alarmierungDatum,
    m.alarmierungZeit,
    m.eintreffenDatum,
    m.eintreffenZeit,
    m.einsatzendeDatum,
    m.einsatzendeZeit,
    m.dauerMinuten,
    formatDuration(m.dauerMinuten),
    m.einsatzOrt,
    m.einsatzNummer,
    m.einsatzkraft,
    m.organisation,
    list(m.stichworte),
    m.stichwortSonstiges,
    m.betroffene.length,
    affectedDetail(m),
    list(m.einsatzkraefteVorOrt),
    list(m.nachforderungen),
    m.nachforderungenSonstiges,
    list(m.setting),
    m.settingNotiz,
    m.weitereBeobachtungen,
    list(m.massnahmen),
    m.massnahmenNotiz,
    m.verlauf,
    m.uebergabeAn,
    m.uebergabeNotiz,
    m.eigeneNotizen,
    m.locked ? 'ja' : 'nein',
  ];
  return values.map(esc).join(SEP);
}

export function buildCsv(missions: Mission[]): string {
  const header = HEADERS.join(SEP);
  const body = missions.map(row).join('\r\n');
  // BOM for Excel to recognize UTF-8
  return `\uFEFF${header}\r\n${body}\r\n`;
}

export async function exportCsv(missions: Mission[]): Promise<{
  ok: boolean;
  method: 'download' | 'share' | 'none';
  message: string;
}> {
  if (missions.length === 0) {
    return { ok: false, method: 'none', message: 'Keine Einsätze zum Exportieren.' };
  }
  const csv = buildCsv(missions);
  const fileName = `psnv-einsaetze-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { ok: true, method: 'download', message: 'CSV heruntergeladen.' };
    } catch (e: any) {
      return {
        ok: false,
        method: 'none',
        message: `Export fehlgeschlagen: ${e?.message ?? e}`,
      };
    }
  }

  try {
    const dir: string =
      FileSystemLegacy.cacheDirectory ?? FileSystemLegacy.documentDirectory ?? '';
    const uri = `${dir}${fileName}`;
    await FileSystemLegacy.writeAsStringAsync(uri, csv, {
      encoding: FileSystemLegacy.EncodingType.UTF8,
    });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
        dialogTitle: 'PSNV-B Einsätze als CSV teilen',
      });
      return { ok: true, method: 'share', message: 'CSV geteilt.' };
    }
    return { ok: true, method: 'share', message: `CSV gespeichert: ${uri}` };
  } catch (e: any) {
    return {
      ok: false,
      method: 'none',
      message: `Export fehlgeschlagen: ${e?.message ?? e}`,
    };
  }
}
