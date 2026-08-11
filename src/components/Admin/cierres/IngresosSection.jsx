import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Divider, VStack, HStack, Text, useColorModeValue, Button, Icon, Spinner, Flex } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;
const ACCENT = "#00A88E";

const IngresosSection = ({ branchId, formData, setTotals }) => {
    const [records, setRecords] = useState([]);
    const [totalsState, setTotalsState] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingTable, setLoadingTable] = useState(false);

    const textColor = useColorModeValue('gray.800', 'white');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const tableHoverBg = useColorModeValue('gray.100', 'gray.600');
    const subtitleColor = useColorModeValue('gray.500', 'gray.400');

    // La página cambia solo la tabla; si cambian sucursal o fechas, hay que
    // volver a empezar desde la página 1 (si no, se podría quedar "colgado"
    // en una página que ya no existe para el nuevo filtro).
    useEffect(() => {
        setPage(1);
    }, [branchId, formData]);

    // --- Totales: necesitan ver TODAS las ventas del rango, no solo la
    // página actual. Se pide solo lo mínimo (payment_in, balance) para que
    // esta consulta sea liviana incluso con miles de filas. ---
    useEffect(() => {
        const fetchTotals = async () => {
            let query = supabase
                .from('sales')
                .select('payment_in, balance')
                .eq('branchs_id', branchId)
                .eq('is_refund', false);

            if (formData.since && formData.till) {
                query = query.gte('date', formData.since).lte('date', formData.till);
            }
            const { data } = await query;

            const totals = { EFEC: 0, TRANS: 0, DATAF: 0 };
            (data || []).forEach((r) => {
                const amount = Number(r.balance) || 0;
                if (r.payment_in === 'efectivo') totals.EFEC += amount;
                if (r.payment_in === 'transferencia') totals.TRANS += amount;
                if (r.payment_in === 'datafast') totals.DATAF += amount;
            });
            totals.total = totals.EFEC + totals.TRANS + totals.DATAF;
            setTotalsState(totals);
            setTotals && setTotals(totals);
        };
        if (branchId) fetchTotals();
    }, [branchId, formData, setTotals]);

    // --- Tabla de detalle: solo trae la página actual (PAGE_SIZE filas),
    // con { count: 'exact' } para saber cuántas páginas hay en total. ---
    useEffect(() => {
        const fetchPage = async () => {
            setLoadingTable(true);
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

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
                `, { count: 'exact' })
                .eq('branchs_id', branchId)
                .eq('is_refund', false)
                .order('date', { ascending: false })
                .range(from, to);

            if (formData.since && formData.till) {
                query = query.gte('date', formData.since).lte('date', formData.till);
            }
            const { data, count } = await query;
            const formattedRecords = (data || []).map((record) => ({
                ...record,
                firstName: record.patients?.pt_firstname || 'Sin nombre',
                lastName: record.patients?.pt_lastname || 'Sin apellido',
                lens: record.lens?.lens_type || 'Sin tipo',
                branchName: record.branchs?.name || 'Sin sucursal',
            }));
            setRecords(formattedRecords);
            setTotalCount(count || 0);
            setLoadingTable(false);
        };
        if (branchId) fetchPage();
    }, [branchId, formData, page]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
                        {loadingTable ? (
                            <Tr>
                                <Td colSpan={11} textAlign="center" py={8}>
                                    <Spinner size="sm" color={ACCENT} />
                                </Td>
                            </Tr>
                        ) : records.length === 0 ? (
                            <Tr>
                                <Td colSpan={11} textAlign="center" py={8} color={subtitleColor}>
                                    No hay ventas en este rango.
                                </Td>
                            </Tr>
                        ) : (
                            records.map((record) => (
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
                            ))
                        )}
                    </Tbody>
                </Table>

                {totalCount > 0 && (
                    <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={2}>
                        <Text fontSize="xs" color={subtitleColor}>
                            {totalCount} venta{totalCount !== 1 ? "s" : ""} en total — página {page} de {totalPages}
                        </Text>
                        <HStack spacing={2}>
                            <Button
                                size="sm"
                                variant="outline"
                                borderRadius="10px"
                                leftIcon={<Icon as={ChevronLeft} boxSize="14px" />}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                isDisabled={page <= 1 || loadingTable}
                            >
                                Anterior
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                borderRadius="10px"
                                rightIcon={<Icon as={ChevronRight} boxSize="14px" />}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                isDisabled={page >= totalPages || loadingTable}
                            >
                                Siguiente
                            </Button>
                        </HStack>
                    </Flex>
                )}

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