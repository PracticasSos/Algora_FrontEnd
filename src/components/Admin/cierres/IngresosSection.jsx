import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Divider, VStack, HStack, Text, useColorModeValue } from "@chakra-ui/react";


const IngresosSection = ({ branchId, formData, setTotals }) => {
    const [records, setRecords] = useState([]);
    const [totalsState, setTotalsState] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });

    const textColor = useColorModeValue('gray.800', 'white');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const tableHoverBg = useColorModeValue('gray.100', 'gray.600');

    useEffect(() => {
        const fetchDailyRecords = async () => {
            let query = supabase
                .from('sales')
                .select(`
                    id,
                    date,
                    branchs_id,
                    branchs:branchs_id (id, name),
                    inventario (brand),
                    lens (lens_type),
                    total,
                    credit,
                    balance,
                    payment_in,
                    patients (pt_firstname, pt_lastname),
                    is_refund
                `)
                .eq('branchs_id', branchId)
                .eq('is_refund', false);

            if (formData.since && formData.till) {
                query = query.gte('date', formData.since).lte('date', formData.till);
            }
            const { data } = await query;
            const formattedRecords = (data || []).map((record) => ({
                ...record,
                firstName: record.patients?.pt_firstname || 'Sin nombre',
                lastName: record.patients?.pt_lastname || 'Sin apellido',
                lens: record.lens?.lens_type || 'Sin tipo',
                branchName: record.branchs?.name || 'Sin sucursal',
            }));
            setRecords(formattedRecords);

            // Calcular totales
            const totals = { EFEC: 0, TRANS: 0, DATAF: 0 };
            formattedRecords.forEach((r) => {
                const amount = Number(r.balance) || 0;
                if (r.payment_in === 'efectivo') totals.EFEC += amount;
                if (r.payment_in === 'transferencia') totals.TRANS += amount;
                if (r.payment_in === 'datafast') totals.DATAF += amount;
            });
            totals.total = totals.EFEC + totals.TRANS + totals.DATAF;
            setTotalsState(totals);
            setTotals && setTotals(totals);
        };
        if (branchId) fetchDailyRecords();
    }, [branchId, formData, setTotals]);

    return (
        <Box>
            <Heading size="md" textAlign="center">Cierre Diario</Heading>
            <Box overflowX="auto" width="100%">
                <Table overflow="hidden">
                    <Thead>
                        <Tr bg={useColorModeValue('gray.50', 'gray.600')}>
                            <Th color={textColor} borderColor={borderColor}>Orden</Th>
                            <Th color={textColor} borderColor={borderColor}>Fecha</Th>
                            <Th color={textColor} borderColor={borderColor}>Sucursal</Th>
                            <Th color={textColor} borderColor={borderColor}>Nombre</Th>
                            <Th color={textColor} borderColor={borderColor}>Apellido</Th>
                            <Th color={textColor} borderColor={borderColor}>Armazón</Th>
                            <Th color={textColor} borderColor={borderColor}>Luna</Th>
                            <Th color={textColor} borderColor={borderColor} isNumeric>Total</Th>
                            <Th color={textColor} borderColor={borderColor}>Abono</Th>
                            <Th color={textColor} borderColor={borderColor}>Saldo</Th>
                            <Th color={textColor} borderColor={borderColor}>Pago</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {records.map((record) => (
                            <Tr key={record.id} cursor="pointer" _hover={{ bg: tableHoverBg }} borderColor={borderColor}>
                                <Td color={textColor} borderColor={borderColor}>{record.id}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.date}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.branchName}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.firstName}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.lastName}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.inventario?.brand ?? 'Sin marca'}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.lens}</Td>
                                <Td isNumeric>{record.total}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.balance}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.credit}</Td>
                                <Td color={textColor} borderColor={borderColor}>
                                    <Badge
                                        colorScheme={
                                            record.payment_in === 'efectivo'
                                                ? 'green'
                                                : record.payment_in === 'transferencia'
                                                ? 'blue'
                                                : 'orange'
                                        }
                                    >
                                        {record.payment_in}
                                    </Badge>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
                <Divider my={4} />
                <HStack justifyContent="space-around" spacing={6}>
                    <VStack>
                        <Text fontWeight="bold">EFEC</Text>
                        <Text fontSize="lg" color="green.500">{totalsState.EFEC || 0}</Text>
                    </VStack>
                    <VStack>
                        <Text fontWeight="bold">TRANS</Text>
                        <Text fontSize="lg" color="blue.500">{totalsState.TRANS || 0}</Text>
                    </VStack>
                    <VStack>
                        <Text fontWeight="bold">DATAF</Text>
                        <Text fontSize="lg" color="orange.500">{totalsState.DATAF || 0}</Text>
                    </VStack>
                </HStack>
                <Heading size="md" textAlign="center" color="green.300">
                    Total General: {totalsState.total}
                </Heading>
            </Box>
        </Box>
    );
};

export default IngresosSection;