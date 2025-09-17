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

const EgresosSection = ({ branchId, formData, setEgresosTotals }) => {
    const [egresos, setEgresos] = useState([]);
    const [egresosTotals, setLocalEgresosTotals] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });

    const textColor = useColorModeValue('gray.800', 'white');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const tableHoverBg = useColorModeValue('gray.100', 'gray.600');

            useEffect(() => {
                const fetchExpenses = async () => {
                    if (!branchId || isNaN(Number(branchId))) {
                        setEgresos([]);
                        setLocalEgresosTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                        setEgresosTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                        return;
                    }
                    const { since, till, month } = formData;
                    let query = supabase
                        .from("egresos")
                        .select(`id, date, value, specification, users(firstname), labs(name), branchs(name), payment_in`)
                        .eq("branchs_id", Number(branchId));

                    if (since && till) {
                        query = query.gte("date", since).lte("date", till);
                    } else if (month) {
                        // getMonthRange must be available in scope or imported
                        if (typeof getMonthRange === 'function') {
                            const dates = getMonthRange(month);
                            if (dates) {
                                query = query.gte("date", dates.since).lte("date", dates.till);
                            }
                        }
                    }

                    try {
                        const { data, error } = await query;
                        if (error) throw error;

                        if (data?.length > 0) {
                            setEgresos(data);
                            // Totals by payment type
                            const totals = { EFEC: 0, TRANS: 0, DATAF: 0 };
                            data.forEach((e) => {
                                const amount = Number(e.value) || 0;
                                if (e.payment_in === "efectivo") totals.EFEC += amount;
                                if (e.payment_in === "transferencia") totals.TRANS += amount;
                                if (e.payment_in === "datafast") totals.DATAF += amount;
                            });
                            totals.total = totals.EFEC + totals.TRANS + totals.DATAF;
                            setLocalEgresosTotals(totals);
                            setEgresosTotals(totals);
                        } else {
                            setEgresos([]);
                            setLocalEgresosTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                            setEgresosTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                        }
                    } catch (err) {
                        console.error("Error fetching expenses:", err);
                        setEgresos([]);
                        setLocalEgresosTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                        setEgresosTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                    }
                };
                fetchExpenses();
            }, [branchId, formData, setEgresosTotals]);

    return (
        <Box>
            <Box overflowX="auto" width="100%">
                <Table overflow="hidden" colorScheme="teal" mb={6}>
                    <Thead>
                        <Tr bg={useColorModeValue('gray.50', 'gray.600')}>
                            <Th color={textColor} borderColor={borderColor}>Orden</Th>
                            <Th color={textColor} borderColor={borderColor}>Fecha</Th>
                            <Th color={textColor} borderColor={borderColor}>Encargado</Th>
                            <Th color={textColor} borderColor={borderColor}>Laboratorio</Th>
                            <Th color={textColor} borderColor={borderColor}>Valor</Th>
                            <Th color={textColor} borderColor={borderColor}>Especificación</Th>
                            <Th color={textColor} borderColor={borderColor}>Sucursal</Th>
                            <Th color={textColor} borderColor={borderColor}>Pago</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {egresos.map((egreso) => (
                            <Tr key={egreso.id} cursor="pointer" _hover={{ bg: tableHoverBg }} borderColor={borderColor}>
                                <Td color={textColor} borderColor={borderColor}>{egreso.id}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egreso.date}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egreso.users?.firstname || 'Sin encargado'}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egreso.labs?.name || 'Sin laboratorio'}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egreso.value}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egreso.specification}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egreso.branchs?.name || 'Sin Sucursal'}</Td>
                                <Td color={textColor} borderColor={borderColor}>
                                    <Badge
                                        colorScheme={
                                            egreso.payment_in === 'efectivo'
                                                ? 'green'
                                                : egreso.payment_in === 'transferencia'
                                                ? 'blue'
                                                : 'orange'
                                        }
                                    >
                                        {egreso.payment_in}
                                    </Badge>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
            <Divider my={6} />
            <HStack justifyContent="space-around" spacing={6}>
                <VStack>
                    <Text fontWeight="bold">EFEC</Text>
                    <Text fontSize="lg" color="green.500">
                        {egresosTotals.EFEC || 0}
                    </Text>
                </VStack>
                <VStack>
                    <Text fontWeight="bold">TRANS</Text>
                    <Text fontSize="lg" color="blue.500">
                        {egresosTotals.TRANS || 0}
                    </Text>
                </VStack>
                <VStack>
                    <Text fontWeight="bold">DATAF</Text>
                    <Text fontSize="lg" color="orange.500">
                        {egresosTotals.DATAF || 0}
                    </Text>
                </VStack>
            </HStack>
            <Heading size="md" textAlign="center" color="green.300">
                Total General: {egresosTotals.total || 0}
            </Heading>
        </Box>
    );
}

export default EgresosSection;