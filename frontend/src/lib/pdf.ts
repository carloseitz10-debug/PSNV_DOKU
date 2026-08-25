import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Mission } from '../types';
import { formatDuration } from './duration';

// A4 in points at 72dpi
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

function esc(s: string | number | undefined | null): string {
  if (s === null || s === undefined || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

function safe(s: string | number | undefined | null): string {
  const v = esc(s);
  return v === '' ? '&mdash;' : v;
}

function cell(label: string, value: string | number | undefined | null): string {
  return `
    <div class="cell">
      <div class="lbl">${esc(label)}</div>
      <div class="val">${safe(value)}</div>
    </div>`;
}

function fullCell(label: string, contentHtml: string): string {
  return `
    <div class="cell full">
      <div class="lbl">${esc(label)}</div>
      <div class="val">${contentHtml}</div>
    </div>`;
}

function note(text: string | undefined | null): string {
  if (!text || !String(text).trim()) return '<div class="note empty">&mdash;</div>';
  return `<div class="note">${esc(text)}</div>`;
}

function chipsHtml(items: string[] | undefined): string {
  if (!items || items.length === 0) return '<div class="empty">&mdash;</div>';
  return `<div class="chips">${items.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>`;
}

function timeBlock(label: string, date: string, time: string): string {
  const value =
    date || time
      ? `${esc(date) || '&mdash;'}${time ? ` &middot; ${esc(time)}` : ''}`
      : '&mdash;';
  return `
    <div class="tb">
      <div class="tb-lbl">${esc(label)}</div>
      <div class="tb-val">${value}</div>
    </div>`;
}

export function buildHtml(m: Mission): string {
  const affected = (m.betroffene || [])
    .map(
      (b, i) => `
      <div class="sub">
        <div class="sub-title">Betroffene:r ${i + 1}</div>
        <div class="grid">
          ${cell('Name / Bezeichnung', b.name)}
          ${cell('Alter', b.age)}
          ${cell('Geschlecht', b.gender)}
          ${cell('Rolle', b.role)}
        </div>
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>PSNV-B Einsatzprotokoll</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #1C1C1E;
    font-size: 10.5px;
    line-height: 1.35;
  }
  ::-webkit-scrollbar { display: none; }

  h1 { font-size: 20px; font-weight: 500; margin: 0 0 3px 0; color: #1C1C1E; }
  .subtitle { color: #48484A; font-size: 11px; margin-bottom: 10px; }
  .brand-bar { height: 5px; background: #4A6B53; border-radius: 3px; margin-bottom: 10px; }

  /* Zeitstempel: eine Zeile */
  .times {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }
  .tb {
    flex: 1 1 0;
    padding: 6px 8px;
    background: #E8EFE9;
    border-radius: 5px;
  }
  .tb-lbl {
    font-size: 8.5px;
    color: #4A6B53;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 2px;
  }
  .tb-val {
    font-size: 11.5px;
    color: #1A261D;
    font-weight: 500;
  }

  section {
    margin-top: 8px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  section h2 {
    font-size: 10px;
    font-weight: 600;
    color: #4A6B53;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #E5E5EA;
    padding-bottom: 3px;
    margin: 0 0 6px 0;
  }

  /* Zweispaltiges Grid für Label/Value */
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 12px;
    row-gap: 5px;
  }
  .cell {
    padding: 4px 0;
    border-bottom: 1px dotted #E5E5EA;
  }
  .cell.full {
    grid-column: 1 / -1;
  }
  .cell .lbl {
    font-size: 8.5px;
    color: #48484A;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 2px;
    font-weight: 500;
  }
  .cell .val {
    font-size: 11px;
    color: #1C1C1E;
    word-wrap: break-word;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 3px 4px;
    margin-top: 2px;
  }
  .chip {
    display: inline-block;
    padding: 2px 8px;
    background: #E8EFE9;
    color: #1A261D;
    border-radius: 999px;
    font-size: 9.5px;
    font-weight: 500;
    line-height: 1.3;
  }
  .empty { color: #8E8E93; font-size: 10.5px; }

  .sub {
    padding: 6px 8px;
    background: #FAFAFC;
    border: 1px solid #EEEEF2;
    border-radius: 5px;
    margin-bottom: 4px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .sub-title {
    font-weight: 600;
    color: #2E4233;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 4px;
  }

  .note {
    white-space: pre-wrap;
    padding: 6px 8px;
    background: #F5F5F7;
    border-radius: 5px;
    color: #1C1C1E;
    font-size: 10.5px;
    margin-top: 4px;
  }
  .note.empty { color: #8E8E93; }

  .single-col > .cell.full,
  .single-col .note {
    width: 100%;
  }

  .footer {
    margin-top: 10px;
    padding-top: 4px;
    border-top: 1px solid #E5E5EA;
    color: #8E8E93;
    font-size: 8.5px;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="brand-bar"></div>
  <h1>PSNV-B Einsatzprotokoll</h1>
  <div class="subtitle">Psychosoziale Notfallversorgung – Betroffene</div>

  <div class="times">
    ${timeBlock('Alarmierung', m.alarmierungDatum, m.alarmierungZeit)}
    ${timeBlock('Eintreffen', m.eintreffenDatum, m.eintreffenZeit)}
    ${timeBlock('Einsatzende', m.einsatzendeDatum, m.einsatzendeZeit)}
  </div>

  <section>
    <h2>Einsatzdaten</h2>
    <div class="grid">
      ${cell('Einsatz-Nr.', m.einsatzNummer)}
      ${cell('Dauer', formatDuration(m.dauerMinuten))}
      ${cell('Einsatzort', m.einsatzOrt)}
      ${cell('Einsatzkraft', m.einsatzkraft)}
      ${cell('Organisation', m.organisation)}
      ${fullCell('Stichworte / Ereignisart', chipsHtml(m.stichworte))}
    </div>
  </section>

  <section>
    <h2>Betroffene (${(m.betroffene || []).length})</h2>
    ${affected || '<div class="empty">Keine Angaben.</div>'}
  </section>

  <section>
    <h2>Situation an der Einsatzstelle</h2>
    <div class="grid">
      ${fullCell('Einsatzkräfte vor Ort', chipsHtml(m.einsatzkraefteVorOrt))}
      ${fullCell('Nachforderung', chipsHtml(m.nachforderungen))}
      ${
        m.nachforderungenSonstiges
          ? fullCell('Andere Nachforderungen', note(m.nachforderungenSonstiges))
          : ''
      }
    </div>
  </section>

  <section>
    <h2>Setting</h2>
    <div class="grid">
      ${fullCell('Setting', chipsHtml(m.setting))}
      ${m.settingNotiz ? fullCell('Notiz zum Setting', note(m.settingNotiz)) : ''}
      ${
        m.weitereBeobachtungen
          ? fullCell('Weitere Beobachtungen', note(m.weitereBeobachtungen))
          : ''
      }
    </div>
  </section>

  <section class="single-col">
    <h2>Maßnahmen</h2>
    <div class="grid">
      ${fullCell('Durchgeführte Maßnahmen', chipsHtml(m.massnahmen))}
      ${
        m.massnahmenNotiz
          ? fullCell('Ergänzung', note(m.massnahmenNotiz))
          : ''
      }
    </div>
  </section>

  <section class="single-col">
    <h2>Verlauf</h2>
    ${note(m.verlauf)}
  </section>

  <section>
    <h2>Übergabe</h2>
    <div class="grid">
      ${cell('Übergabe an', m.uebergabeAn)}
      ${
        m.uebergabeNotiz
          ? fullCell('Notiz zur Übergabe', note(m.uebergabeNotiz))
          : ''
      }
    </div>
  </section>

  ${
    m.eigeneNotizen
      ? `<section class="single-col">
    <h2>Eigene Notizen</h2>
    ${note(m.eigeneNotizen)}
  </section>`
      : ''
  }

  <div class="footer">
    Erstellt am ${new Date(m.createdAt).toLocaleString('de-DE')} &middot; PSNV-B Doku
  </div>
</body>
</html>`;
}

export async function generatePdfUri(mission: Mission): Promise<string> {
  const html = buildHtml(mission);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    width: A4_WIDTH,
    height: A4_HEIGHT,
    margins: { left: 0, right: 0, top: 0, bottom: 0 },
  });
  return uri;
}

export async function sharePdf(mission: Mission): Promise<void> {
  const uri = await generatePdfUri(mission);
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      UTI: 'com.adobe.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'PSNV-B Einsatzprotokoll teilen',
    });
  }
}

export async function printPdf(mission: Mission): Promise<void> {
  const html = buildHtml(mission);
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    await Print.printAsync({
      html,
      width: A4_WIDTH,
      height: A4_HEIGHT,
      margins: { left: 0, right: 0, top: 0, bottom: 0 },
    });
  } else {
    await Print.printAsync({ html });
  }
}
