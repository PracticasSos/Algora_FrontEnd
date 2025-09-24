import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Divider,
    Heading,
    HStack,
    VStack,
    Text,
    useColorModeValue
} from "@chakra-ui/react";

const AbonosSection = ({ branchId, formData, setAbonosTotals }) => {
    const [withdrawalsRecords, setWithdrawalsRecords] = useState([]);
    const [totalAbonosDelDia, setTotalAbonosDelDia] = useState({ EFEC: 0, TRANS: 0, DATAF: 0 });

    const textColor = useColorModeValue('gray.800', 'white');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const tableHoverBg = useColorModeValue('gray.100', 'gray.600');

    useEffect(() => {
        const fetchDailyWithdrawals = async () => {
            if (!branchId) {
                setWithdrawalsRecords([]);
                setAbonosTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                setTotalAbonosDelDia({ EFEC: 0, TRANS: 0, DATAF: 0, abonosDelDia: 0 });
                return;
            }
            const today = new Date().toLocaleDateString("en-CA");
            try {
                const { data: salesToday, error: salesError } = await supabase
                    .from("sales")
                    .select(`
                        id,
                        branchs_id,
                        patients (pt_firstname, pt_lastname),
                        total,
                        payment_balance,
                        credit,
                        is_refund
                    `)
                    .eq("branchs_id", branchId)
                    .eq("is_refund", false);

                if (salesError) throw salesError;

                const saleIds = salesToday.map(sale => sale.id);
                const { data: withdrawalsToday, error: withdrawalsError } = await supabase
                    .from("withdrawals")
                    .select(`
                        id,
                        sale_id,
                        previous_balance, 
                        new_balance, 
                        difference, 
                        date
                    `)
                    .eq("date", today)
                    .in("sale_id", saleIds);

                if (withdrawalsError) throw withdrawalsError;

                let totalAbonosDelDia = { EFEC: 0, TRANS: 0, DATAF: 0 };
                const formattedWithdrawals = withdrawalsToday.map((withdrawal) => {
                    const relatedSale = salesToday.find(sale => sale.id === withdrawal.sale_id);
                    const abonoDelDia = withdrawal.difference ? Number(withdrawal.difference) : 0;
                    const paymentMethod = relatedSale?.payment_balance || "Sin método";
                    if (paymentMethod === "efectivo") {
                        totalAbonosDelDia.EFEC += abonoDelDia;
                    } else if (paymentMethod === "transferencia") {
                        totalAbonosDelDia.TRANS += abonoDelDia;
                    } else if (paymentMethod === "datafast") {
                        totalAbonosDelDia.DATAF += abonoDelDia;
                    }
                    return {
                        ...withdrawal,
                        firstName: relatedSale?.patients?.pt_firstname || "Sin nombre",
                        lastName: relatedSale?.patients?.pt_lastname || "Sin apellido",
                        total: relatedSale?.total || 0,
                        credit: relatedSale?.credit || 0,
                        saldoAnterior: Number(withdrawal.previous_balance || 0),
                        abonoDelDia: abonoDelDia,
                        saldo: Number(withdrawal.new_balance || 0),
                        payment_balance: paymentMethod,
                    };
                });

                setWithdrawalsRecords(formattedWithdrawals);
                setAbonosTotals({
                    EFEC: totalAbonosDelDia.EFEC,
                    TRANS: totalAbonosDelDia.TRANS,
                    DATAF: totalAbonosDelDia.DATAF,
                    total: totalAbonosDelDia.EFEC + totalAbonosDelDia.TRANS + totalAbonosDelDia.DATAF,
                });
                setTotalAbonosDelDia({
                    EFEC: totalAbonosDelDia.EFEC,
                    TRANS: totalAbonosDelDia.TRANS,
                    DATAF: totalAbonosDelDia.DATAF,
                    abonosDelDia: totalAbonosDelDia.EFEC + totalAbonosDelDia.TRANS + totalAbonosDelDia.DATAF,
                });
            } catch (err) {
                setWithdrawalsRecords([]);
                setAbonosTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                setTotalAbonosDelDia({ EFEC: 0, TRANS: 0, DATAF: 0, abonosDelDia: 0 });
            }
        };
        fetchDailyWithdrawals();
    }, [branchId, formData, setAbonosTotals]);

    return (
        <Box>
            <Divider my={6} />
            <Box overflowX="auto" width="100%">
                <Table overflow="hidden" colorScheme="teal">
                    <Thead>
                        <Tr bg={useColorModeValue('gray.50', 'gray.600')}>
                            <Th color={textColor} borderColor={borderColor}>Fecha</Th>
                            <Th color={textColor} borderColor={borderColor}>Nombre</Th>
                            <Th color={textColor} borderColor={borderColor}>Apellido</Th>
                            <Th color={textColor} borderColor={borderColor}>Total</Th>
                            <Th color={textColor} borderColor={borderColor}>Abono Anterior</Th>
                            <Th color={textColor} borderColor={borderColor}>Abono del Día</Th>
                            <Th color={textColor} borderColor={borderColor}>Abono Total</Th>
                            <Th color={textColor} borderColor={borderColor}>Saldo</Th>
                            <Th color={textColor} borderColor={borderColor}>Pago en</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {withdrawalsRecords.map((record) => (
                            <Tr key={record.id} cursor="pointer" _hover={{ bg: tableHoverBg }} borderColor={borderColor}>
                                <Td color={textColor} borderColor={borderColor}>{record.date}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.firstName}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.lastName}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.total}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.saldoAnterior}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.abonoDelDia}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.saldo}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.credit}</Td>
                                <Td color={textColor} borderColor={borderColor}>
                                    <Badge
                                        colorScheme={
                                            record.payment_balance === 'efectivo'
                                                ? 'green'
                                                : record.payment_balance === 'transferencia'
                                                ? 'blue'
                                                : 'orange'
                                        }
                                    >
                                        {record.payment_balance}
                                    </Badge>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
            <Divider my={10} />
            <HStack justifyContent="space-around" spacing={6}>
                <VStack>
                    <Text fontWeight="bold">EFEC</Text>
                    <Text fontSize="lg" color="green.500">
                        {totalAbonosDelDia.EFEC || 0}
                    </Text>
                </VStack>
                <VStack>
                    <Text fontWeight="bold">TRANS</Text>
                    <Text fontSize="lg" color="blue.500">
                        {totalAbonosDelDia.TRANS || 0}
                    </Text>
                </VStack>
                <VStack>
                    <Text fontWeight="bold">DATAF</Text>
                    <Text fontSize="lg" color="orange.500">
                        {totalAbonosDelDia.DATAF || 0}
                    </Text>
                </VStack>
            </HStack>
            <Heading size="md" textAlign="center" color="green.300">
                Total Abonos del Día: {totalAbonosDelDia.total || 0}
            </Heading>
            <Divider my={10} />
        </Box>
    );
};
export default AbonosSection;