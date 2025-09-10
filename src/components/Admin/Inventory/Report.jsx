import { Button, useToast } from "@chakra-ui/react";

import html2pdf from 'html2pdf.js';
import { supabase } from "../../../api/supabase";

const GenerateInventoryReport = ({ branchFilter, inventoryList }) => {
  const toast = useToast();

  // Template HTML para el reporte
  const createReportTemplate = (reportData, fechaInicio, fechaFin, branchName) => {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Inventario</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #2d3748; 
            padding: 30px; 
            background: white; 
        }
        
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px; 
            border-bottom: 3px solid #2d5aa0; 
        }
        
        .company-logo { 
            width: 60px; 
            height: 60px; 
            background: #2d5aa0; 
            border-radius: 50%; 
            margin: 0 auto 15px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        
        .logo-text {
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        
        .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2d5aa0; 
            margin-bottom: 5px; 
        }
        
        .document-title { 
            font-size: 18px; 
            font-weight: bold; 
            text-align: center; 
            margin: 20px 0; 
            padding: 15px; 
            background: linear-gradient(135deg, #2d5aa0 0%, #1a365d 100%); 
            color: white; 
            border-radius: 8px; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .info-section { 
            background: #f7fafc; 
            padding: 20px; 
            margin: 20px 0; 
            border-left: 4px solid #2d5aa0; 
            border-radius: 0 8px 8px 0; 
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
        }
        
        .info-label { 
            font-weight: bold; 
            color: #2d5aa0; 
        }
        
        .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .data-table thead { 
            background: linear-gradient(135deg, #2d5aa0 0%, #1a365d 100%); 
            color: white; 
        }
        
        .data-table th, 
        .data-table td { 
            padding: 12px 15px; 
            text-align: left; 
            border: none;
        }
        
        .data-table th { 
            font-weight: bold; 
            text-transform: uppercase; 
            font-size: 11px; 
            letter-spacing: 0.5px;
        }
        
        .data-table tbody tr { 
            background: white; 
            border-bottom: 1px solid #e2e8f0;
            transition: background-color 0.2s;
        }
        
        .data-table tbody tr:nth-child(even) { 
            background: #f8fafc; 
        }
        
        .data-table tbody tr:hover { 
            background: #edf2f7; 
        }
        
        .data-table td { 
            font-size: 11px; 
        }
        
        .summary-section {
            margin-top: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .summary-title {
            font-size: 16px;
            font-weight: bold;
            color: #2d5aa0;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .summary-stats {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        
        .stat-item {
            text-align: center;
            min-width: 120px;
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #2d5aa0;
        }
        
        .stat-label {
            font-size: 10px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 10px; 
            color: #718096; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 20px;
        }
        
        .stock-alert {
            color: #e53e3e;
            font-weight: bold;
        }
        
        .stock-good {
            color: #38a169;
            font-weight: bold;
        }
        
        .stock-warning {
            color: #d69e2e;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-logo">
            <span class="logo-text">OV</span>
        </div>
        <div class="company-name">Óptica Veoptics</div>
        <div style="font-size: 12px; color: #718096;">Sistema de Gestión de Inventario</div>
    </div>
    
    <div class="document-title">Reporte de Inventario</div>
    
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Sucursal:</span>
            <span>${branchName || branchFilter}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Fecha Inicio:</span>
            <span>${new Date(fechaInicio).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Fecha Fin:</span>
            <span>${new Date(fechaFin).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Generado:</span>
            <span>${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}</span>
        </div>
    </div>
    
    <table class="data-table">
        <thead>
            <tr>
                <th>Marca</th>
                <th>Stock Inicial</th>
                <th>Salidas</th>
                <th>Stock Final</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            ${reportData.map(item => {
                let stockClass = 'stock-good';
                let estadoText = 'Normal';
                
                    // Calcular el stock final correctamente
                    const stockFinal = item.stock_inicial - item.salidas;
                    if (stockFinal <= 0) {
                        stockClass = 'stock-alert';
                        estadoText = 'Sin Stock';
                    } else if (stockFinal <= 5) {
                        stockClass = 'stock-warning';
                        estadoText = 'Stock Bajo';
                    }
                    return `
                    <tr>
                        <td><strong>${item.brand}</strong></td>
                        <td>${item.stock_inicial}</td>
                        <td>${item.salidas}</td>
                        <td class="${stockClass}">${stockFinal}</td>
                        <td class="${stockClass}">${estadoText}</td>
                    </tr>
                    `;
            }).join('')}
        </tbody>
    </table>
    
    <div class="summary-section">
        <div class="summary-title">Resumen del Período</div>
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-value">${reportData.length}</div>
                <div class="stat-label">Total Marcas</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${reportData.reduce((sum, item) => sum + item.stock_inicial, 0)}</div>
                <div class="stat-label">Stock Inicial Total</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${reportData.reduce((sum, item) => sum + item.salidas, 0)}</div>
                <div class="stat-label">Total Salidas</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${reportData.reduce((sum, item) => sum + item.stock_final, 0)}</div>
                <div class="stat-label">Stock Final Total</div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p><strong>Óptica Veoptics</strong> - Sistema de Gestión de Inventario</p>
        <p>Reporte generado automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
    </div>
</body>
</html>
    `;
  };

  const handleGenerateReport = async () => {
    if (!branchFilter) {
      toast({
        title: "Seleccione una sucursal",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Obtener fecha de inicio
      const { data: firstMovement } = await supabase
        .from("inventario_movimiento")
        .select("created_at")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      const fechaInicio = firstMovement?.created_at ? new Date(firstMovement.created_at) : new Date();
      const fechaFin = new Date();

      // Llamar función almacenada que genera el reporte
      const { data: reportData, error } = await supabase.rpc(
        "reporte_inventario_filtrado",
        {
          p_fecha_inicio: fechaInicio.toISOString(),
          p_fecha_fin: fechaFin.toISOString(),
        }
      );

      if (error) throw error;

      if (!reportData || reportData.length === 0) {
        toast({
          title: "No hay datos para el reporte",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Obtener nombre de la sucursal
      const { data: branchData } = await supabase
        .from("sucursales")
        .select("nombre")
        .eq("id", branchFilter)
        .single();

      const branchName = branchData?.nombre || `Sucursal ${branchFilter}`;

      // Crear el HTML del reporte
      const htmlContent = createReportTemplate(reportData, fechaInicio, fechaFin, branchName);

      // Configuración para html2pdf
      const opt = {
        margin: 0.5,
        filename: `reporte_inventario_${branchFilter}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      // Generar PDF
      await html2pdf().set(opt).from(htmlContent).save();

      toast({
        title: "Reporte generado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Guardar registro del corte en inventario_corte
      await supabase.from("inventario_corte").insert([
        {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
      ]);

    } catch (err) {
      console.error("Error generando reporte:", err);
      toast({
        title: "Error generando el reporte",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Button 
      colorScheme="teal" 
      onClick={handleGenerateReport} 
      mt={4} 
      mb={4}
      size="md"
      leftIcon={<span>📄</span>}
    >
      Generar Reporte PDF
    </Button>
  );
};

export default GenerateInventoryReport;