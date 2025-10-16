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
            -webkit-print-color-adjust: exact;
        }

            body {
                font-family: 'Helvetica', Arial, sans-serif;
                font-size: 11.5px;
                line-height: 1.5;
                color: #333;
                background: #fff;
                margin: 0;
                padding: 0;
            }
        :root {
            --primary-color: #005A9C;
            --secondary-color: #4A4A4A;
            --border-color: #EAEAEA;
            --background-light: #F8F9FA;
        }
        .certificate-container {
            border: 1px solid var(--border-color);
            padding: 25px;
            border-radius: 8px;
            background: white;
            margin: 0 auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        /* --- Header Section --- */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 20px;
        }
        .header-left {
            flex: 0 0 160px;
        }
        .header-left img {
            max-width: 100%;
            max-height: 75px;
            object-fit: contain;
        }
        .header-right {
            flex-grow: 1;
            text-align: right;
        }
        .branch-details {
            font-size: 11.5px;
            line-height: 1.4;
            color: var(--secondary-color);
            margin-bottom: 15px;
        }
        .branch-details .branch-name {
            font-size: 14px;
            font-weight: 600;
            color: #000;
        }
        .branch-details p {
            margin: 2px 0;
        }
        /* --- Title Centered --- */
        .document-title {
            font-size: 22px;
            font-weight: 600;
            color: var(--primary-color);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 auto;
            text-align: center;
            display: block;
            margin-bottom: 15px;
        }
        /* --- Patient Info Section --- */
        .patient-info {
            background: var(--background-light);
            padding: 12px 18px;
            margin-bottom: 25px;
            border-radius: 6px;
            border-left: 5px solid var(--primary-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
        }
        .info-label {
            font-weight: 600;
            color: var(--primary-color);
            margin-right: 8px;
        }
        .main-content {
            margin-bottom: 30px;
        }
        .measurements-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 11px;
        }
        .measurements-table th, 
        .measurements-table td {
            padding: 9px 6px;
            text-align: center;
            border: 1px solid var(--border-color);
        }
        .measurements-table th {
            background: #F1F3F4;
            font-weight: 600;
            color: #333;
            font-size: 10px;
            text-transform: uppercase;
        }
        .measurements-table .eye-label {
            background: #EAF2F8;
            font-weight: 700;
            color: var(--primary-color);
            font-size: 12px;
        }
        .diagnosis-section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--secondary-color);
            margin-bottom: 10px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 5px;
        }
        .diagnosis-content {
            background: var(--background-light);
            padding: 15px;
            border-radius: 4px;
            min-height: 50px;
            white-space: pre-wrap;
        }
        .vision-tests-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 25px;
        }
        .vision-test {
            background: var(--background-light);
            padding: 15px;
            border-radius: 6px;
            flex: 1 1 calc(50% - 10px);
        }
        .vision-test.full-width {
            flex-basis: 100%;
        }
        .test-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--primary-color);
            margin-bottom: 8px;
        }
        .test-description {
            font-size: 10px;
            color: #666;
            margin-bottom: 12px;
            font-style: italic;
        }
        .test-result {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        .radio-checked::before, .checkbox-checked::before {
            font-family: 'Arial', sans-serif;
            color: var(--primary-color);
            font-size: 18px;
            width: 20px;
            display: inline-block;
            text-align: left;
        }
        .radio-checked::before {
            content: "●";
            line-height: 1;
        }
        .checkbox-checked::before {
            content: "✓";
            font-weight: bold;
            line-height: 1;
        }
        .color-issues {
            margin-top: 12px;
            padding: 10px;
            background: #FFF9E6;
            border-left: 3px solid #FFC107;
            font-size: 10px;
            display: {{showColorIssues}};
        }
        .footer-section {
            border-top: 2px solid var(--border-color);
            padding-top: 30px;
            margin-top: 30px;
        }
        .signatures-grid {
            display: flex;
            justify-content: space-around;
            align-items: flex-end;
            gap: 40px;
            margin-bottom: 40px;
            min-height: 120px;
        }
        .signature-box {
            text-align: center;
            width: 45%;
        }
        .signature-line {
            border-bottom: 1.5px solid #999;
            height: 70px;
            margin-bottom: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .signature-line img {
            max-width: 100%;
            max-height: 60px;
            object-fit: contain;
        }
        .signature-text {
            font-size: 11px;
            font-weight: 600;
            color: var(--secondary-color);
        }
        .doctor-seal {
            width: 130px;
            height: 90px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto;
        }
        .doctor-seal img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        .footer-text {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <header class="header">
            <div class="header-left">
                {{certificateLogo}}
            </div>
            <div class="header-right">
                {{branchInfo}}
            </div>
        </header>
        <h1 class="document-title">Certificado de Agudeza Visual</h1>
        <section class="patient-info">
            <div>
                <span class="info-label">Paciente:</span>
                <span>{{patientName}}</span>
            </div>
            <div>
                <span class="info-label">Fecha de Emisión:</span>
                <span>{{currentDate}}</span>
            </div>
        </section>
        <main class="main-content">
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
            <div class="diagnosis-section">
                <h2 class="section-title">Diagnóstico Profesional</h2>
                <div class="diagnosis-content">{{diagnosis}}</div>
            </div>
            <h2 class="section-title">Pruebas de Capacidad Visual</h2>
            <div class="vision-tests-grid">
                <div class="vision-test">
                    <h3 class="test-title">Visión Cercana</h3>
                    <p class="test-description">Capacidad de leer la escala 1 de la carta Jaeger.</p>
                    <div class="test-result"><span class="{{nearVisionApproved}}">Aprobado</span></div>
                    <div class="test-result"><span class="{{nearVisionNotApproved}}">No Aprobado</span></div>
                    <div class="test-result"><span class="{{needsLensesNear}}">Precisa lentes correctores</span></div>
                </div>
                <div class="vision-test">
                    <h3 class="test-title">Visión Lejana</h3>
                    <p class="test-description">Agudeza visual según la escala de SNELLEN.</p>
                    <div class="test-result"><span class="{{farVision2020}}">Agudeza 20/20 o superior</span></div>
                    <div class="test-result"><span class="{{farVisionLess2020}}">Agudeza menor a 20/20</span></div>
                    <div class="test-result"><span class="{{needsLensesFar}}">Precisa lentes correctores</span></div>
                </div>
                <div class="vision-test full-width">
                    <h3 class="test-title">Percepción de Colores</h3>
                    <div class="test-result">
                        <span class="{{colorPerception}}">Demuestra capacidad para distinguir y diferenciar colores.</span>
                    </div>
                    <div class="color-issues">
                        <strong>Presenta dificultad para distinguir los siguientes colores:</strong><br>
                        {{colorIssues}}
                    </div>
                </div>
            </div>
        </main>
        <footer class="footer-section">
            <div class="signatures-grid">
                <div class="signature-box patient">
                    <div class="signature-line">
                        {{patientSignature}}
                    </div>
                    <div class="signature-text" style="font-weight: 400;">Firma</div>
                </div>
                <div class="signature-box professional">
                    <div class="doctor-seal">
                        {{doctorSeal}}
                    </div>
                </div>
            </div>
           
        </footer>
    </div>
</body>
</html>
`;
