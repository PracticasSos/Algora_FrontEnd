import html2pdf from 'html2pdf.js';
import { contractTemplate } from './contractTemplate.js';
import { supabase } from '../../../../api/supabase';

export const generateContractPDF = async (formData, measureData, patientData, branchData, salesData) => {
    // Usar datos directamente del componente LaboratoryOrder
    const fullname = formData?.pt_firstname && formData?.pt_lastname
        ? `${formData.pt_firstname} ${formData.pt_lastname}`.trim()
        : 'Cliente';

    // --- 1. Variable para el HTML de la imagen ---
    let imageHtml = '<span class="placeholder">Sin imagen de referencia</span>';

    // --- 2. Condición para crear el tag <img> si la imagen existe ---
    if (formData.userImage) {
        imageHtml = `
        <img
          src="${formData.userImage}"
          alt="Imagen adjunta"
        />
    `;
    }

    // --- Reemplazar variables en la plantilla ---
    let finalHtml = contractTemplate
        .replace(/{{branchName}}/g, formData?.branchs?.name || '.')
        .replace(/{{saleDate}}/g, salesData?.date || formData?.date || new Date().toLocaleDateString('es-ES'))
        .replace(/{{orderNumber}}/g, salesData?.order_number || formData?.id || '-')
        .replace(/{{clientName}}/g, fullname)

        // Medidas
        .replace(/{{sphereRight}}/g, formData?.sphere_right || '')
        .replace(/{{cylinderRight}}/g, formData?.cylinder_right || '')
        .replace(/{{axisRight}}/g, formData?.axis_right || '')
        .replace(/{{prismRight}}/g, formData?.prism_right || '-')
        .replace(/{{addRight}}/g, formData?.add_right || '-')
        .replace(/{{avVlRight}}/g, formData?.av_vl_right || '-')
        .replace(/{{dnpRight}}/g, formData?.dnp_right || '-')
        .replace(/{{altRight}}/g, formData?.alt_right || '-')

        .replace(/{{sphereLeft}}/g, formData?.sphere_left || '-')
        .replace(/{{cylinderLeft}}/g, formData?.cylinder_left || '-')
        .replace(/{{axisLeft}}/g, formData?.axis_left || '-')
        .replace(/{{prismLeft}}/g, formData?.prism_left || '-')
        .replace(/{{addLeft}}/g, formData?.add_left || '-')
        .replace(/{{avVlLeft}}/g, formData?.av_vl_left || '-')
        .replace(/{{dnpLeft}}/g, formData?.dnp_left || '-')
        .replace(/{{altLeft}}/g, formData?.alt_left || '-')

        // Productos
        .replace(/{{frameDetails}}/g, salesData?.frame_details || formData?.inventario?.brand || 'Sin especificar')
        .replace(/{{lensDetails}}/g, salesData?.lens_details || formData?.lens?.lens_type || 'Sin especificar')
        .replace(/{{observations}}/g, salesData?.observations || '-')

        // --- 3. Reemplazar el marcador de la imagen ---
        .replace(/{{userImageHtml}}/g, imageHtml);


    // --- Lógica para nombre de archivo y opciones ---
    const safeName = fullname || 'Paciente';
    const cleanName = safeName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '_')
        .trim();

    const fileName = `orden-laboratorio-${cleanName}-${Date.now()}.pdf`;

    // Orientación vertical (portrait) — el contenido se organiza en dos
    // columnas: izquierda (RX, tipo de luna, observaciones) y derecha
    // (armazón + foto de referencia).
    const options = {
        margin: [0.15, 0.15, 0.15, 0.15],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            allowTaint: false,
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
        }
    };

    // --- Lógica de generación, subida y descarga (sin cambios) ---
    try {
        let pdfUrl;
        const pdfBlob = await html2pdf().set(options).from(finalHtml).outputPdf('blob');

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('laboratory')
            .upload(fileName, pdfBlob, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (uploadError) {
            if (uploadError.message.includes('duplicate key value violates unique constraint')) {
                 console.warn(`El archivo ${fileName} ya existe en el storage.`);
            } else {
                throw new Error('Error subiendo PDF: ' + uploadError.message);
            }
        }

        const { data: publicUrlData } = supabase.storage
            .from('laboratory')
            .getPublicUrl(fileName);

        if (!publicUrlData?.publicUrl) {
             const { data: retryPublicUrlData } = supabase.storage
                 .from('laboratory')
                 .getPublicUrl(fileName);
             if(!retryPublicUrlData?.publicUrl) {
                 throw new Error('Error obteniendo URL pública del PDF');
             }
             pdfUrl = retryPublicUrlData.publicUrl;
        } else {
             pdfUrl = publicUrlData.publicUrl;
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        return {
            success: true,
            message: 'PDF generado y subido correctamente',
            pdfUrl: pdfUrl,
            fileName: fileName
        };

    } catch (error) {
        console.error('Error en generateContractPDF:', error);
        return {
            success: false,
            message: error.message || 'Error al generar el PDF'
        };
    }
};
