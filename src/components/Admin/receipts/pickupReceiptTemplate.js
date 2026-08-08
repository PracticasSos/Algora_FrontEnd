// pickupReceiptTemplate.js
export const pickupReceiptTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante de Retiro</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
        }
        body {
            font-family: 'Helvetica', Arial, sans-serif;
            font-size: 12px;
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
        .container {
            padding: 36px 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 16px;
            border-bottom: 2px solid var(--primary-color);
            margin-bottom: 20px;
        }
        .brand {
            font-size: 18px;
            font-weight: 800;
            color: var(--primary-dark);
        }
        .doc-label {
            text-align: right;
        }
        .doc-label .title {
            font-size: 13px;
            font-weight: 700;
            color: var(--primary-color);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .doc-label .ref {
            font-size: 11px;
            color: var(--secondary-color);
            margin-top: 2px;
        }
        .status-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
        }
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--primary-color);
            flex-shrink: 0;
        }
        .status-text {
            font-size: 13px;
            font-weight: 700;
            color: var(--primary-dark);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .info-block .label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--secondary-color);
            margin-bottom: 3px;
        }
        .info-block .value {
            font-size: 13px;
            font-weight: 600;
            color: #1A1D22;
        }
        .product-box {
            background: var(--bg-light);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px 18px;
            margin-bottom: 20px;
        }
        .product-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 12px;
        }
        .product-row .label-cell {
            color: var(--secondary-color);
        }
        .product-row .value-cell {
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        td {
            padding: 8px 4px;
            border-bottom: 1px solid var(--border-color);
            font-size: 12px;
        }
        td.label-cell {
            color: var(--secondary-color);
        }
        td.value-cell {
            text-align: right;
            font-weight: 600;
        }
        tr.total-row td {
            border-bottom: none;
            border-top: 2px solid var(--primary-dark);
            padding-top: 12px;
            font-size: 14px;
        }
        tr.total-row td.value-cell {
            color: {{balanceColor}};
            font-weight: 800;
        }
        .signature-area {
            margin-top: 36px;
            display: flex;
            justify-content: center;
        }
        .signature-line {
            width: 260px;
            border-bottom: 1px solid #9AA3AF;
            height: 50px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            margin-bottom: 6px;
        }
        .signature-line img {
            max-width: 100%;
            max-height: 46px;
            object-fit: contain;
        }
        .signature-text {
            text-align: center;
            font-size: 10.5px;
            color: var(--secondary-color);
        }
        .footer {
            margin-top: 24px;
            padding-top: 14px;
            border-top: 1px solid var(--border-color);
            text-align: center;
            font-size: 10px;
            color: var(--secondary-color);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">{{branchName}}</div>
            <div class="doc-label">
                <div class="title">Comprobante de Retiro</div>
                <div class="ref">Venta #{{saleId}} · {{issueDate}}</div>
            </div>
        </div>

        <div class="status-row">
            <div class="status-dot"></div>
            <div class="status-text">Producto retirado</div>
        </div>

        <div class="info-grid">
            <div class="info-block">
                <div class="label">Paciente</div>
                <div class="value">{{patientName}}</div>
            </div>
            <div class="info-block">
                <div class="label">C.I.</div>
                <div class="value">{{patientCi}}</div>
            </div>
            <div class="info-block">
                <div class="label">Fecha de retiro</div>
                <div class="value">{{pickupDate}}</div>
            </div>
        </div>

        <div class="product-box">
            <div class="product-row">
                <span class="label-cell">Armazón</span>
                <span class="value-cell">{{frameName}}</span>
            </div>
            <div class="product-row">
                <span class="label-cell">Luna</span>
                <span class="value-cell">{{lensName}}</span>
            </div>
        </div>

        <table>
            <tr>
                <td class="label-cell">Total de la compra</td>
                <td class="value-cell">{{saleTotal}}</td>
            </tr>
            <tr>
                <td class="label-cell">Abonado hasta hoy</td>
                <td class="value-cell">{{paidSoFar}}</td>
            </tr>
            <tr class="total-row">
                <td class="label-cell">{{balanceLabel}}</td>
                <td class="value-cell">{{pendingBalance}}</td>
            </tr>
        </table>

        <div class="signature-area">
            <div>
                <div class="signature-line">{{signatureImg}}</div>
                <div class="signature-text">Firma de conformidad — recibí el producto en buen estado</div>
            </div>
        </div>

        <div class="footer">
            Este comprobante certifica la entrega y retiro del producto en la fecha indicada.
        </div>
    </div>
</body>
</html>
`;
