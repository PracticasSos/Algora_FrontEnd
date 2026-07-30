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
            color: #2B2F36;
            background: #fff;
            margin: 0;
            padding: 0;
        }
        :root {
            --primary-color: #1B5E9E;
            --primary-dark: #0F3D6B;
            --secondary-color: #5A6472;
            --border-color: #DCE2EA;
            --rule-color: #C6CEDA;
        }
        .certificate-container {
            padding: 30px 40px;
            background: white;
            margin: 0 auto;
        }
        /* --- Header Section --- */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            padding-bottom: 14px;
            border-bottom: 1px solid var(--rule-color);
        }
        .header-left {
            flex: 0 0 150px;
        }
        .header-left img {
            max-width: 100%;
            max-height: 68px;
            object-fit: contain;
        }
        .header-right {
            flex-grow: 1;
            text-align: right;
        }
        .branch-details {
            font-size: 11px;
            line-height: 1.4;
            color: var(--secondary-color);
        }
        .branch-details .branch-name {
            font-size: 13.5px;
            font-weight: 700;
            color: var(--primary-dark);
            letter-spacing: 0.3px;
        }
        .branch-details p {
            margin: 2px 0;
        }
        /* --- Title --- */
        .document-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--primary-dark);
            text-transform: uppercase;
            letter-spacing: 1.8px;
            text-align: center;
            margin: 18px 0 5px;
        }
        .document-subtitle {
            text-align: center;
            font-size: 9.5px;
            color: var(--secondary-color);
            letter-spacing: 0.5px;
            margin-bottom: 18px;
        }
        /* --- Patient Info --- */
        .patient-info {
            display: flex;
            justify-content: space-between;
            padding: 8px 0 12px;
            margin-bottom: 16px;
            border-bottom: 1px solid var(--rule-color);
            font-size: 12px;
        }
        .info-label {
            font-weight: 600;
            color: var(--secondary-color);
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 2px;
        }
        .info-value {
            font-size: 13px;
            font-weight: 600;
            color: #1A1D22;
        }
        .main-content {
            margin-bottom: 8px;
        }
        /* --- Measurements table --- */
        .measurements-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10.5px;
        }
        .measurements-table th,
        .measurements-table td {
            padding: 7px 6px;
            text-align: center;
            border-bottom: 1px solid var(--border-color);
        }
        .measurements-table thead th {
            border-bottom: 2px solid var(--primary-dark);
            font-weight: 700;
            color: var(--primary-dark);
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding-bottom: 7px;
        }
        .measurements-table .eye-label {
            font-weight: 700;
            color: var(--primary-color);
            font-size: 12px;
            text-align: left;
        }
        /* --- Section titles --- */
        .section-title {
            font-size: 10.5px;
            font-weight: 700;
            color: var(--primary-dark);
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 8px;
        }
        .diagnosis-section {
            margin-bottom: 18px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--rule-color);
        }
        .diagnosis-content {
            font-size: 11.5px;
            line-height: 1.5;
            white-space: pre-wrap;
            color: #2B2F36;
        }
        /* --- Vision tests --- */
        .vision-tests-grid {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: 4px;
        }
        .vision-test {
            flex: 1 1 50%;
            padding: 0 20px 12px 0;
        }
        .vision-test:nth-child(2) {
            padding-left: 20px;
            padding-right: 0;
            border-left: 1px solid var(--rule-color);
        }
        .vision-test.full-width {
            flex-basis: 100%;
            padding: 12px 0 0;
            border-top: 1px solid var(--rule-color);
            margin-top: 4px;
        }
        .test-title {
            font-size: 12px;
            font-weight: 700;
            color: var(--primary-dark);
            margin-bottom: 3px;
        }
        .test-description {
            font-size: 9.5px;
            color: var(--secondary-color);
            margin-bottom: 8px;
            font-style: italic;
        }
        .test-result {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
            font-size: 11.5px;
            color: var(--secondary-color);
        }
        .option-label.option-checked {
            color: #1A1D22;
            font-weight: 600;
        }
        .option-check {
            color: var(--primary-color);
            font-weight: 700;
            margin-left: 4px;
        }
        /* --- Patologías / Prescripción / Observación --- */
        .clinical-section {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid var(--rule-color);
        }
        .pathology-row {
            display: flex;
            gap: 30px;
            margin-bottom: 4px;
            font-size: 11.5px;
        }
        .pathology-row .eye {
            font-weight: 700;
            color: var(--primary-color);
            margin-right: 6px;
        }
        .prescription-choice {
            display: flex;
            gap: 24px;
            margin: 10px 0 10px;
        }
        .treatment-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            row-gap: 6px;
            column-gap: 20px;
        }
        .treatment-list .option-label {
            font-size: 11px;
        }
        .observation-section {
            margin-top: 12px;
            font-size: 11.5px;
            display: {{showObservation}};
        }
        /* --- Footer / signatures --- */
        .footer-section {
            margin-top: 24px;
            page-break-inside: avoid;
        }
        .signatures-grid {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            min-height: 80px;
        }
        .signature-box {
            text-align: center;
            width: 260px;
        }
        .signature-seal {
            min-height: 55px;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            margin-bottom: 3px;
        }
        .signature-seal img {
            max-width: 115px;
            max-height: 55px;
            object-fit: contain;
        }
        .signature-line {
            border-bottom: 1px solid #9AA3AF;
            height: 40px;
            margin-bottom: 5px;
            display: flex;
            justify-content: center;
            align-items: flex-end;
        }
        .signature-line img {
            max-width: 100%;
            max-height: 44px;
            object-fit: contain;
        }
        .signature-text {
            font-size: 10.5px;
            font-weight: 500;
            color: var(--secondary-color);
            letter-spacing: 0.3px;
        }
        .doctor-info {
            text-align: center;
            margin-top: 4px;
        }
        .doctor-info .doctor-name {
            font-size: 11px;
            font-weight: 700;
            color: #1A1D22;
        }
        .doctor-info .doctor-reg {
            font-size: 9px;
            color: var(--secondary-color);
        }
        .footer-brand {
            text-align: center;
            font-size: 9px;
            color: #9AA3AF;
            margin-top: 20px;
            letter-spacing: 0.3px;
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
        <p class="document-subtitle">Evaluación optométrica profesional</p>

        <section class="patient-info">
            <div>
                <span class="info-label">Paciente</span>
                <span class="info-value">{{patientName}}</span>
            </div>
            <div>
                <span class="info-label">Fecha de emisión</span>
                <span class="info-value">{{currentDate}}</span>
            </div>
        </section>

        <main class="main-content">
            <table class="measurements-table">
                <thead>
                    <tr>
                        <th style="text-align:left;">Rx Final</th>
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
                <h2 class="section-title">Diagnóstico profesional</h2>
                <div class="diagnosis-content">{{diagnosis}}</div>
            </div>

            <h2 class="section-title">Pruebas de capacidad visual</h2>
            <div class="vision-tests-grid">
                <div class="vision-test">
                    <h3 class="test-title">Visión cercana</h3>
                    <p class="test-description">Última línea legible de la carta Jaeger: <b style="color:var(--primary-dark); font-style: normal;">{{nearVisionLine}}</b>.</p>
                    <div class="test-result"><span class="option-label {{needsLensesNear}}">Precisa lentes correctores{{needsLensesNearCheck}}</span></div>
                </div>
                <div class="vision-test">
                    <h3 class="test-title">Visión lejana</h3>
                    <p class="test-description">Agudeza visual según la escala de SNELLEN.</p>
                    <div class="test-result"><span class="option-label {{farVision2020}}">Agudeza 20/20 o superior{{farVision2020Check}}</span></div>
                    <div class="test-result"><span class="option-label {{farVisionLess2020}}">Agudeza menor a 20/20{{farVisionLess2020Check}}</span></div>
                    <div class="test-result"><span class="option-label {{needsLensesFar}}">Precisa lentes correctores{{needsLensesFarCheck}}</span></div>
                </div>
                <div class="vision-test full-width">
                    <h3 class="test-title">Percepción de colores</h3>
                    <div class="test-result">
                        <span class="option-label {{colorPerceptionGood}}">Demuestra capacidad para distinguir y diferenciar los colores.{{colorPerceptionGoodCheck}}</span>
                    </div>
                    <div class="test-result">
                        <span class="option-label {{colorPerceptionBad}}">Presenta dificultad para distinguir los siguientes colores: {{colorIssues}}{{colorPerceptionBadCheck}}</span>
                    </div>
                </div>
            </div>

            <div class="clinical-section">
                <h2 class="section-title">Patologías</h2>
                <div class="pathology-row"><span class="eye">O.D</span> {{pathologyOD}}</div>
                <div class="pathology-row"><span class="eye">O.I</span> {{pathologyOI}}</div>

                <h2 class="section-title" style="margin-top:16px;">En consecuencia</h2>
                <div class="prescription-choice">
                    <span class="option-label {{prescribesYes}}">Se prescribe{{prescribesYesCheck}}</span>
                    <span class="option-label {{prescribesNo}}">No se prescribe{{prescribesNoCheck}}</span>
                </div>
                <div class="treatment-list">
                    <span class="option-label {{treatmentOptometric}}">Tratamiento Optométrico y Ortóptico{{treatmentOptometricCheck}}</span>
                    <span class="option-label {{treatmentOphthalmological}}">Tratamiento Oftalmológico{{treatmentOphthalmologicalCheck}}</span>
                    <span class="option-label {{treatmentPermanentLenses}}">Lentes correctos permanentes{{treatmentPermanentLensesCheck}}</span>
                    <span class="option-label {{treatmentOccasionalLenses}}">Lentes correctores de uso ocasional{{treatmentOccasionalLensesCheck}}</span>
                    <span class="option-label {{treatmentContactLenses}}">Lentes de Contacto{{treatmentContactLensesCheck}}</span>
                </div>

                <div class="observation-section">
                    <span class="info-label">Observación</span>
                    <div>{{observation}}</div>
                </div>
            </div>
        </main>

        <footer class="footer-section">
            <div class="signatures-grid">
                <div class="signature-box professional">
                    <div class="signature-seal">
                        {{doctorSeal}}
                    </div>
                    <div class="signature-line">
                        {{doctorSignature}}
                    </div>
                    <div class="doctor-info">
                        <div class="doctor-name">{{doctorName}}</div>
                        <div class="doctor-reg">{{doctorCi}}</div>
                        <div class="doctor-reg">{{doctorSenescyt}}</div>
                    </div>
                    <div class="signature-text">Firma y sello profesional</div>
                </div>
            </div>
            <p class="footer-brand">Este documento certifica los resultados de la evaluación de agudeza visual realizada en la fecha indicada.</p>
        </footer>
    </div>
</body>
</html>
`;
