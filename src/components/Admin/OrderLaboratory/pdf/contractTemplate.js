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
            font-size: 8.5px;
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
        /* Reducido a aproximadamente la mitad del tamaño anterior en todos
           los espaciados y tipografías, para gastar mucho menos papel. */
        .sheet {
            padding: 4mm 4mm;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 4px;
            border-bottom: 1.5px solid var(--primary-color);
            margin-bottom: 7px;
        }
        .brand {
            font-size: 12px;
            font-weight: 800;
            color: var(--primary-dark);
        }
        .doc-label {
            text-align: right;
        }
        .doc-label .title {
            font-size: 9px;
            font-weight: 700;
            color: var(--primary-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .doc-label .ref {
            font-size: 7.5px;
            color: var(--secondary-color);
            margin-top: 1px;
        }
        .patient-box {
            margin-bottom: 8px;
        }
        .patient-box .label {
            font-size: 6.5px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: var(--secondary-color);
            margin-bottom: 1px;
        }
        .patient-box .value {
            font-size: 10.5px;
            font-weight: 700;
            color: #1A1D22;
        }
        .columns {
            display: flex;
            gap: 10px;
        }
        .col-left {
            flex: 1.4;
        }
        .col-right {
            flex: 1;
        }
        .col-title {
            font-size: 7px;
            font-weight: 700;
            color: var(--primary-color);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 3px;
            padding-bottom: 2px;
            border-bottom: 1px solid var(--border-color);
        }
        table.rx {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        table.rx th {
            font-size: 8px;
            text-transform: uppercase;
            color: var(--secondary-color);
            text-align: center;
            padding: 3px 2px;
            border-bottom: 1px solid var(--border-color);
        }
        table.rx td {
            font-size: 13px;
            font-weight: 600;
            text-align: center;
            padding: 3px 2px;
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
            border-radius: 5px;
            padding: 4px 6px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .lens-type-box .label-cell {
            font-size: 7px;
            color: var(--secondary-color);
            text-transform: uppercase;
        }
        .lens-type-box .value-cell {
            font-size: 9px;
            font-weight: 700;
            color: #1A1D22;
        }
        .observations {
            font-size: 8px;
            color: #1A1D22;
            line-height: 1.35;
            min-height: 26px;
        }
        .product-box {
            background: var(--bg-light);
            border: 1px solid var(--border-color);
            border-radius: 5px;
            padding: 5px 7px;
            margin-bottom: 7px;
        }
        .product-box .label-cell {
            font-size: 6.5px;
            text-transform: uppercase;
            color: var(--secondary-color);
            margin-bottom: 1px;
        }
        .product-box .value-cell {
            font-size: 9.5px;
            font-weight: 700;
            color: #1A1D22;
        }
        .image-box {
            border: 1px dashed var(--border-color);
            border-radius: 5px;
            padding: 5px;
            text-align: center;
            min-height: 55px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .image-box img {
            max-width: 100%;
            max-height: 75px;
            border-radius: 4px;
        }
        .image-box .placeholder {
            font-size: 7px;
            color: var(--secondary-color);
        }
        .footer {
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            font-size: 6.5px;
            color: var(--secondary-color);
        }
        .signature-line {
            width: 90px;
            border-top: 1px solid #9AA3AF;
            text-align: center;
            padding-top: 2px;
            font-size: 6.5px;
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
            <span>Documento generado automáticamente.</span>
            <div class="signature-line">Firma / Sello del laboratorio</div>
        </div>
    </div>
</body>
</html>
`;
