import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { certificateTemplate } from './contractTemplate.js';
import { supabase } from '../../../../api/supabase.js';

/**
 * Arma el HTML final del certificado reemplazando los placeholders.
 * Se usa tanto para la vista previa (se muestra en un iframe) como para
 * generar el PDF final — así ambos siempre se ven exactamente igual.
 */
export const buildCertificateHtml = (formData, patientData, doctorData, logoBase64, doctorSeal) => {
    const fullname = formData?.pt_firstname && formData?.pt_lastname
        ? `${formData.pt_firstname} ${formData.pt_lastname}`.trim()
        : patientData?.pt_firstname && patientData?.pt_lastname
            ? `${patientData.pt_firstname} ${patientData.pt_lastname}`.trim()
            : 'Paciente';

    // Fecha de emisión: la que elige el admin en el formulario; si no hay
    // ninguna, se usa la fecha de hoy como respaldo.
    const currentDate = formData?.date
        ? new Date(`${formData.date}T00:00:00`).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
        : new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

    let branchHtml = '';
    if (formData?.branch_name) {
        branchHtml = `
            <div class="branch-details">
                <p class="branch-name">${formData.branch_name}</p>
                ${formData.branch_address ? `<p>${formData.branch_address}</p>` : ''}
                ${formData.branch_cell ? `<p>Cel: ${formData.branch_cell}</p>` : ''}
                ${formData.branch_email ? `<p>Email: ${formData.branch_email}</p>` : ''}
            </div>
        `;
    }

    return certificateTemplate
        .replace(/{{certificateLogo}}/g, logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="max-width:120px; margin-bottom:10px;" />` : '')
        .replace(/{{branchInfo}}/g, branchHtml)
        .replace(/{{patientName}}/g, fullname)
        .replace(/{{currentDate}}/g, currentDate)

        .replace(/{{sphereRight}}/g, formData?.sphere_right || '')
        .replace(/{{cylinderRight}}/g, formData?.cylinder_right || '')
        .replace(/{{axisRight}}/g, formData?.axis_right || '')
        .replace(/{{prismRight}}/g, formData?.prism_right || '')
        .replace(/{{addRight}}/g, formData?.add_right || '')
        .replace(/{{avVlRight}}/g, formData?.av_vl_right || '')
        .replace(/{{avVpRight}}/g, formData?.av_vp_right || '')
        .replace(/{{dnpRight}}/g, formData?.dnp_right || '')
        .replace(/{{altRight}}/g, formData?.alt_right || '')

        .replace(/{{sphereLeft}}/g, formData?.sphere_left || '')
        .replace(/{{cylinderLeft}}/g, formData?.cylinder_left || '')
        .replace(/{{axisLeft}}/g, formData?.axis_left || '')
        .replace(/{{prismLeft}}/g, formData?.prism_left || '')
        .replace(/{{addLeft}}/g, formData?.add_left || '')
        .replace(/{{avVlLeft}}/g, formData?.av_vl_left || '')
        .replace(/{{avVpLeft}}/g, formData?.av_vp_left || '')
        .replace(/{{dnpLeft}}/g, formData?.dnp_left || '')
        .replace(/{{altLeft}}/g, formData?.alt_left || '')

        .replace(/{{diagnosis}}/g, formData?.diagnosis || 'No especificado')

        .replace(/{{nearVisionLine}}/g, formData?.near_vision_line ? `J${formData.near_vision_line.replace("J", "")}` : "No registrada")
        .replace(/{{colorIssues}}/g, formData?.color_issues || '—')

        .replace(/{{needsLensesNear}}/g, formData?.needs_lenses_near ? 'option-checked' : '')
        .replace(/\{\{needsLensesNearCheck\}\}/g, formData?.needs_lenses_near ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{farVision2020}}/g, formData?.far_vision === '20/20' ? 'option-checked' : '')
        .replace(/\{\{farVision2020Check\}\}/g, formData?.far_vision === '20/20' ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{farVisionLess2020}}/g, formData?.far_vision === 'Menor a 20/20' ? 'option-checked' : '')
        .replace(/\{\{farVisionLess2020Check\}\}/g, formData?.far_vision === 'Menor a 20/20' ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{needsLensesFar}}/g, formData?.needs_lenses_far ? 'option-checked' : '')
        .replace(/\{\{needsLensesFarCheck\}\}/g, formData?.needs_lenses_far ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{colorPerceptionGood}}/g, formData?.color_perception === true ? 'option-checked' : '')
        .replace(/\{\{colorPerceptionGoodCheck\}\}/g, formData?.color_perception === true ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{colorPerceptionBad}}/g, formData?.color_perception === false ? 'option-checked' : '')
        .replace(/\{\{colorPerceptionBadCheck\}\}/g, formData?.color_perception === false ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{prescribesYes}}/g, formData?.prescribes_treatment === true ? 'option-checked' : '')
        .replace(/\{\{prescribesYesCheck\}\}/g, formData?.prescribes_treatment === true ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{prescribesNo}}/g, formData?.prescribes_treatment === false ? 'option-checked' : '')
        .replace(/\{\{prescribesNoCheck\}\}/g, formData?.prescribes_treatment === false ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{treatmentOptometric}}/g, formData?.treatment_optometric ? 'option-checked' : '')
        .replace(/\{\{treatmentOptometricCheck\}\}/g, formData?.treatment_optometric ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{treatmentOphthalmological}}/g, formData?.treatment_ophthalmological ? 'option-checked' : '')
        .replace(/\{\{treatmentOphthalmologicalCheck\}\}/g, formData?.treatment_ophthalmological ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{treatmentPermanentLenses}}/g, formData?.treatment_permanent_lenses ? 'option-checked' : '')
        .replace(/\{\{treatmentPermanentLensesCheck\}\}/g, formData?.treatment_permanent_lenses ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{treatmentOccasionalLenses}}/g, formData?.treatment_occasional_lenses ? 'option-checked' : '')
        .replace(/\{\{treatmentOccasionalLensesCheck\}\}/g, formData?.treatment_occasional_lenses ? '<span class="option-check">&nbsp;&#10003;</span>' : '')
        .replace(/{{treatmentContactLenses}}/g, formData?.treatment_contact_lenses ? 'option-checked' : '')
        .replace(/\{\{treatmentContactLensesCheck\}\}/g, formData?.treatment_contact_lenses ? '<span class="option-check">&nbsp;&#10003;</span>' : '')

        .replace(/{{doctorSeal}}/g, (doctorSeal && formData?.doctor_signature) ? `<img src="${doctorSeal}" alt="Sello del doctor" style="max-width:120px; max-height:80px; display:block; margin:auto;" />` : '')
        .replace(/{{doctorName}}/g, formData?.doctor_name || '')
        .replace(/{{doctorCi}}/g, formData?.doctor_ci ? `C.I. ${formData.doctor_ci}` : '')
        .replace(/{{doctorSenescyt}}/g, formData?.doctor_senescyt ? `Reg. SENESCYT: ${formData.doctor_senescyt}` : '')

        // Patologías
        .replace(/{{pathologyOD}}/g, formData?.pathology_od || 'No refiere')
        .replace(/{{pathologyOI}}/g, formData?.pathology_oi || 'No refiere')

        // En consecuencia / tratamiento prescrito

        // Observación
        .replace(/{{showObservation}}/g, formData?.observation ? 'block' : 'none')
        .replace(/{{observation}}/g, formData?.observation || '')
        .replace(/{{doctorSignature}}/g, formData?.doctor_signature
            ? `<img src="${formData.doctor_signature}" alt="Firma del profesional" />`
            : ''
        );
};

export const generateCertificatePDF = async (formData, patientData, doctorData, logoBase64, doctorSeal) => {
    try {
        const fullname = formData?.pt_firstname && formData?.pt_lastname
            ? `${formData.pt_firstname} ${formData.pt_lastname}`.trim()
            : patientData?.pt_firstname && patientData?.pt_lastname
                ? `${patientData.pt_firstname} ${patientData.pt_lastname}`.trim()
                : 'Paciente';

        const finalHtml = buildCertificateHtml(formData, patientData, doctorData, logoBase64, doctorSeal);

        const safeName = fullname || 'Certificado';
        const cleanName = safeName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .replace(/\s+/g, '_')
            .trim();

        const fileName = `certificado-agudeza-visual-${cleanName}-${Date.now()}.pdf`;

        // Se renderiza en un iframe oculto (igual que la vista previa) para
        // que el PDF final se vea exactamente igual a lo que ya se mostró.
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.left = '-9999px';
        iframe.style.top = '0';
        iframe.style.width = '794px'; // ancho A4 aprox. a 96dpi
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        await new Promise((resolve) => {
            iframe.onload = resolve;
            iframe.srcdoc = finalHtml;
        });

        // Pequeña espera adicional para que las imágenes (logo, sello, firma)
        // terminen de pintarse dentro del iframe antes de capturarlo.
        await new Promise((resolve) => setTimeout(resolve, 300));

        const canvas = await html2canvas(iframe.contentDocument.body, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            windowWidth: 794,
        });

        document.body.removeChild(iframe);

        // Se arma el PDF encogiendo la imagen completa para que quepa siempre
        // en UNA sola página A4, sin importar cuánto contenido tenga el
        // certificado (así no se corta ni se va a una segunda hoja casi vacía).
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 6;
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

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('measures')
            .upload(fileName, pdfBlob, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (uploadError) {
            console.warn('Error subiendo PDF a Supabase:', uploadError.message);
        }

        let pdfUrl = null;
        if (uploadData) {
            const { data: publicUrlData } = supabase.storage
                .from('measures')
                .getPublicUrl(fileName);
            pdfUrl = publicUrlData?.publicUrl || null;
        }

        // Registrar en el historial de certificados (para poder consultarlos después)
        if (pdfUrl && formData?.patient_id) {
            const { error: historyError } = await supabase.from('certificates').insert([{
                patient_id: formData.patient_id,
                issue_date: formData.date || new Date().toISOString().slice(0, 10),
                pdf_url: pdfUrl,
                diagnosis: formData.diagnosis || null,
            }]);
            if (historyError) {
                console.warn('No se pudo guardar en el historial de certificados:', historyError.message);
            }
        }

        // Descargar automáticamente
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        return {
            success: true,
            message: 'Certificado PDF generado correctamente',
            pdfUrl: pdfUrl,
            fileName: fileName
        };

    } catch (error) {
        console.error('Error en generateCertificatePDF:', error);
        return {
            success: false,
            message: error.message || 'Error al generar el certificado PDF'
        };
    }
};
