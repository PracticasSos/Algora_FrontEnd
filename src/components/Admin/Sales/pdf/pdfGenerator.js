import html2pdf from 'html2pdf.js';
import { contractTemplate } from './contractTemplate.js';
import { supabase } from '../../../../api/supabase';

export const generateContractPDF = async (formData, measureData, patientData, branchData) => {
  try {
    // VALIDAR TÉRMINOS Y CONDICIONES
    if (!formData?.termsAccepted) {
      throw new Error('Debe aceptar los términos y condiciones antes de generar el PDF');
    }

    console.log("=== DEBUG: Datos recibidos ===");
    console.log("formData:", formData);

    // Preparar datos del cliente
    const fullName = patientData 
      ? `${patientData.pt_firstname || ""} ${patientData.pt_lastname || ""}`.trim()
      : `${formData?.pt_firstname || ""} ${formData?.pt_lastname || ""}`.trim();

    // Crear sección de medidas si existen
    let measuresSection = '';
    if (measureData) {
      measuresSection = `
        <div class="info-section">
          <div class="section-title">Medidas Oftálmicas</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Ojo</th>
                <th>Esfera</th>
                <th>Cilindro</th>
                <th>Eje</th>
                <th>Prisma</th>
                <th>ADD</th>
                <th>AV VL</th>
                <th>AV VP</th>
                <th>DNP</th>
                <th>ALT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>OD</strong></td>
                <td>${measureData?.sphere_right || "-"}</td>
                <td>${measureData?.cylinder_right || "-"}</td>
                <td>${measureData?.axis_right || "-"}</td>
                <td>${measureData?.prism_right || "-"}</td>
                <td>${measureData?.add_right || "-"}</td>
                <td>${measureData?.av_vl_right || "-"}</td>
                <td>${measureData?.av_vp_right || "-"}</td>
                <td>${measureData?.dnp_right || "-"}</td>
                <td>${measureData?.alt_right || "-"}</td>
              </tr>
              <tr>
                <td><strong>OI</strong></td>
                <td>${measureData?.sphere_left || "-"}</td>
                <td>${measureData?.cylinder_left || "-"}</td>
                <td>${measureData?.axis_left || "-"}</td>
                <td>${measureData?.prism_left || "-"}</td>
                <td>${measureData?.add_left || "-"}</td>
                <td>${measureData?.av_vl_left || "-"}</td>
                <td>${measureData?.av_vp_left || "-"}</td>
                <td>${measureData?.dnp_left || "-"}</td>
                <td>${measureData?.alt_left || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // Crear sección de observaciones (mensaje + imagen)
    let observationsSection = '';
    if (formData?.message || formData?.observation_img) {
      observationsSection = `
        <div class="info-section">
          <div class="section-title">Observaciones</div>
          ${formData.message ? `<p>${formData.message}</p>` : ''}
          ${formData.observation_img ? `<img src="${formData.observation_img}" style="max-width: 200px; max-height: 200px; margin-top: 10px; border-radius: 6px;" alt="Observación" />` : ''}
        </div>
      `;
    }

    // Preparar la firma
    let clientSignature = '';
    if (formData?.signature) {
      clientSignature = `<img src="${formData.signature}" style="max-width: 200px; max-height: 100px;" alt="Firma del cliente">`;
    }

    // AGREGAR LÍNEA DE ACEPTACIÓN DE TÉRMINOS
    const termsAcceptance = `
      <div class="info-section">
        <div class="section-title">Aceptación de Términos</div>
        <p><strong>El cliente acepta los términos y condiciones de no devolución de ${branchData?.name || formData?.branch_name || 'VEOPTICS'}.</strong></p>
        <p><em>Aceptado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</em></p>
      </div>
    `;

    // Formatear fecha de entrega si existe
    let deliveryText = 'No especificado';
    if (formData?.delivery_formatted) {
      deliveryText = formData.delivery_formatted;
    } else if (formData?.delivery_time) {
      deliveryText = formData.delivery_time;
    }

    // Reemplazar todas las variables en la plantilla
    let finalHtml = contractTemplate
      .replace(/{{clientName}}/g, fullName || '-')
      .replace(/{{clientPhone}}/g, patientData?.pt_phone || formData?.pt_phone || '-')
      .replace(/{{branchName}}/g, branchData?.name || formData?.branch_name || '-')
      .replace(/{{saleDate}}/g, formData?.date || '-')
      .replace(/{{measuresSection}}/g, measuresSection)
      .replace(/{{framePrice}}/g, '$' + Number(formData?.p_frame || 0).toLocaleString())
      .replace(/{{frameDiscount}}/g, formData?.discount_frame || 0)
      .replace(/{{frameTotalPrice}}/g, '$' + Number(formData?.total_p_frame || 0).toLocaleString())
      .replace(/{{lensPrice}}/g, '$' + Number(formData?.p_lens || 0).toLocaleString())
      .replace(/{{lensDiscount}}/g, formData?.discount_lens || 0)
      .replace(/{{lensTotalPrice}}/g, '$' + Number(formData?.total_p_lens || 0).toLocaleString())
      .replace(/{{totalGeneral}}/g, '$' + Number(formData?.total || 0).toLocaleString())
      .replace(/{{credit}}/g, '$' + Number(formData?.credit || 0).toLocaleString())
      .replace(/{{balance}}/g, '$' + Number(formData?.balance || 0).toLocaleString())
      .replace(/{{paymentMethod}}/g, formData?.payment_in || '-')
      .replace(/{{deliveryTime}}/g, deliveryText)
      .replace(/{{observationsSection}}/g, observationsSection + termsAcceptance)
      .replace(/{{clientSignature}}/g, clientSignature)
        .replace(/{{currentDate}}/g, new Date().toLocaleDateString('es-ES'));

      // Reemplazar el texto de agradecimiento por nombre y dirección de sucursal
      if (branchData?.address) {
        finalHtml = finalHtml.replace(
          /<p>Gracias por confiar en (.*?)<\/p>/,
          `<p>Gracias por confiar en ${branchData.name || '-'}<br><span style="font-size:9px;color:#555;">${branchData.address}</span></p>`
        );
      }

    
       // Crear nombre del archivo SIN caracteres especiales
    const safeName = fullName || "cliente"; 
    
    const cleanName = safeName
      .toLowerCase() // minúsculas
      .normalize("NFD") // normalizar caracteres unicode
      .replace(/[\u0300-\u036f]/g, "") // remover tildes y acentos
      .replace(/[^a-z0-9\s]/g, "") // solo letras, números y espacios
      .replace(/\s+/g, "-") // reemplazar espacios con guiones
      .trim(); // quitar espacios al inicio/final

    const fileName = `contrato-${cleanName || "cliente"}-${Date.now()}.pdf`; // ← Fallback extra
    
    console.log("Nombre original:", fullName);
    console.log("Nombre seguro:", safeName);
    console.log("Nombre limpio:", cleanName);
    console.log("Nombre final del archivo:", fileName);

    // Configuración para html2pdf
    const options = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    // Generar el PDF como blob
    const pdfBlob = await html2pdf().set(options).from(finalHtml).outputPdf('blob');
    
    // Subir a Supabase Storage en el bucket 'sales'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sales')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      throw new Error('Error subiendo PDF: ' + uploadError.message);
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('sales')
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Error obteniendo URL pública del PDF');
    }

    const pdfUrl = publicUrlData.publicUrl;

    // ACTUALIZAR LA TABLA SALES CON LA URL DEL PDF
    if (formData?.id) {
      const { error: updateError } = await supabase
        .from('sales')
        .update({ pdf_url: pdfUrl })
        .eq('id', formData.id);

      if (updateError) {
        console.error('Error actualizando URL en sales:', updateError);
        // No lanzar error aquí, el PDF ya se generó correctamente
      } else {
        console.log('✅ URL del PDF guardada en la tabla sales');
      }
    }

    // También descargar localmente
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = fileName;
    link.click();
    
    return { 
      success: true, 
      message: 'PDF generado, subido y URL guardada exitosamente',
      pdfUrl: pdfUrl,
      fileName: fileName
    };
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('Error al generar el PDF: ' + error.message);
  }
};