import { Box, Button, FormControl, FormLabel, Input, Select, Table, Tr, Td, Th, Thead, Tbody, Badge, Heading, Grid, Divider, VStack, HStack,Text, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../api/supabase.js";
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../header/SmartHeader.jsx";

const CashClosure = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [egresos, setEgresos] = useState([]);
    const [branches, setBranches] = useState([]);
    const [egresosTotals, setEgresosTotals] = useState({ EFEC: 0, DATAF: 0, TRANS: 0 });
    const [grandTotal, setGrandTotal] = useState(0);
    const [totals, setTotals] = useState({ EFEC: 0, DATAF: 0, TRANS: 0, total: 0 });
    const [egresosGrandTotal, setEgresosGrandTotal] = useState(0);
    const [finalBalance, setFinalBalance] = useState({ EFEC: 0, DATAF: 0, TRANS: 0, total: 0 });
    const [finalBalanceTotal, setFinalBalanceTotal] = useState(0);
    const [withdrawalsRecords, setWithdrawalsRecords] = useState([]);
    const [totalAbonosDelDia, setTotalAbonosDelDia] = useState({ EFEC: 0, TRANS: 0, DATAF: 0 });
    const [formData, setFormData] = useState({
        since: "",
        till: "",
        month: "",
        cash: 0,
        transfer: 0,
        data_fast: 0,
        total: 0
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchDailyRecords(selectedBranch);
            fetchDailyWithdrawals(selectedBranch);
            fetchExpenses(selectedBranch);
        }
    }, [formData.since, formData.till, formData.month]);

    useEffect(() => {
        calculateFinalBalance();
    }, [totals, egresosGrandTotal, withdrawalsRecords]);

    const calculateFinalBalance = () => {
        const totalWithdrawals = withdrawalsRecords.reduce(
            (sum, record) => sum + Number(record.abonoDelDia || 0), 
            0
        );
        const balance = {
            EFEC: (totals.EFEC || 0) - (egresosTotals.EFEC || 0) + (totalAbonosDelDia.EFEC || 0),
            DATAF: (totals.DATAF || 0) - (egresosTotals.DATAF || 0) + (totalAbonosDelDia.DATAF || 0),
            TRANS: (totals.TRANS || 0) - (egresosTotals.TRANS || 0) + (totalAbonosDelDia.TRANS || 0),
            total: (totals.EFEC || 0) + (totals.DATAF || 0) + (totals.TRANS || 0) 
                   - ((egresosTotals.EFEC || 0) + (egresosTotals.DATAF || 0) + (egresosTotals.TRANS || 0))
                   + (totalAbonosDelDia.EFEC || 0) + (totalAbonosDelDia.TRANS || 0) + (totalAbonosDelDia.DATAF || 0)
        };
        setFinalBalance(balance);
        setFinalBalanceTotal(balance.total);
    };
    

    const fetchBranches = async () => {
        try {
            const { data, error } = await supabase.from("branchs").select("id, name");
            if (error) throw error;
            setBranches(data || []);
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };
// current_sales solo son vistas para ingresos y egresos desde hoy 07/05/2025
    const fetchDailyRecords = async (branchId) => {
        const { since, till, month } = formData;
        let query = supabase.from("sales").select(`
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
        .eq("branchs_id", branchId)
        .eq("is_refund", false);

        if (since && till) {
            query = query.gte("date", since).lte("date", till);
        } else if (month) {
            const dates = getMonthRange(month);
            if (dates) {
                query = query.gte("date", dates.startDate).lte("date", dates.endDate);
            }
        }

        try {
            const { data, error } = await query;
            if (error) throw error;

            if (data?.length > 0) {
                const formattedRecords = data.map((record) => ({
                    ...record,
                    firstName: record.patients?.pt_firstname || "Sin nombre",
                    lastName: record.patients?.pt_lastname || "Sin apellido",
                    lens: record.lens?.lens_type || "Sin tipo",
                    branchName: record.branchs?.name || "Sin sucursal",
                }));

                setRecords(formattedRecords);
                const calculatedTotals = calculateTotals(formattedRecords);
                setTotals(calculatedTotals);
                setFormData((prev) => ({
                    ...prev,
                    cash: calculatedTotals.EFEC,
                    transfer: calculatedTotals.TRANS,
                    data_fast: calculatedTotals.DATAF,
                    total: calculatedTotals.total
                }));
            } else {
                resetData();
            }
        } catch (err) {
            console.error("Error fetching daily records:", err);
            resetData();
        }
    };

    const resetData = () => {
        setRecords([]);
        setEgresos([]);
        setTotals({ EFEC: 0, DATAF: 0, TRANS: 0, total: 0 });
        setEgresosTotals({ EFEC: 0, DATAF: 0, TRANS: 0 });
        setGrandTotal(0);
        setEgresosGrandTotal(0);
    };

    const calculateTotals = (data) => {
        const newTotals = {
            EFEC: 0,
            TRANS: 0,
            DATAF: 0
        };
    
        data.forEach((record) => {
            const abono = Number(record.balance) || 0;
    
            if (record.payment_in === "efectivo") newTotals.EFEC += abono;
            if (record.payment_in === "transferencia") newTotals.TRANS += abono;
            if (record.payment_in === "datafast") newTotals.DATAF += abono;
        });
    
        const total = newTotals.EFEC + newTotals.TRANS + newTotals.DATAF;
        return { ...newTotals, total };
    };
    

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "month" ? { since: "", till: "" } : {}),
            ...(name === "since" || name === "till" ? { month: "" } : {})
        }));
    };

    const fetchDailyWithdrawals = async (branchId) => {
        const { since, till, month } = formData;
        let salesQuery = supabase
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
    
        try {
            const { data: salesToday, error: salesError } = await salesQuery;
            if (salesError) throw salesError;
    
            const saleIds = salesToday.map(sale => sale.id);
            if (saleIds.length === 0) {
                setWithdrawalsRecords([]);
                setTotalAbonosDelDia((prevTotals) => ({
                    ...prevTotals,
                    EFEC: 0,
                    TRANS: 0,
                    DATAF: 0,
                    abonosDelDia: 0,
                }));
                return;
            }
    
            let formattedSince, formattedTill;
            if (since && till) {
                formattedSince = new Date(since).toISOString().split('T')[0];
                formattedTill = new Date(till).toISOString().split('T')[0];
            } else if (month) {
                const dates = getMonthRange(month);
                if (dates) {
                    formattedSince = dates.startDate;
                    formattedTill = dates.endDate;
                }
            }
    
            let withdrawalsQuery = supabase
                .from("withdrawals")
                .select(`
                    id,
                    sale_id,
                    previous_balance,
                    new_balance,
                    difference,
                    date,
                    sales (
                        branchs_id,
                        payment_balance,
                        total,
                        credit,
                        patients (
                            pt_firstname,
                            pt_lastname
                        )
                    )
                `)
                .in("sale_id", saleIds)
                .eq("sales.branchs_id", branchId);
            if (formattedSince && formattedTill) {
                withdrawalsQuery = withdrawalsQuery
                    .gte("date", formattedSince)
                    .lte("date", formattedTill);
            }
    
            const { data: withdrawalsToday, error: withdrawalsError } = await withdrawalsQuery;
            if (withdrawalsError) throw withdrawalsError;
    
            let totalAbonosDelDia = { EFEC: 0, TRANS: 0, DATAF: 0 };
            const formattedWithdrawals = withdrawalsToday.map((withdrawal) => {
                const relatedSale = withdrawal.sales;
                const abonoDelDia = withdrawal.difference ? Number(withdrawal.difference) : 0;
                const paymentMethod = relatedSale?.payment_balance || "Sin método";
    
                const patientFirstName = relatedSale?.patients?.pt_firstname || "Sin nombre";
                const patientLastName = relatedSale?.patients?.pt_lastname || "Sin apellido";
    
                if (paymentMethod === "efectivo") {
                    totalAbonosDelDia.EFEC += abonoDelDia;
                } else if (paymentMethod === "transferencia") {
                    totalAbonosDelDia.TRANS += abonoDelDia;
                } else if (paymentMethod === "datafast") {
                    totalAbonosDelDia.DATAF += abonoDelDia;
                }
    
                return {
                    ...withdrawal,
                    firstName: patientFirstName,
                    lastName: patientLastName,
                    total: relatedSale?.total || 0,
                    credit: relatedSale?.credit || 0,
                    saldoAnterior: Number(withdrawal.previous_balance || 0),
                    abonoDelDia: abonoDelDia,
                    saldo: Number(withdrawal.new_balance || 0),
                    payment_balance: paymentMethod,
                };
            });
    
            setWithdrawalsRecords(formattedWithdrawals);
            setTotalAbonosDelDia((prevTotals) => ({
                ...prevTotals,
                EFEC: totalAbonosDelDia.EFEC,
                TRANS: totalAbonosDelDia.TRANS,
                DATAF: totalAbonosDelDia.DATAF,
                abonosDelDia: totalAbonosDelDia.EFEC + totalAbonosDelDia.TRANS + totalAbonosDelDia.DATAF,
            }));
    
        } catch (err) {
            console.error("❌ Error en fetchDailyWithdrawals:", err);
            setWithdrawalsRecords([]);
            setTotalAbonosDelDia((prevTotals) => ({
                ...prevTotals,
                EFEC: 0,
                TRANS: 0,
                DATAF: 0,
                abonosDelDia: 0,
            }));
        }
    };

    const fetchExpenses = async (branchId) => {
        const { since, till, month } = formData;
        let query = supabase.from("egresos").select(`
            id,
            date,
            value,
            specification,
            users (firstname),
            labs (name),
            branchs (name),
            payment_in
        `).eq("branchs_id", branchId);

        if (since && till) {
            query = query.gte("date", since).lte("date", till);
        } else if (month) {
            const dates = getMonthRange(month);
            if (dates) {
                query = query.gte("date", dates.startDate).lte("date", dates.endDate);
            }
        }

        try {
            const { data, error } = await query;
            if (error) throw error;

            if (data?.length > 0) {
                setEgresos(data);
                calculateEgresosTotals(data);
            } else {
                setEgresos([]);
                setEgresosTotals({ EFEC: 0, DATAF: 0, TRANS: 0 });
                setEgresosGrandTotal(0);
            }
        } catch (err) {
            console.error("Error fetching expenses:", err);
            setEgresos([]);
            setEgresosTotals({ EFEC: 0, DATAF: 0, TRANS: 0 });
            setEgresosGrandTotal(0);
        }
    };

    const calculateEgresosTotals = (data) => {
        const newTotals = {
            EFEC: 0,
            TRANS: 0,
            DATAF: 0
        };

        data.forEach((egreso) => {
            const amount = Number(egreso.value) || 0;
            if (egreso.payment_in === "efectivo") newTotals.EFEC += amount;
            if (egreso.payment_in === "transferencia") newTotals.TRANS += amount;
            if (egreso.payment_in === "datafast") newTotals.DATAF += amount;
        });

        const total = newTotals.EFEC + newTotals.TRANS + newTotals.DATAF;

        setEgresosTotals(newTotals);
        setEgresosGrandTotal(total);
    };

    const handleBranchChange = async (event) => {
        const branchId = event.target.value;
        setSelectedBranch(branchId);

        if (branchId) {
            await fetchDailyRecords(branchId);
            await fetchExpenses(branchId);
        } else {
            resetData();
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        saveClosingData();
    };

    const getMonthRange = (month) => {
        const monthMapping = {
            Enero: "01",
            Febrero: "02",
            Marzo: "03",
            Abril: "04",
            Mayo: "05",
            Junio: "06",
            Julio: "07",
            Agosto: "08",
            Septiembre: "09",
            Octubre: "10",
            Noviembre: "11",
            Diciembre: "12"
        };

        const currentYear = new Date().getFullYear();
        const monthNumber = monthMapping[month];
        if (monthNumber) {
            const startDate = `${currentYear}-${monthNumber}-01`;
            const lastDay = new Date(currentYear, parseInt(monthNumber), 0).getDate();
            const endDate = `${currentYear}-${monthNumber}-${lastDay}`;
            return { startDate, endDate };
        }
        return null;
    };

    const moduleSpecificButton = null;

    const handleNavigate = (route = null) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (route) {
            navigate(route);
            return;
        }
        if (!user || !user.role_id) {
            navigate('/login-form');
            return;
        }
        switch (user.role_id) {
            case 1:
                navigate('/Admin');
                break;
            case 2:
                navigate('/Optometra');
                break;
            case 3:
                navigate('/Vendedor');
                break;
            case 4:
                navigate('/SuperAdmin');
                break;
            default:
                navigate('/');
        }
    };

    const bgColor = useColorModeValue('white', 'gray.800');
      const textColor = useColorModeValue('gray.800', 'white');
      const borderColor = useColorModeValue('gray.200', 'gray.600');
      const tableBg = useColorModeValue('white', 'gray.700');
      const tableHoverBg = useColorModeValue('gray.100', 'gray.600');
      const inputBg = useColorModeValue('white', 'gray.700');
      const selectBg = useColorModeValue('white', 'gray.700');

    return (
        <Box p={6} maxW="1300px" mx="auto" boxShadow="md" borderRadius="lg" bg={bgColor} color={textColor}>
             <Box position="sticky" top={0} bg={bgColor} zIndex={10} pb={4}>

            <SmartHeader moduleSpecificButton={moduleSpecificButton} />
            <Box w="100%" maxW= "800px" mb={4}>
                        <Heading 
                            mb={4} 
                            textAlign="left" 
                            size="md"
                            fontWeight="700"
                            color={useColorModeValue('teal.600', 'teal.300')}
                            pb={2}
                        >
                            Consultar Cierre
                        </Heading>
                        </Box>

            <Box as="form" onSubmit={handleSubmit}>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} mb={6}>
                    <FormControl isRequired>
                        <FormLabel>Óptica</FormLabel>
                        <Select 
                            placeholder="Seleccione una sucursal" 
                            value={selectedBranch} 
                            onChange={handleBranchChange}
                            bg={selectBg}
                            borderColor={borderColor}
                            color={textColor}
                            _hover={{
                                borderColor: useColorModeValue('gray.300', 'gray.500')
                            }}
                            _focus={{
                                borderColor: useColorModeValue('blue.500', 'blue.300'),
                                boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                            }}
                        >
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>Mes</FormLabel>
                        <Select 
                            name="month" 
                            value={formData.month} 
                            onChange={handleChange}
                            isDisabled={formData.since || formData.till}
                            bg={selectBg}
                            borderColor={borderColor}
                            color={textColor}
                            _hover={{
                                borderColor: useColorModeValue('gray.300', 'gray.500')
                            }}
                            _focus={{
                                borderColor: useColorModeValue('blue.500', 'blue.300'),
                                boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                            }}
                        >
                            <option value="">Seleccione un mes</option>
                            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                              "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                            ].map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>Desde</FormLabel>
                        <Input 
                            type="date" 
                            name="since" 
                            value={formData.since} 
                            onChange={handleChange}
                            isDisabled={formData.month !== ""}
                            bg={selectBg}
                            borderColor={borderColor}
                            color={textColor}
                            _hover={{
                                borderColor: useColorModeValue('gray.300', 'gray.500')
                            }}
                            _focus={{
                                borderColor: useColorModeValue('blue.500', 'blue.300'),
                                boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                            }}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Hasta</FormLabel>
                        <Input 
                            type="date" 
                            name="till" 
                            value={formData.till} 
                            onChange={handleChange}
                            isDisabled={formData.month !== ""}
                            bg={selectBg}
                            borderColor={borderColor}
                            color={textColor}
                            _hover={{
                                borderColor: useColorModeValue('gray.300', 'gray.500')
                            }}
                            _focus={{
                                borderColor: useColorModeValue('blue.500', 'blue.300'),
                                boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                            }}
                        />
                    </FormControl>
                </Grid>
                </Box>
                <Box  >
                <Divider my={10} />
                <Heading size="md" textAlign="center">
                    Cierre Diario
                </Heading>
                <Table colorScheme="teal"  overflow="hidden" overflowX="auto">
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
                            <Th color={textColor} borderColor={borderColor} >Abono</Th>
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
                                <Td color={textColor} borderColor={borderColor}>{record.inventario?.brand ?? "Sin marca"}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.lens}</Td>
                                <Td isNumeric>{record.total}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.balance}</Td>
                                <Td color={textColor} borderColor={borderColor}>{record.credit}</Td>
                                <Td color={textColor} borderColor={borderColor}>
                                    <Badge
                                        colorScheme={
                                            record.payment_in === "efectivo"
                                                ? "green"
                                                : record.payment_in === "transferencia"
                                                    ? "blue"
                                                    : "orange"
                                        }
                                    >
                                        {record.payment_in}
                                    </Badge>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
                <Divider my={6} />
                    <HStack justifyContent="space-around" spacing={6}>
                        <VStack>
                            <Text fontWeight="bold">EFEC</Text>
                            <Text fontSize="lg" color="green.500">
                                {totals.EFEC || 0}
                            </Text>
                        </VStack>
                        <VStack>
                            <Text fontWeight="bold">TRANS</Text>
                            <Text fontSize="lg" color="blue.500">
                                {totals.TRANS || 0}
                            </Text>
                        </VStack>
                        <VStack>
                            <Text fontWeight="bold">DATAF</Text>
                            <Text fontSize="lg" color="orange.500">
                                {totals.DATAF || 0}
                            </Text>
                        </VStack>
                    </HStack>
                    <Heading size="md" textAlign="center" color="green.300">
                        Total General: {totals.total}
                    </Heading>
                <Box>
                <Divider my={6} />
                <Heading size="md" textAlign="center" >Ajustes en Abonos</Heading>
                <Table  overflow="hidden" colorScheme="teal" overflowX="auto">
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
                            <Tr key={record.id} cursor="pointer"  _hover={{ bg: tableHoverBg }} borderColor={borderColor}>
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
                                                record.payment_balance ==="efectivo"
                                                ? "green"
                                                : record.payment_balance == "transferencia"
                                                ? "blue"
                                                : "orange"
                                            }
                                        >
                                            {record.payment_balance}
                                        </Badge>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
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
                    Total Abonos del Día: {totalAbonosDelDia.abonosDelDia || 0}
                </Heading>
                <Divider my={10} />
                </Box>
                <Heading size="md" textAlign="center" >
                    Egresos
                </Heading>
                <Table  overflow="hidden" colorScheme="teal" mb={6} overflowX="auto">
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
                        {egresos.map((egresos) => (
                            <Tr key={egresos.id} cursor="pointer"  _hover={{ bg: tableHoverBg }} borderColor={borderColor}>
                                <Td color={textColor} borderColor={borderColor}>{egresos.id}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egresos.date}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egresos.users?.firstname || "Sin encargado"}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egresos.labs?.name || "Sin laboratorio"}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egresos.value}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egresos.specification}</Td>
                                <Td color={textColor} borderColor={borderColor}>{egresos.branchs?.name || "Sin Sucursal"}</Td>
                                <Td color={textColor} borderColor={borderColor}>
                                    <Badge
                                        colorScheme={
                                            egresos.payment_in === "efectivo"
                                            ? "green"
                                            : egresos.payment_in === "transferencia"
                                            ? "blue"
                                            : "orange"
                                            }
                                        >
                                            {egresos.payment_in}
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
                                Total General: {egresosGrandTotal}
                            </Heading>
                            <Divider my={6} />
                            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mt={6}>
                            <FormControl display="flex" justifyContent="center">
                                <FormLabel>EFEC</FormLabel>
                                <Input
                                    type="number"
                                    name="cash"
                                    value={finalBalance.EFEC}
                                    onChange={handleChange}
                                    width="auto"
                                    maxWidth="150px"
                                    readOnly
                                    bg={inputBg}
                                borderColor={borderColor}
                                color={textColor}
                                _hover={{
                                  borderColor: useColorModeValue('gray.300', 'gray.500')
                                }}
                                _focus={{
                                    borderColor: useColorModeValue('blue.500', 'blue.300'),
                                    boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                                }}
                                />
                            </FormControl>

                            <FormControl display="flex" justifyContent="center">
                                <FormLabel>TRANS</FormLabel>
                                <Input
                                    type="number"
                                    name="transfer"
                                    value={finalBalance.TRANS}
                                    onChange={handleChange}
                                    width="auto"
                                    maxWidth="150px"
                                    readOnly
                                    bg={inputBg}
                                borderColor={borderColor}
                                color={textColor}
                                _hover={{
                                  borderColor: useColorModeValue('gray.300', 'gray.500')
                                }}
                                _focus={{
                                    borderColor: useColorModeValue('blue.500', 'blue.300'),
                                    boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                                }}
                                />
                            </FormControl>

                            <FormControl display="flex" justifyContent="center">
                                <FormLabel>DATAFAST</FormLabel>
                                <Input
                                    type="number"
                                    name="data_fast"
                                    value={finalBalance.DATAF}
                                    onChange={handleChange}
                                    width="auto"
                                    maxWidth="150px"
                                    readOnly
                                    bg={inputBg}
                                borderColor={borderColor}
                                color={textColor}
                                _hover={{
                                  borderColor: useColorModeValue('gray.300', 'gray.500')
                                }}
                                _focus={{
                                    borderColor: useColorModeValue('blue.500', 'blue.300'),
                                    boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                                }}
                                />
                            </FormControl>
                        </Grid>

                        <FormControl mt={6} display="flex" justifyContent="center">
                            <FormLabel>Total</FormLabel>
                            <Input
                                type="number"
                                name="total"
                                value={finalBalance.total}
                                onChange={handleChange}
                                width="auto"
                                maxWidth="150px"
                                readOnly
                                bg={inputBg}
                                borderColor={borderColor}
                                color={textColor}
                                _hover={{
                                  borderColor: useColorModeValue('gray.300', 'gray.500')
                                }}
                                _focus={{
                                    borderColor: useColorModeValue('blue.500', 'blue.300'),
                                    boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                                }}
                            />
                        </FormControl>
                <Box display="flex" justifyContent="center" mt={6}>
                    <Button 
                        type="submit" 
                        colorScheme="blue" 
                        width="auto" 
                        maxWidth="200px"
                        isDisabled={!selectedBranch || records.length === 0}
                    >
                        Enviar
                    </Button>
                </Box>

            </Box>
        </Box>
    );
};

export default CashClosure;