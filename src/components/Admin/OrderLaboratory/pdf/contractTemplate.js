export const contractTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket de Servicio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            color: #000;
            background: white;
            width: 267mm;
            max-width: 267mm;
            padding: 15px;
            margin: 0 auto;
        }

        .ticket-container {
            width: 100%;
            border: 2px solid #000;
            padding: 15px;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
        }

        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
        }

        .logo-icon {
            width: 40px;
            height: 40px;
            border: 2px solid #000;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-weight: bold;
            font-size: 16px;
        }

        .company-name {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 2px;
        }

        .company-subtitle {
            font-size: 10px;
            margin-top: 2px;
        }

        .info-line {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 11px;
        }

        .info-line strong {
            font-weight: bold;
        }

        .section-divider {
            border-bottom: 1px solid #000;
            margin: 10px 0;
        }

        .patient-section {
            margin: 15px 0;
        }

        .patient-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .measures-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10px;
        }

        .measures-table th,
        .measures-table td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: center;
        }

        .measures-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }

        .eye-label {
            font-weight: bold;
            background-color: #f0f0f0;
        }

        .product-section {
            margin: 15px 0;
        }

        .product-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
            text-decoration: underline;
        }

        .product-detail {
            margin: 3px 0;
            font-size: 11px;
        }

        .observations-section {
            margin: 15px 0;
        }

        .observations-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
            text-decoration: underline;
        }

        /* --- Estilo opcional para el contenedor de la imagen --- */
        #user-image-container {
            margin-top: 15px; /* Espacio antes de la imagen */
            margin-bottom: 15px; /* Espacio después de la imagen */
            border-top: 1px solid #000; /* Separador opcional */
            padding-top: 10px; /* Espacio dentro del separador */
            text-align: center; /* Centrar imagen por defecto */
        }

        .footer-space {
            height: 30px;
            border-bottom: 1px solid #000;
            margin-top: 20px;
        }

        @media print {
            body {
                width: 267mm;
                height: 455mm;
                margin: 0;
                padding: 15px;
            }
            .ticket-container {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="header">
            <div class="logo-section">
                <div>
                    <div class="company-name">{{branchName}}</div>
                </div>
            </div>
        </div>

        <div class="info-line"><span><strong>SUCURSAL:</strong> {{branchName}}</span></div>
        <div class="info-line"><span><strong>FECHA:</strong> {{saleDate}}</span></div>
        <div class="info-line"><span><strong>ORDEN:</strong> {{orderNumber}}</span></div>

        <div class="section-divider"></div>

        <div class="patient-section">
            <div class="patient-name">PACIENTE:</div>
            <div class="patient-name">{{clientName}}</div>
        </div>

        <div class="section-divider"></div>

        <table class="measures-table">
            <thead>
                <tr><th>RX Final</th><th>Esfera</th><th>Cilindro</th><th>Eje</th><th>Prisma</th></tr>
            </thead>
            <tbody>
                <tr><td class="eye-label">OD</td><td>{{sphereRight}}</td><td>{{cylinderRight}}</td><td>{{axisRight}}</td><td>{{prismRight}}</td></tr>
                <tr><td class="eye-label">OI</td><td>{{sphereLeft}}</td><td>{{cylinderLeft}}</td><td>{{axisLeft}}</td><td>{{prismLeft}}</td></tr>
            </tbody>
        </table>

        <table class="measures-table">
            <thead>
                <tr><th></th><th>ADD</th><th>AV VL</th><th>DNP</th><th>ALT</th></tr>
            </thead>
            <tbody>
                <tr><td class="eye-label">OD</td><td>{{addRight}}</td><td>{{avVlRight}}</td><td>{{dnpRight}}</td><td>{{altRight}}</td></tr>
                <tr><td class="eye-label">OI</td><td>{{addLeft}}</td><td>{{avVlLeft}}</td><td>{{dnpLeft}}</td><td>{{altLeft}}</td></tr>
            </tbody>
        </table>

        <div class="section-divider"></div>

        <div class="product-section">
            <div class="product-title">ARMAZÓN:</div>
            <div class="product-detail">{{frameDetails}}</div>
        </div>

        <div class="section-divider"></div>

        <div class="product-section">
            <div class="product-title">LUNAS:</div>
            <div class="product-detail">{{lensDetails}}</div>
        </div>

        <div class="section-divider"></div>

        <div class="observations-section">
            <div class="observations-title">OBSERVACIÓN:</div>
            <div class="product-detail">{{observations}}</div>
        </div>

        <div id="user-image-container">
            {{userImageHtml}}  </div>
        <div class="footer-space"></div>
    </div>
</body>
</html>
`;