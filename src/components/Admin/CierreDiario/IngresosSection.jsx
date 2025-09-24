import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Divider, VStack, HStack, Text, useColorModeValue } from "@chakra-ui/react";


const IngresosSection = ({ branchId, formData, setTotals }) => {
    const [records, setRecords] = useState([]);
    const [totalsState, setTotalsState] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });

    // Nueva función para calcular totales igual que en Cash.jsx
    const calculateTotals = (data) => {
        const newTotals = {
            EFEC: 0,
            TRANS: 0,
            DATAF: 0,
        };
        data.forEach((record) => {
            const abono = Number(record.payment_in_day);
            if (record.payment_in === "efectivo") newTotals.EFEC += abono;
            if (record.payment_in === "transferencia") newTotals.TRANS += abono;
            if (record.payment_in === "datafast") newTotals.DATAF += abono;
        });
        const total = newTotals.EFEC + newTotals.TRANS + newTotals.DATAF;
        return { ...newTotals, total };
    };
    const textColor = useColorModeValue('gray.800', 'white');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const tableHoverBg = useColorModeValue('gray.100', 'gray.600');

    useEffect(() => {
        const fetchDailyRecords = async () => {
            const today = new Date().toLocaleDateString("en-CA");
            try {
                const { data, error } = await supabase
                    .from("sales")
                    .select(`
                        id, 
                        date,
                        branchs_id,
                        branchs:branchs_id (id, name),
                        inventario (brand), 
                        lens (lens_type), 
                        total,     
                        credit, 
                        payment_in_day, 
                        payment_in,
                        patients (pt_firstname, pt_lastname),
                        is_refund
                    `)
                    .eq("date", today)
                    .eq("branchs_id", branchId)
                    .eq("is_refund", false);

                if (error) throw error;

                if (data && data.length > 0) {
                    const formattedRecords = data.map((record) => ({
                        ...record,
                        firstName: record.patients?.pt_firstname || "Sin nombre",
                        lastName: record.patients?.pt_lastname || "Sin apellido",
                        lens: record.lens?.lens_type || "Sin tipo",
                        branchName: record.branchs?.name || "Sin sucursal",
                    }));
                    setRecords(formattedRecords);
                    const calculatedTotals = calculateTotals(formattedRecords);
                    setTotalsState(calculatedTotals);
                    setTotals && setTotals(calculatedTotals);
                } else {
                    setRecords([]);
                    setTotalsState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                    setTotals && setTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                }
            } catch (err) {
                setRecords([]);
                setTotalsState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
                setTotals && setTotals({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
            }
        };
        if (branchId) fetchDailyRecords();
    }, [branchId, formData, setTotals]);

    return (
        <Box>
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
                                <Td color={textColor} borderColor={borderColor}>{record.payment_in_day}</Td>
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