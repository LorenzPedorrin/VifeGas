import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Calendar, 
  Download, 
  Printer, 
  AlertCircle, 
  Flame, 
  Copy,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { Venta } from '../types';

interface ReporteViewProps {
  ventas: Venta[];
}

export const ReporteView: React.FC<ReporteViewProps> = ({ ventas }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [dateError, setDateError] = useState<string | null>(null);

  // Print & Modal Feedback State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Quick Preset Selection
  const setQuickPeriod = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'all') => {
    setDateError(null);
    const now = new Date();
    const toISO = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const today = toISO(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const yStr = toISO(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const w = new Date();
      w.setDate(now.getDate() - 6);
      setStartDate(toISO(w));
      setEndDate(toISO(now));
    } else if (preset === 'month') {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toISO(m));
      setEndDate(toISO(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter sales
  const filteredVentas = useMemo(() => {
    if (startDate && endDate && endDate < startDate) {
      setDateError('La fecha final no puede ser anterior a la inicial.');
      return [];
    }

    return ventas.filter((v) => {
      const vDateStr = v.fecha.toISOString().split('T')[0];
      if (startDate && vDateStr < startDate) return false;
      if (endDate && vDateStr > endDate) return false;
      return true;
    });
  }, [ventas, startDate, endDate]);

  // Aggregate stats
  const totals = useMemo(() => {
    let ingresosTotales = 0;
    let balonesTotales = 0;

    filteredVentas.forEach((v) => {
      ingresosTotales += v.total;
      balonesTotales += v.cantidad;
    });

    const precioPromedio = balonesTotales > 0 ? ingresosTotales / balonesTotales : 0;

    return {
      ingresosTotales,
      balonesTotales,
      totalVentas: filteredVentas.length,
      precioPromedio
    };
  }, [filteredVentas]);

  // Format date range description
  const rangeDescription = useMemo(() => {
    if (!startDate && !endDate) return 'Histórico Completo';
    if (startDate === endDate) {
      return `Fecha: ${startDate}`;
    }
    return `Período: ${startDate || 'Inicio'} al ${endDate || 'Hoy'}`;
  }, [startDate, endDate]);

  // Generate & Download Markdown File (.md)
  const handleDownloadMarkdown = () => {
    const timestamp = new Date().toLocaleString('es-PE');
    let md = `# VifeGas - Reporte de Ventas\n\n`;
    md += `**Producto:** Balón de gas de 10 kg\n`;
    md += `**${rangeDescription}**\n`;
    md += `**Generado el:** ${timestamp}\n\n`;
    md += `## Resumen General\n\n`;
    md += `- **Ingresos Totales:** S/. ${totals.ingresosTotales.toFixed(2)}\n`;
    md += `- **Balones Vendidos:** ${totals.balonesTotales} unidades\n`;
    md += `- **Número de Operaciones:** ${totals.totalVentas}\n`;
    md += `- **Precio Promedio por Balón:** S/. ${totals.precioPromedio.toFixed(2)}\n\n`;

    if (filteredVentas.length === 0) {
      md += `*No se registraron ventas en este período.*\n`;
    } else {
      md += `## Detalle de Ventas\n\n`;
      md += `| Fecha y Hora | Cantidad | Precio Unitario | Total | Motivo |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;

      filteredVentas.forEach((v) => {
        const fechaStr = v.fecha.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const motivoStr = v.motivo ? v.motivo.replace(/\|/g, '-') : '-';
        md += `| ${fechaStr} | ${v.cantidad} und. | S/. ${v.precio.toFixed(2)} | S/. ${v.total.toFixed(2)} | ${motivoStr} |\n`;
      });
    }

    md += `\n---\n*Reporte generado automáticamente desde VifeGas.*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Reporte_VifeGas_${(startDate || 'inicio')}_a_${(endDate || 'hoy')}.md`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotice('Archivo Markdown (.md) descargado correctamente.');
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  // Generate self-contained standalone printable HTML (Guaranteed to print or save as PDF in any device)
  const handleDownloadPrintableHtml = () => {
    const timestamp = new Date().toLocaleString('es-PE');
    let rowsHtml = '';

    if (filteredVentas.length === 0) {
      rowsHtml = `<tr><td colspan="5" style="text-align:center; padding: 25px; color: #64748b;">No se registraron ventas en este período</td></tr>`;
    } else {
      filteredVentas.forEach((v) => {
        const fechaStr = v.fecha.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        rowsHtml += `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${fechaStr}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${v.cantidad} balones</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">S/. ${v.precio.toFixed(2)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 800; color: #047857;">S/. ${v.total.toFixed(2)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">${v.motivo || '-'}</td>
          </tr>
        `;
      });
    }

    const htmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>VifeGas - Reporte de Ventas (${rangeDescription})</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px auto; max-width: 800px; color: #0f172a; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 26px; font-weight: 900; color: #ea580c; margin: 0; }
    .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 600; text-transform: uppercase; }
    .meta { font-size: 12px; color: #475569; text-align: right; }
    .kpis { display: flex; gap: 12px; margin-bottom: 25px; }
    .kpi-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px 14px; background: #f8fafc; }
    .kpi-title { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #475569; }
    .kpi-value { font-size: 22px; font-weight: 900; margin-top: 4px; }
    .val-green { color: #047857; }
    .val-blue { color: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; color: #334155; }
    tfoot td { background: #f8fafc; padding: 12px; font-weight: 900; border-top: 2px solid #0f172a; }
    .btn-print { background: #ea580c; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 20px; font-size: 14px; }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right; margin-bottom: 20px;">
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
  </div>

  <div class="header">
    <div>
      <h1 class="brand">🔥 VifeGas</h1>
      <div class="subtitle">Reporte de Ventas · Balón de Gas 10 kg</div>
    </div>
    <div class="meta">
      <div><strong>${rangeDescription}</strong></div>
      <div>Emitido: ${timestamp}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi-card">
      <div class="kpi-title">Ingresos Totales</div>
      <div class="kpi-value val-green">S/. ${totals.ingresosTotales.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Balones Vendidos</div>
      <div class="kpi-value val-blue">${totals.balonesTotales} und.</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Operaciones</div>
      <div class="kpi-value">${totals.totalVentas}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Precio Promedio</div>
      <div class="kpi-value">S/. ${totals.precioPromedio.toFixed(2)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha y Hora</th>
        <th style="text-align: center;">Cantidad</th>
        <th style="text-align: right;">Precio Unit.</th>
        <th style="text-align: right;">Total</th>
        <th>Motivo</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td>TOTAL GENERAL</td>
        <td style="text-align: center;">${totals.balonesTotales} und.</td>
        <td style="text-align: right;">-</td>
        <td style="text-align: right; color: #047857;">S/. ${totals.ingresosTotales.toFixed(2)}</td>
        <td style="font-size: 11px; color: #64748b;">${totals.totalVentas} ventas</td>
      </tr>
    </tfoot>
  </table>

  <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
    VifeGas · Sistema de Control de Venta de Gas
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Reporte_Imprimible_VifeGas_${(startDate || 'inicio')}_a_${(endDate || 'hoy')}.html`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotice('Archivo HTML imprimible descargado. Ábrelo en tu navegador para imprimir o guardar como PDF en 1 segundo.');
    setTimeout(() => setDownloadNotice(null), 5000);
  };

  // Safe window.print trigger with fallback
  const handlePrintClick = () => {
    try {
      window.print();
    } catch (e) {
      console.warn("window.print call failed in sandbox:", e);
    }
    // Always open the helper modal so the user has immediate alternatives (PDF HTML download, WhatsApp summary, direct print)
    setShowPrintModal(true);
  };

  // Copy quick summary to clipboard for WhatsApp
  const handleCopySummary = () => {
    let text = `🔥 *VifeGas - Resumen de Ventas*\n`;
    text += `📅 ${rangeDescription}\n`;
    text += `💰 *Ingresos Totales:* S/. ${totals.ingresosTotales.toFixed(2)}\n`;
    text += `📦 *Balones Vendidos:* ${totals.balonesTotales} und. (10 kg)\n`;
    text += `📝 *Operaciones:* ${totals.totalVentas}\n`;
    text += `💵 *Precio Promedio:* S/. ${totals.precioPromedio.toFixed(2)}\n`;

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-orange-600" />
            <span>Reporte de Ventas</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Resumen consolidado e impresión en PDF
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            title="Copiar texto resumen para WhatsApp"
          >
            <Copy className="w-4 h-4 text-slate-600" />
            <span>{copySuccess ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            title="Descargar en formato Markdown (.md)"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>Descargar (.md)</span>
          </button>

          <button
            onClick={handlePrintClick}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-600/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {downloadNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-fadeIn no-print">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Date Filter & Presets (no-print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span>Seleccionar rango del reporte:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setQuickPeriod('today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                startDate === todayStr && endDate === todayStr
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setQuickPeriod('yesterday')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Ayer
            </button>
            <button
              onClick={() => setQuickPeriod('week')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => setQuickPeriod('month')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Este mes
            </button>
            <button
              onClick={() => setQuickPeriod('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                !startDate && !endDate
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Histórico
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Fecha de Inicio:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateError(null);
              }}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Fecha de Fin:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateError(null);
              }}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {dateError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{dateError}</span>
          </div>
        )}
      </div>

      {/* PRINTABLE REPORT CONTAINER */}
      <div id="printable-report" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Printable Official Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-7 h-7 text-orange-600" />
              <span className="text-2xl font-black text-slate-900 tracking-tight">VifeGas</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Reporte Oficial de Ventas · Balón de Gas 10 kg
            </p>
          </div>
          <div className="sm:text-right text-xs text-slate-500">
            <p className="font-extrabold text-slate-900 text-sm">{rangeDescription}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Emitido: {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Resumen General Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <span className="text-[11px] font-extrabold uppercase text-emerald-800 tracking-wider block">
              Ingresos Totales
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block">
              S/. {totals.ingresosTotales.toFixed(2)}
            </span>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
            <span className="text-[11px] font-extrabold uppercase text-blue-800 tracking-wider block">
              Balones Vendidos
            </span>
            <span className="text-2xl sm:text-3xl font-black text-blue-900 mt-1 block">
              {totals.balonesTotales} und.
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[11px] font-extrabold uppercase text-slate-600 tracking-wider block">
              Nº Operaciones
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
              {totals.totalVentas}
            </span>
          </div>

          <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl">
            <span className="text-[11px] font-extrabold uppercase text-orange-800 tracking-wider block">
              Precio Promedio
            </span>
            <span className="text-2xl sm:text-3xl font-black text-orange-700 mt-1 block">
              S/. {totals.precioPromedio.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Detalle de Ventas Table */}
        <div className="pt-2">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-3">
            Detalle de Ventas ({filteredVentas.length})
          </h3>

          {filteredVentas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="font-bold text-slate-700 text-base">
                No se registraron ventas en este período
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Puedes ajustar las fechas del filtro en la parte superior.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm text-slate-800">
                <thead className="bg-slate-100 text-xs font-black uppercase text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-right">Precio Unit.</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVentas.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {v.fecha.toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {v.cantidad} {v.cantidad === 1 ? 'balón' : 'balones'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        S/. {v.precio.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        S/. {v.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 italic">
                        {v.motivo || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-black border-t-2 border-slate-200">
                  <tr>
                    <td className="py-3.5 px-4 text-sm font-black text-slate-900">TOTAL GENERAL</td>
                    <td className="py-3.5 px-4 text-center text-sm font-black text-slate-900">
                      {totals.balonesTotales} und.
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500">-</td>
                    <td className="py-3.5 px-4 text-right text-base font-black text-emerald-700">
                      S/. {totals.ingresosTotales.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {totals.totalVentas} operaciones
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Print Footer */}
        <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 print-only">
          VifeGas · Sistema de Control de Venta de Gas · Balón 10 kg
        </div>
      </div>

      {/* PRINT & PDF MODAL / DIALOG */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Opciones de Impresión y PDF
                  </h3>
                  <p className="text-xs text-slate-500">{rangeDescription}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-5">
              Elige cómo deseas imprimir o guardar este reporte:
            </p>

            <div className="space-y-3">
              {/* Option 1: Direct window.print */}
              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full p-4 rounded-2xl bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-600 text-white rounded-xl shadow-sm">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">
                      Imprimir Directamente
                    </span>
                    <span className="text-xs text-slate-500">
                      Abre el diálogo de impresora o "Guardar como PDF" del navegador
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 2: Download Standalone HTML formatted for PDF */}
              <button
                onClick={() => {
                  handleDownloadPrintableHtml();
                  setShowPrintModal(false);
                }}
                className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
                    <Download className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">
                      Descargar Hoja Imprimible (.html listo para PDF)
                    </span>
                    <span className="text-xs text-slate-500">
                      Archivo limpio que se abre e imprime perfecto en celular o PC
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 3: Download Markdown */}
              <button
                onClick={() => {
                  handleDownloadMarkdown();
                  setShowPrintModal(false);
                }}
                className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">
                      Descargar Archivo Markdown (.md)
                    </span>
                    <span className="text-xs text-slate-500">
                      Formato de texto estructurado con tablas para archivar
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
