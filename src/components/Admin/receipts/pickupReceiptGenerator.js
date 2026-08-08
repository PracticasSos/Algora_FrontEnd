import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { pickupReceiptTemplate } from './pickupReceiptTemplate.js';
import { supabase } from '../../../api/supabase.js';

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return '$0.00';
  return `$${n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Genera el comprobante de retiro (entrega del producto), lo sube al mismo
 * bucket público "sales" y devuelve la URL lista para compartir.
 */
export const generatePickupReceiptPDF = async ({
  saleId,
  patientName,
  patientCi,
  branchName,
  frameName,
  lensName,
  saleTotal,
  paidSoFar,       // lo que ya pagó (balance), tal cual está
  pendingBalance,   // lo que todavía debe (credit), sin forzar a $0
  signatureDataUrl, // opcional
}) => {
  const now = new Date();
  const issueDate = now.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
  const pickupDate = now.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const hasPending = Number(pendingBalance) > 0;

  const finalHtml = pickupReceiptTemplate
    .replace(/{{branchName}}/g, branchName || 'VEOPTICS')
    .replace(/{{saleId}}/g, saleId)
    .replace(/{{issueDate}}/g, issueDate)
    .replace(/{{pickupDate}}/g, pickupDate)
    .replace(/{{patientName}}/g, patientName || '—')
    .replace(/{{patientCi}}/g, patientCi || '—')
    .replace(/{{frameName}}/g, frameName || 'No registrado')
    .replace(/{{lensName}}/g, lensName || 'No registrada')
    .replace(/{{saleTotal}}/g, formatMoney(saleTotal))
    .replace(/{{paidSoFar}}/g, formatMoney(paidSoFar))
    .replace(/{{balanceLabel}}/g, hasPending ? 'Saldo pendiente' : 'Saldo final')
    .replace(/{{balanceColor}}/g, hasPending ? '#D97706' : '#00A88E')
    .replace(/{{pendingBalance}}/g, formatMoney(pendingBalance))
    .replace(/{{signatureImg}}/g, signatureDataUrl ? `<img src="${signatureDataUrl}" alt="Firma" />` : '');

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
  const fileName = `comprobante-retiro-${saleId}-${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('sales')
    .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: false });

  if (uploadError) {
    throw new Error(`No se pudo subir el comprobante de retiro: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from('sales').getPublicUrl(fileName);

  return { pdfUrl: publicUrlData.publicUrl, fileName };
};
