export const contractTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Servicio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; font-size: 10px; line-height: 1.3; color: #333; padding: 20px; max-width: 210mm; background: white; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #2d3748; }
        .company-logo { font-size: 20px; font-weight: bold; color: #2d3748; margin-bottom: 5px; }
        .document-title { font-size: 16px; font-weight: bold; text-align: center; margin: 15px 0; padding: 10px; background: linear-gradient(135deg, #219BAA 0%, #26838fff 100%); color: white; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-section { background: #f8f9fa; padding: 12px; margin: 12px 0; border-left: 3px solid #219BAA; border-radius: 0 4px 4px 0; }
        .section-title { font-size: 12px; font-weight: bold; color: #2d3748; margin-bottom: 8px; }
        .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
        .data-table th { background: #4a5568; color: white; padding: 8px 6px; text-align: center; font-size: 9px; }
        .data-table td { border: 1px solid #e2e8f0; padding: 6px 6px; text-align: center; font-size: 9px; }
        .client-info { display: flex; flex-wrap: wrap; gap: 15px; }
        .client-info p { margin: 3px 0; flex: 1; min-width: 45%; }
        .totals { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
        .totals p { margin: 3px 0; flex: 1; min-width: 45%; font-size: 10px; }
        .signature-area { margin-top: 30px; font-size: 10px; }
        .footer { margin-top: 15px; text-align: center; font-size: 9px; }
        .page-break { page-break-before: always; }
        .terms { font-size: 8px; line-height: 1.2; }
        .terms p { margin: 3px 0; }
        .terms strong { font-size: 9px; }
    </style>
</head>
<body>
    <!-- PÁGINA 1: CONTRATO -->
    <div class="header">
        <div class="company-logo">{{branchName}}</div>
    </div>
    
    <div class="document-title">Contrato de Servicio</div>
    
    <div class="info-section">
        <div class="section-title">Datos del Cliente</div>
        <div class="client-info">
            <p><strong>Nombre:</strong> {{clientName}}</p>
            <p><strong>Teléfono:</strong> {{clientPhone}}</p>
            <p><strong>Sucursal:</strong> {{branchName}}</p>
            <p><strong>Fecha:</strong> {{saleDate}}</p>
        </div>
    </div>
    
    {{measuresSection}}
    
    <div class="info-section">
        <div class="section-title">Detalles de Venta</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Valor Unitario</th>
                    <th>Descuento</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Armazón</strong></td>
                    <td>{{framePrice}}</td>
                    <td>{{frameDiscount}}%</td>
                    <td><strong>{{frameTotalPrice}}</strong></td>
                </tr>
                <tr>
                    <td><strong>Lunas</strong></td>
                    <td>{{lensPrice}}</td>
                    <td>{{lensDiscount}}%</td>
                    <td><strong>{{lensTotalPrice}}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <div class="totals">
            <p><strong>Total General:</strong> {{totalGeneral}}</p>
            <p><strong>Abono Realizado:</strong> {{balance}}</p>
            <p><strong>Saldo Pendiente:</strong> {{credit}}</p>
            <p><strong>Forma de Pago:</strong> {{paymentMethod}}</p>
            <p><strong>Tiempo de Entrega:</strong> {{deliveryTime}}</p>
        </div>
    </div>
    
    {{observationsSection}}
    
    <div class="signature-area">
        <p><strong>Firma del Cliente:</strong></p>
        <div style="margin-top: 15px;">
            {{clientSignature}}
        </div>
    </div>
    
    <div class="footer">
        <p>Documento generado el {{currentDate}}</p>
        <p>Gracias por confiar en {{branchName}}</p>
    </div>

    <!-- PÁGINA 2: TÉRMINOS Y CONDICIONES -->
    <div class="page-break">
        <div class="header">
            <div class="company-logo">{{branchName}}</div>
        </div>
        
        <div class="document-title">Términos y Condiciones</div>
        
        <div class="info-section">
            <div class="terms">
                <p><strong>COMPROBANTE DE GARANTÍA</strong></p>
                <p>Recuerde que las Lunas oftálmicas y Armazones son de uso delicado y el tiempo de duración depende exclusivamente del cuidado que usted les de.</p>
                <p><strong>{{branchName}}</strong> únicamente será responsable por garantias de armazones y lunas que presenten defectos de fábrica y estén dentro del período de tiempo establecido.</p>
                <p>Todas las armazones y lunas son inspeccionados antes de ser entregados al cliente para asegurarnos de que estén en perfectas condiciones tanto físicas como en las medidas (en el caso de las lunas), no obstante recomendamos al cliente inspeccione y verifique el estado de los lentes y la conformidad con la medida al momento de la entrega.</p>
                <p><strong>Queda a responsabilidad del paciente tener el cuidado correspondiente de sus armazones y/o lunas para que la garantía durante su período entre en vigencia</strong></p>
                
                <p><strong>LIMPIEZA Y AJUSTE GRATIS</strong></p>
                <p>Todas nuestras armazones cuentan con el beneficio de <strong>limpieza y ajuste gratis</strong> durante <strong>6 meses.</strong></p>
                <p>Nuestro personal se encargará gratuitamente del mantenimiento de sus lentes en cualquier sucursal del país. Sin costo alguno podrá reajustar, dar limpieza, reponer tornillos y cambiar plaquetas de sus lentes dentro de los 6 primeros meses luego de la compra del lente.</p>
                <p><strong>Debe presentar el comprobante para acceder a este beneficio.</strong></p>
                
                <p><strong>BENEFICIO POR ROTURA/DAÑO</strong></p>
                <p>En el caso de un daño en sus armazones o lunas por un incidente/mala manipulación, podrá adquirir unas iguales con el 10% de descuento. Para hacer uso de este beneficio deberá entregar la montura oftálmica y/o lunas rotas o dañadas. En el caso de requerir nuevas lunas, estas tendrán la misma medida de la compra inicial.</p>
                
                <p><strong>IMPORTANTE: NO SE REALIZARÁN DEVOLUCIONES DE DINERO</strong></p>
                
                <p><strong>CONDICIONES DE APLICACIÓN DE GARANTÍA</strong></p>
                <p>Los lentes entregados son revisados tanto por personal de {{branchName}} y el cliente al momento de la entrega. Se indicarán los cuidados y recomendaciones para el correcto mantenimiento de lunas y armazones mismos que evitan el deterioro de los productos adquiridos. Se cubrirá garantía sólo en los siguientes casos:</p>
                
                <p><strong>ARMAZONES</strong></p>
                <p>1. En los <strong>ARMAZONES DE DISEÑADOR</strong> y de marcas <strong>VIANCHI y BOSELLI</strong> el plazo de garantía es de 6 meses. El plazo de 6 meses empieza a contar a partir del día del retiro y pago del artículo. Dentro de este plazo, quedarán cubiertos todos los defectos de fábrica que pudiera afectar.</p>
                <p>2. Para la ejecución de la garantía es necesario que el cliente presente el armazón, que a su juicio, presenta falta de conformidad con las condiciones de venta. El armazón será aviado al Laboratorio principal para realizar las respectivas comprobaciones para definir si aplica o no la garantía.</p>
                <p>3. En caso de verificar que es una falla de fábrica se procede con el cambio/sustitución del producto. De no disponer del mismo <strong>modelo/marca/color</strong>, el cliente debe elegir un armazón del mismo valor o superior (deberá cancelar la diferencia) de una marca diferente en el cual se deban adaptar las lunas que tiene en uso.</p>
                <p>4. La garantía se debe exigir en la sucursal SOS en la que fue adquirido el producto.</p>
                
                <p><strong>LUNAS/LENTES OFTALMICAS</strong></p>
                <p>1. De presentar molestias con las lunas adquiridas ya sea por daños físicos o problemas en la adaptación, se debe presentar el reclamo en un período máximo de 45 días para la respectiva revision de las lunas y verificar los motivos de la molestia.</p>
                <p>De acuerdo al causal de la molestia se procede de la siguiente forma:</p>
                <p><strong>a.Error en la refracción o graduación no coincide con receta:</strong> se realizara la respectiva rectificación de medidas y se realizara el montaje de nuevas lunas con la medida correcta.</p>
                <p><strong>b. Error en biselado/montaje:</strong> se realiza la respectiva rectificación y se sustituyen las lunas.</p>
                <p><strong>c. Fallo de fábrica:</strong> se realiza la sustitución de lunas por unas nuevas.</p>
                <p>2. En caso de que la garantía se aplique en las lunas, estas serán reemplazadas por una del mismo tipo, material, valor, graduación o parámetros que el original salvo en los casos donde se determine por parte del optómetra que debe hacerse un cambio en el tipo de las lentes oftálmicas. <strong>No se realizará devoluciones de dinero.</strong></p>
                
                <p><strong>EXCLUSIONES DE GARANTÍA</strong></p>
                <p>La garantía está limitada a las condiciones descritas a continuación:</p>
                <p>1. Si el armazón o lunas presenta(n) daños producto de la mala manipulación del cliente: <strong>Golpes, caídas, señales de pegamento, ralladuras, etc.</strong></p>
                <p>2. No se aplica garantía en ningún tipo de lentes de contacto</p>
                <p>3. Si el cliente se acerca después de 45 días indicando molestias con la medida.</p>
                <p>El certificado de garantia sirve como prueba de compra y autenticidad de los productos comprados y como prueba del derecho a esta garantia.</p>
                <p><strong>{{branchName}}</strong> se reserva el derecho de modificar o adaptar estas condiciones de garantía con implicaciones para el futuro a su discreción en cualquier momento.</p>
                
                <p><strong>IMPORTANTE:</strong></p>
                <p><strong>A PARTIR DE LA FECHA DE COMPRA TENDRÁ LA OPCIÓN DE REALIZAR 2 VALORACIONES OPTOMÉTRICAS SIN COSTO DURANTE 1 AÑO PRESENTANDO ESTE COMPROBANTE.</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
`;