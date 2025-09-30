import html2pdf from 'html2pdf.js';
import { certificateTemplate } from './contractTemplate.js';
import { supabase } from '../../../../api/supabase.js';


export const generateCertificatePDF = async (formData, patientData, doctorData, logoBase64, doctorSeal, footerInfo) => {
    console.log('Logo base64 recibido para PDF:', logoBase64);
    try {
        const fullname = formData?.pt_firstname && formData?.pt_lastname 
            ? `${formData.pt_firstname} ${formData.pt_lastname}`.trim()
            : patientData?.pt_firstname && patientData?.pt_lastname
            ? `${patientData.pt_firstname} ${patientData.pt_lastname}`.trim()
            : 'Paciente';

        // Fecha actual formateada
        const currentDate = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit'
        });

        // Preparar datos del doctor (valores por defecto si no se proporcionan)
        const doctor = doctorData || {
            name: 'Dr. Amuary Minuche Anchones',
            title: 'OPTOMETRISTA',
            registration: '1019-2018-2140119'
        };

        // Reemplazar placeholders en el template
        let finalHtml = certificateTemplate
            // Logo dinámico
            .replace(/{{certificateLogo}}/g, logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="max-width:120px; margin-bottom:10px;" />` : '')
            // Datos del paciente
            .replace(/{{patientName}}/g, fullname)
            .replace(/{{currentDate}}/g, currentDate)
            
            // Medidas ojo derecho
            .replace(/{{sphereRight}}/g, formData?.sphere_right || '')
            .replace(/{{cylinderRight}}/g, formData?.cylinder_right || '')
            .replace(/{{axisRight}}/g, formData?.axis_right || '')
            .replace(/{{prismRight}}/g, formData?.prism_right || '')
            .replace(/{{addRight}}/g, formData?.add_right || '')
            .replace(/{{avVlRight}}/g, formData?.av_vl_right || '')
            .replace(/{{avVpRight}}/g, formData?.av_vp_right || '')
            .replace(/{{dnpRight}}/g, formData?.dnp_right || '')
            .replace(/{{altRight}}/g, formData?.alt_right || '')
            
            // Medidas ojo izquierdo
            .replace(/{{sphereLeft}}/g, formData?.sphere_left || '')
            .replace(/{{cylinderLeft}}/g, formData?.cylinder_left || '')
            .replace(/{{axisLeft}}/g, formData?.axis_left || '')
            .replace(/{{prismLeft}}/g, formData?.prism_left || '')
            .replace(/{{addLeft}}/g, formData?.add_left || '')
            .replace(/{{avVlLeft}}/g, formData?.av_vl_left || '')
            .replace(/{{avVpLeft}}/g, formData?.av_vp_left || '')
            .replace(/{{dnpLeft}}/g, formData?.dnp_left || '')
            .replace(/{{altLeft}}/g, formData?.alt_left || '')
            
            // Diagnóstico
            .replace(/{{diagnosis}}/g, formData?.diagnosis || 'No especificado')
            
            // Visión cercana
            .replace(/{{nearVisionApproved}}/g, formData?.near_vision === 'Aprobado' ? 'radio-checked' : '')
            .replace(/{{nearVisionNotApproved}}/g, formData?.near_vision === 'No Aprobado' ? 'radio-checked' : '')
            .replace(/{{needsLensesNear}}/g, formData?.needs_lenses_near ? 'checkbox-checked' : '')
            
            // Visión lejana
            .replace(/{{farVision2020}}/g, formData?.far_vision === '20/20' ? 'radio-checked' : '')
            .replace(/{{farVisionLess2020}}/g, formData?.far_vision === 'Menor a 20/20' ? 'radio-checked' : '')
            .replace(/{{needsLensesFar}}/g, formData?.needs_lenses_far ? 'checkbox-checked' : '')
            
            // Percepción de colores
            .replace(/{{colorPerception}}/g, formData?.color_perception ? 'checkbox-checked' : '')
            .replace(/{{colorIssues}}/g, formData?.color_issues || '')
            .replace(/{{showColorIssues}}/g, formData?.color_issues ? 'block' : 'none')
            
            // Información del doctor
            .replace(/{{doctorName}}/g, doctor.name)
            .replace(/{{doctorTitle}}/g, doctor.title)
            .replace(/{{doctorRegistration}}/g, doctor.registration)
            .replace(/{{doctorSeal}}/g, doctorSeal ? `<img src="${doctorSeal}" alt="Sello del doctor" style="max-width:120px; max-height:80px; display:block; margin:auto;" />` : '')
            .replace(/{{footerInfo}}/g, footerInfo || 'Sin información de pie de página')
            // Firma del paciente
            .replace(/{{patientSignature}}/g, formData?.signature
                ? `<img src="${formData.signature}" alt="Firma del Paciente" style="max-width:180px; max-height:60px; display:block; margin:auto;" />`
                : ''
            );

        // Preparar nombre del archivo
        const safeName = fullname || 'Certificado';
        const cleanName = safeName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .replace(/\s+/g, '_')
            .trim();
            
        const fileName = `certificado-agudeza-visual-${cleanName}-${Date.now()}.pdf`;

        // Configuración para html2pdf
        const options = {
            margin: [15, 15, 15, 15], // márgenes en mm
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true,
                allowTaint: false,
                width: 794,  // A4 width in pixels
                height: 1123 // A4 height in pixels
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4',
                orientation: 'portrait' 
            } 
        };

        // Generar PDF
        const pdfBlob = await html2pdf().set(options).from(finalHtml).outputPdf('blob');
        
        // Subir a Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('measures') // asegúrate de que este bucket exista
            .upload(fileName, pdfBlob, {
                contentType: 'application/pdf',
                upsert: false
            });
        
        if (uploadError) {
            console.warn('Error subiendo PDF a Supabase:', uploadError.message);
            // Continuar sin subir si hay error
        }

        let pdfUrl = null;
        if (uploadData) {
            // Obtener URL pública
            const { data: publicUrlData } = supabase.storage
                .from('certificates')
                .getPublicUrl(fileName);
            
            pdfUrl = publicUrlData?.publicUrl;
        }

        // Descargar automáticamente
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Limpiar URL del blob
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