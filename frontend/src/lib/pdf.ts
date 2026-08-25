import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Mission } from '../types';

function esc(s: string | undefined | null): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

function row(label: string, value: string | undefined | null): string {
  return `
    <tr>
      <td class="lbl">${esc(label)}</td>
      <td class="val">${esc(value) || '&mdash;'}</td>
    </tr>`;
}

function chips(items: string[]): string {
  if (!items || items.length === 0) return '&mdash;';
  return items.map((s) => `<span class="chip">${esc(s)}</span>`).join(' ');
}

export function buildHtml(m: Mission): string {
  const affectedRows = (m.betroffene || [])
    .map(
      (b, i) => `
      <div class="sub">
        <div class="sub-title">Betroffene:r ${i + 1}</div>
        <table>
          ${row('Name / Bezeichnung', b.name)}
          ${row('Alter', b.age)}
          ${row('Geschlecht', b.gender)}
          ${row('Rolle', b.role)}
        </table>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>PSNV-B Einsatzprotokoll</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1C1C1E; padding: 32px; font-size: 12px; }
  h1 { font-size: 22px; font-weight: 500; margin: 0 0 4px 0; color: #1C1C1E; }
  .subtitle { color: #48484A; font-size: 13px; margin-bottom: 20px; }
  .brand-bar { height: 6px; background: #4A6B53; border-radius: 3px; margin-bottom: 20px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 24px; padding: 12px 16px; background: #F5F5F7; border-radius: 8px; font-size: 12px; }
  .meta div { color: #48484A; }
  .meta strong { color: #1C1C1E; font-weight: 500; }
  section { margin-bottom: 22px; page-break-inside: avoid; }
  section h2 { font-size: 13px; font-weight: 500; color: #4A6B53; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5EA; padding-bottom: 6px; margin: 0 0 10px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 8px; vertical-align: top; font-size: 12px; border-bottom: 1px solid #F5F5F7; }
  td.lbl { width: 38%; color: #48484A; }
  td.val { color: #1C1C1E; }
  .chip { display: inline-block; padding: 3px 10px; background: #E8EFE9; color: #1A261D; border-radius: 999px; font-size: 11px; margin: 2px 4px 2px 0; }
  .sub { margin-bottom: 10px; padding: 10px 12px; background: #FAFAFC; border-radius: 8px; }
  .sub-title { font-weight: 500; color: #2E4233; margin-bottom: 6px; font-size: 12px; }
  .note { white-space: pre-wrap; padding: 8px 12px; background: #F5F5F7; border-radius: 8px; color: #1C1C1E; font-size: 12px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E5E5EA; color: #8E8E93; font-size: 10px; text-align: center; }
</style>
</head>
<body>
  <div class="brand-bar"></div>
  <h1>PSNV-B Einsatzprotokoll</h1>
  <div class="subtitle">Psychosoziale Notfallversorgung – Betroffene</div>

  <div class="meta">
    <div><strong>Einsatz-Nr.</strong><br/>${esc(m.einsatzNummer) || '&mdash;'}</div>
    <div><strong>Datum</strong><br/>${esc(m.einsatzDatum)}</div>
    <div><strong>Uhrzeit</strong><br/>${esc(m.einsatzZeit)}</div>
    <div><strong>Dauer</strong><br/>${esc(m.dauerMinuten) ? esc(m.dauerMinuten) + ' Min.' : '&mdash;'}</div>
  </div>

  <section>
    <h2>Einsatzdaten</h2>
    <table>
      ${row('Einsatzort', m.einsatzOrt)}
      ${row('Stichwort / Ereignisart', m.stichwort)}
      ${row('Einsatzkraft', m.einsatzkraft)}
      ${row('Organisation', m.organisation)}
    </table>
  </section>

  <section>
    <h2>Betroffene</h2>
    ${affectedRows || '<div class="note">Keine Angaben.</div>'}
  </section>

  <section>
    <h2>Zustand &amp; Symptome</h2>
    <div style="margin-bottom: 8px;">${chips(m.symptome || [])}</div>
    ${m.symptomeNotiz ? `<div class="note">${esc(m.symptomeNotiz)}</div>` : ''}
  </section>

  <section>
    <h2>Maßnahmen</h2>
    <div style="margin-bottom: 8px;">${chips(m.massnahmen || [])}</div>
    ${m.massnahmenNotiz ? `<div class="note">${esc(m.massnahmenNotiz)}</div>` : ''}
  </section>

  <section>
    <h2>Verlauf / Notizen</h2>
    <div class="note">${esc(m.verlauf) || '&mdash;'}</div>
  </section>

  <section>
    <h2>Übergabe</h2>
    <table>
      ${row('Übergabe an', m.uebergabeAn)}
    </table>
    ${m.uebergabeNotiz ? `<div class="note" style="margin-top:8px;">${esc(m.uebergabeNotiz)}</div>` : ''}
  </section>

  ${
    m.eigeneNotizen
      ? `<section>
    <h2>Eigene Notizen</h2>
    <div class="note">${esc(m.eigeneNotizen)}</div>
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
  const { uri } = await Print.printToFileAsync({ html, base64: false });
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
    await Print.printAsync({ html });
  } else {
    // web fallback
    await Print.printAsync({ html });
  }
}
