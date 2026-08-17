// contractTemplate.js
export const contractTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Orden de Laboratorio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
        }
        body {
            font-family: 'Helvetica', Arial, sans-serif;
            font-size: 8px;
            color: #2B2F36;
            background: #fff;
        }
        :root {
            --primary-color: #00A88E;
            --primary-dark: #00786A;
            --secondary-color: #5A6472;
            --border-color: #DCE2EA;
            --bg-light: #F3F7FB;
        }
        /* Todo el contenido cabe en máximo 6cm de alto, en una hoja A4 —
           así se puede imprimir sin desperdiciar papel. La caja de la foto
           tiene una altura FIJA (no proporcional al ancho), que era lo que
           antes la hacía crecer demasiado y desbalanceaba todo lo demás. */
        .sheet {
            padding: 4mm 5mm;
            max-height: 60mm;
            overflow: hidden;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 3px;
            border-bottom: 1.5px solid var(--primary-color);
            margin-bottom: 5px;
        }
        .brand {
            font-size: 11px;
            font-weight: 800;
            color: var(--primary-dark);
        }
        .doc-label {
            text-align: right;
        }
        .doc-label .title {
            font-size: 8px;
            font-weight: 700;
            color: var(--primary-color);
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .doc-label .ref {
            font-size: 7px;
            color: var(--secondary-color);
        }
        .patient-box {
            margin-bottom: 5px;
        }
        .patient-box .label {
            font-size: 6px;
            text-transform: uppercase;
            color: var(--secondary-color);
        }
        .patient-box .value {
            font-size: 10px;
            font-weight: 700;
            color: #1A1D22;
        }
        .columns {
            display: flex;
            gap: 8px;
        }
        .col-left {
            flex: 1.4;
        }
        .col-right {
            flex: 1;
        }
        .col-title {
            font-size: 6.5px;
            font-weight: 700;
            color: var(--primary-color);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
        }
        table.rx {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        table.rx th {
            font-size: 7px;
            text-transform: uppercase;
            color: var(--secondary-color);
            text-align: center;
            padding: 2px 1px;
            border-bottom: 1px solid var(--border-color);
        }
        table.rx td {
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            padding: 2px 1px;
            border-bottom: 1px solid var(--border-color);
        }
        table.rx td.eye {
            font-weight: 700;
            color: var(--primary-color);
            text-align: left;
        }
        .lens-type-box {
            background: var(--bg-light);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 3px 5px;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .lens-type-box .label-cell {
            font-size: 6.5px;
            color: var(--secondary-color);
            text-transform: uppercase;
        }
        .lens-type-box .value-cell {
            font-size: 8.5px;
            font-weight: 700;
            color: #1A1D22;
        }
        .observations {
            font-size: 7px;
            color: #1A1D22;
            line-height: 1.25;
            max-height: 12mm;
            overflow: hidden;
        }
        .product-box {
            background: var(--bg-light);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 4px 6px;
            margin-bottom: 4px;
        }
        .product-box .label-cell {
            font-size: 6px;
            text-transform: uppercase;
            color: var(--secondary-color);
        }
        .product-box .value-cell {
            font-size: 9px;
            font-weight: 700;
            color: #1A1D22;
        }
        /* Altura FIJA (no crece con el ancho de la columna) — así siempre
           queda horizontal y no se come el resto del espacio disponible. */
        .image-box {
            border: 1px solid var(--border-color);
            border-radius: 4px;
            overflow: hidden;
            width: 100%;
            height: 22mm;
            background: var(--bg-light);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .image-box img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        .image-box .placeholder {
            font-size: 6.5px;
            color: var(--secondary-color);
            text-align: center;
            width: 100%;
        }
        .footer {
            margin-top: 4px;
            padding-top: 2px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            font-size: 6px;
            color: var(--secondary-color);
        }
        .signature-line {
            width: 80px;
            border-top: 1px solid #9AA3AF;
            text-align: center;
            font-size: 6px;
            color: var(--secondary-color);
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="header">
            <div class="brand">{{branchName}}</div>
            <div class="doc-label">
                <div class="title">Orden de Laboratorio</div>
                <div class="ref">Venta #{{orderNumber}} · {{saleDate}}</div>
            </div>
        </div>

        <div class="patient-box">
            <div class="label">Paciente</div>
            <div class="value">{{clientName}}</div>
        </div>

        <div class="columns">
            <div class="col-left">
                <div class="col-title">RX Final</div>
                <table class="rx">
                    <thead>
                        <tr>
                            <th style="text-align:left;">Ojo</th>
                            <th>Esf.</th>
                            <th>Cil.</th>
                            <th>Eje</th>
                            <th>Prisma</th>
                            <th>ADD</th>
                            <th>AV VL</th>
                            <th>DNP</th>
                            <th>ALT</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="eye">OD</td>
                            <td>{{sphereRight}}</td>
                            <td>{{cylinderRight}}</td>
                            <td>{{axisRight}}</td>
                            <td>{{prismRight}}</td>
                            <td>{{addRight}}</td>
                            <td>{{avVlRight}}</td>
                            <td>{{dnpRight}}</td>
                            <td>{{altRight}}</td>
                        </tr>
                        <tr>
                            <td class="eye">OI</td>
                            <td>{{sphereLeft}}</td>
                            <td>{{cylinderLeft}}</td>
                            <td>{{axisLeft}}</td>
                            <td>{{prismLeft}}</td>
                            <td>{{addLeft}}</td>
                            <td>{{avVlLeft}}</td>
                            <td>{{dnpLeft}}</td>
                            <td>{{altLeft}}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="col-title">Tipo de luna</div>
                <div class="lens-type-box">
                    <span class="label-cell">Luna</span>
                    <span class="value-cell">{{lensDetails}}</span>
                </div>

                <div class="col-title">Observaciones</div>
                <div class="observations">{{observations}}</div>
            </div>

            <div class="col-right">
                <div class="col-title">Armazón</div>
                <div class="product-box">
                    <div class="label-cell">Marca</div>
                    <div class="value-cell">{{frameDetails}}</div>
                </div>

                <div class="col-title">Referencia</div>
                <div class="image-box">
                    {{userImageHtml}}
                </div>
            </div>
        </div>

        <div class="footer">
            <span>Generado automáticamente.</span>
            <div class="signature-line">Firma / Sello del laboratorio</div>
        </div>
    </div>
</body>
</html>
`;
