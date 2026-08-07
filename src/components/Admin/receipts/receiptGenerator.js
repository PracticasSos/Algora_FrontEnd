import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { receiptTemplate } from './receiptTemplate.js';
import { supabase } from '../../../api/supabase.js';

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return '$0.00';
  return `$${n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Genera el comprobante de abono, lo sube a Storage (bucket "sales", el
 * mismo que ya usan las ventas) y devuelve la URL pública lista para
 * compartir por WhatsApp.
 */
export const generateReceiptPDF = async ({
  saleId,
  patientName,
  patientCi,
  branchName,
  saleTotal,
  previousBalance, // lo que ya se había abonado ANTES de este pago
  abonoToday,       // lo que se abona hoy
  newBalance,       // total abonado acumulado (previousBalance + abonoToday)
  newCredit,        // saldo pendiente después de este abono
  paymentMethod,
}) => {
  const issueDate = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
  const balanceLabel = newCredit > 0 ? 'Saldo pendiente' : 'Cuenta saldada';
  const balanceColor = newCredit > 0 ? '#D97706' : '#00A88E';

  const finalHtml = receiptTemplate
    .replace(/{{branchName}}/g, branchName || 'VEOPTICS')
    .replace(/{{saleId}}/g, saleId)
    .replace(/{{issueDate}}/g, issueDate)
    .replace(/{{patientName}}/g, patientName || '—')
    .replace(/{{patientCi}}/g, patientCi || '—')
    .replace(/{{paymentMethod}}/g, paymentMethod || '—')
    .replace(/{{saleTotal}}/g, formatMoney(saleTotal))
    .replace(/{{previousBalance}}/g, formatMoney(previousBalance))
    .replace(/{{abonoToday}}/g, formatMoney(abonoToday))
    .replace(/{{newBalance}}/g, formatMoney(newBalance))
    .replace(/{{newCredit}}/g, formatMoney(newCredit))
    .replace(/{{balanceLabel}}/g, balanceLabel)
    .replace(/{{balanceColor}}/g, balanceColor);

  // Renderiza en un iframe oculto, igual que el certificado — así se puede
  // capturar como imagen sin depender de que el usuario vea nada en pantalla.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '794px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  await new Promise((resolve) => {
    iframe.onload = resolve;
    iframe.srcdoc = finalHtml;
  });
  await new Promise((resolve) => setTimeout(resolve, 200));

  const canvas = await html2canvas(iframe.contentDocument.body, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    windowWidth: 794,
  });

  document.body.removeChild(iframe);

  // Se encoge para que siempre quepa en una sola página A4, igual que en
  // el certificado — sin importar cuánto contenido tenga.
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  const canvasRatio = canvas.width / canvas.height;
  let renderWidth = maxWidth;
  let renderHeight = renderWidth / canvasRatio;
  if (renderHeight > maxHeight) {
    renderHeight = maxHeight;
    renderWidth = renderHeight * canvasRatio;
  }

  const xOffset = (pageWidth - renderWidth) / 2;
  const imgData = canvas.toDataURL('image/jpeg', 0.97);
  pdf.addImage(imgData, 'JPEG', xOffset, margin, renderWidth, renderHeight);

  const pdfBlob = pdf.output('blob');
  const fileName = `comprobante-abono-${saleId}-${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('sales')
    .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: false });

  if (uploadError) {
    throw new Error(`No se pudo subir el comprobante: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from('sales').getPublicUrl(fileName);

  return { pdfUrl: publicUrlData.publicUrl, fileName };
};
