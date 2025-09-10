import { Button } from "@chakra-ui/react";
import { supabase } from "../../../api/supabase";


const RefundButton = ({ sale, onRefund }) => {
  const handleRefund = async () => {
    try {
      const { error: updateError } = await supabase
        .from("sales")
        .update({ is_refund: true })
        .eq("id", sale.id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from("refunds")
        .insert([
          {
            sale_id: sale.id,
            refund_amount: sale.balance, 
            refund_date: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      alert("✅ Reembolso procesado correctamente");
      if (onRefund) onRefund(sale.id);

    } catch (err) {
      console.error("Error procesando reembolso:", err.message);
      alert("❌ No se pudo procesar el reembolso");
    }
  };

  return (
    <Button
      colorScheme="red"
      size="sm"
      onClick={handleRefund}
      isDisabled={sale.is_refund}
    >
      {sale.is_refund ? "Reembolsado" : "Reembolsar"}
    </Button>
  );
};

export default RefundButton;
