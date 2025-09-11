// certificateTemplate.js
export const certificateTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Agudeza Visual</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Arial', sans-serif; 
            font-size: 11px; 
            line-height: 1.4; 
            color: #333; 
            background: white;
            padding: 20px;
            max-width: 210mm;
            margin: 0 auto;
        }
        
        .header { 
            text-align: center; 
            margin-bottom: 25px; 
        }
        
        .logo { 
            font-size: 32px; 
            font-weight: bold; 
            color: #2d5aa0; 
            margin-bottom: 5px;
            letter-spacing: 3px;
        }
        
        .company-name { 
            font-size: 14px; 
            color: #666; 
            margin-bottom: 20px;
            letter-spacing: 1px;
        }
        
        .document-title { 
            font-size: 20px; 
            font-weight: bold; 
            text-align: center; 
            margin: 20px 0; 
            color: #333;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        
        .patient-info { 
            background: #f8f9fa; 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 5px;
            border-left: 4px solid #2d5aa0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .info-label { 
            font-weight: bold; 
            color: #2d5aa0;
            margin-right: 10px;
        }
        
        .measurements-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            border: 1px solid #ddd;
            font-size: 10px;
        }
        
        .measurements-table th, 
        .measurements-table td { 
            padding: 8px 6px; 
            text-align: center; 
            border: 1px solid #ddd;
        }
        
        .measurements-table th { 
            background: #f1f3f4; 
            font-weight: bold; 
            color: #333;
            font-size: 9px;
        }
        
        .measurements-table .eye-label {
            background: #e8f4f8;
            font-weight: bold;
            color: #2d5aa0;
            font-size: 11px;
        }
        
        .diagnosis-section { 
            margin: 20px 0; 
            padding: 15px;
            background: #fafafa;
            border-radius: 5px;
        }
        
        .diagnosis-title { 
            font-size: 14px; 
            font-weight: bold; 
            color: #333;
            margin-bottom: 10px;
        }
        
        .diagnosis-content {
            background: white;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 3px;
            min-height: 60px;
            font-size: 11px;
            line-height: 1.6;
        }
        
        .vision-tests { 
            margin: 20px 0; 
        }
        
        .vision-test { 
            margin-bottom: 15px;
            padding: 15px;
            background: #fafafa;
            border-radius: 5px;
        }
        
        .test-title { 
            font-size: 13px; 
            font-weight: bold; 
            color: #2d5aa0;
            margin-bottom: 8px;
        }
        
        .test-description {
            font-size: 10px;
            color: #666;
            margin-bottom: 10px;
            font-style: italic;
            line-height: 1.4;
        }
        
        .test-result { 
            display: flex; 
            align-items: center; 
            margin: 8px 0;
            font-size: 11px;
        }
        
        .radio-checked {
            position: relative;
            padding-left: 20px;
        }
        
        .radio-checked::before {
            content: "●";
            color: #2d5aa0;
            position: absolute;
            left: 0;
            font-size: 14px;
        }
        
        .checkbox-checked {
            position: relative;
            padding-left: 20px;
        }
        
        .checkbox-checked::before {
            content: "✓";
            font-weight: bold;
            color: #2d5aa0;
            position: absolute;
            left: 0;
            font-size: 12px;
        }
        
        .signatures-section { 
            margin-top: 50px; 
            display: flex; 
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .signature-box { 
            width: 200px; 
            text-align: center;
        }
        
        .signature-line { 
            border-bottom: 2px solid #333; 
            margin-bottom: 8px; 
            height: 60px;
            position: relative;
        }
        
        .signature-text {
            font-size: 10px;
            color: #666;
        }
        
        .doctor-info {
            text-align: center;
            font-size: 11px;
            line-height: 1.4;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
            background: #f8f9fa;
        }
        
        .doctor-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 3px;
            font-size: 12px;
        }
        
        .doctor-details {
            color: #666;
            margin-bottom: 2px;
        }
        
        .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 10px; 
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 8px;
            flex-wrap: wrap;
        }
        
        .color-issues {
            margin-top: 12px;
            padding: 12px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 3px;
            font-size: 10px;
            line-height: 1.4;
            display: {{showColorIssues}};
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="width: 100%; display: flex; justify-content: center;">
            {{certificateLogo}}
        </div>
        <div class="document-title">Certificado de Agudeza Visual</div>
    </div>

    <!-- Patient Information -->
    <div class="patient-info">
        <div>
            <span class="info-label">Paciente:</span>
            <span>{{patientName}}</span>
        </div>
        <div>
            <span class="info-label">Fecha:</span>
            <span>{{currentDate}}</span>
        </div>
    </div>

    <!-- Measurements Table -->
    <table class="measurements-table">
        <thead>
            <tr>
                <th>Rx FINAL</th>
                <th>ESFERA</th>
                <th>CILINDRO</th>
                <th>EJE</th>
                <th>PRISMA</th>
                <th>ADD</th>
                <th>AV VL</th>
                <th>AV VP</th>
                <th>DNP</th>
                <th>ALT</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="eye-label">OD</td>
                <td>{{sphereRight}}</td>
                <td>{{cylinderRight}}</td>
                <td>{{axisRight}}</td>
                <td>{{prismRight}}</td>
                <td>{{addRight}}</td>
                <td>{{avVlRight}}</td>
                <td>{{avVpRight}}</td>
                <td>{{dnpRight}}</td>
                <td>{{altRight}}</td>
            </tr>
            <tr>
                <td class="eye-label">OI</td>
                <td>{{sphereLeft}}</td>
                <td>{{cylinderLeft}}</td>
                <td>{{axisLeft}}</td>
                <td>{{prismLeft}}</td>
                <td>{{addLeft}}</td>
                <td>{{avVlLeft}}</td>
                <td>{{avVpLeft}}</td>
                <td>{{dnpLeft}}</td>
                <td>{{altLeft}}</td>
            </tr>
        </tbody>
    </table>

    <!-- Diagnosis -->
    <div class="diagnosis-section">
        <div class="diagnosis-title">Su diagnóstico es:</div>
        <div class="diagnosis-content">
            {{diagnosis}}
        </div>
    </div>

    <!-- Vision Tests -->
    <div class="vision-tests">
        <!-- Near Vision -->
        <div class="vision-test">
            <div class="test-title">Visión cercana</div>
            <div class="test-description">
                Capacidad de leer como mínimo, las letras de la escala 1 de la carta normalizada Jaeger...
            </div>
            <div class="test-result">
                <span class="{{nearVisionApproved}}">Aprobado</span>
                <span style="margin-left: 40px;" class="{{nearVisionNotApproved}}">No Aprobado</span>
            </div>
            <div class="test-result">
                <span class="{{needsLensesNear}}">Precisa lentes</span>
            </div>
        </div>

        <!-- Far Vision -->
        <div class="vision-test">
            <div class="test-title">Visión lejana</div>
            <div class="test-result">
                <span class="{{farVision2020}}">Mayor o igual a 20/20 en la escala SNELLEN</span>
            </div>
            <div class="test-result">
                <span class="{{farVisionLess2020}}">Menor a 20/20</span>
            </div>
            <div class="test-result">
                <span class="{{needsLensesFar}}">Precisa lentes</span>
            </div>
        </div>

        <!-- Color Perception -->
        <div class="vision-test">
            <div class="test-title">Percepción de colores</div>
            <div class="test-result">
                <span class="{{colorPerception}}">
                    Ha demostrado capacidad para distinguir y diferenciar los colores.
                </span>
            </div>
            
            <div class="color-issues">
                <strong>Tiene problemas para distinguir o diferenciar los siguientes colores:</strong><br>
                {{colorIssues}}
            </div>
        </div>
    </div>

    <!-- Signatures -->
    <div class="signatures-section">
        <div class="signature-box">
            <div class="signature-line">{{patientSignature}}</div>
            <div class="signature-text">Firma</div>
        </div>
        
        <div style="width: 100%; display: flex; justify-content: center; align-items: center;">
            <div class="doctor-info" style="margin: 0 auto;">
                {{doctorSeal}}
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer" style="display: flex; justify-content: center; align-items: center;">
        <div style="width: 100%; text-align: center;">
            {{footerInfo}}
        </div>
    </div>
</body>
</html>
`;