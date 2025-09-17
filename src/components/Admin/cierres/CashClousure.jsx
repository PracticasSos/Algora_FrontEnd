// CashClosure.jsx
import { useState, useEffect } from "react";
import IngresosSection from "./IngresosSection";
import EgresosSection from "./EgresosSection";
import AbonosSection from "./AbonosSection";
import { supabase } from "../../../api/supabase";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Select,
  Input,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  useColorModeValue,
} from "@chakra-ui/react";
import SmartHeader from "../../header/SmartHeader";

const CashClousure = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [formData, setFormData] = useState({
    since: "",
    till: "",
    month: "",
  });
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Totales que vienen de los hijos
  const [totals, setTotals] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 }); // ingresos
  const [egresosTotals, setEgresosTotals] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
  const [abonosTotals, setAbonosTotals] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
  const [finalBalance, setFinalBalance] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });

  // Fetch de sucursales
  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase.from("branchs").select("id, name");
      if (!error) setBranches(data || []);
    };
    fetchBranches();
  }, []);

  // Cálculo de balance final cada vez que cambian los hijos
  useEffect(() => {
    const balance = {
      EFEC: totals.EFEC - egresosTotals.EFEC + abonosTotals.EFEC,
      TRANS: totals.TRANS - egresosTotals.TRANS + abonosTotals.TRANS,
      DATAF: totals.DATAF - egresosTotals.DATAF + abonosTotals.DATAF,
    };
    balance.total = balance.EFEC + balance.TRANS + balance.DATAF;
    setFinalBalance(balance);
  }, [totals, egresosTotals, abonosTotals]);

  // Calcula el rango de fechas si se selecciona un mes
  const getMonthRange = (month) => {
    const monthMapping = {
      Enero: "01", Febrero: "02", Marzo: "03", Abril: "04", Mayo: "05", Junio: "06",
      Julio: "07", Agosto: "08", Septiembre: "09", Octubre: "10", Noviembre: "11", Diciembre: "12"
    };
    const currentYear = new Date().getFullYear();
    const monthNumber = monthMapping[month];
    if (monthNumber) {
      const startDate = `${currentYear}-${monthNumber}-01`;
      const lastDay = new Date(currentYear, parseInt(monthNumber), 0).getDate();
      const endDate = `${currentYear}-${monthNumber}-${lastDay}`;
      return { since: startDate, till: endDate };
    }
    return { since: "", till: "" };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "month") {
      const range = getMonthRange(value);
      setFormData({
        month: value,
        since: range.since,
        till: range.till,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "since" || name === "till" ? { month: "" } : {}),
      }));
    }
  };
  const moduleSpecificButton = null;

   const bgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const selectBg = useColorModeValue('white', 'gray.700');

  return (
    <Box p={{ base: 2, md: 6 }}  minH="100vh" bg={bgColor} color={textColor}>
    <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Heading  mb={4} 
                            textAlign="left" 
                            size="md"
                            fontWeight="700"
                            color={useColorModeValue('teal.600', 'teal.300')}
                            pb={2}>
        Cierre de Caja
      </Heading>
      <Box p={{ base: 2, md: 6 }} rounded="xl" shadow="md" mb={{ base: 4, md: 8 }}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 6 }}>
          <FormControl>
            <FormLabel fontSize={{ base: "sm", md: "md" }}>Sucursal</FormLabel>
            <Select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              placeholder="Seleccione una sucursal"
              fontSize={{ base: "sm", md: "md" }}
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
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize={{ base: "sm", md: "md" }}>Desde</FormLabel>
            <Input
              type="date"
              name="since"
              value={formData.since}
              onChange={handleChange}
              fontSize={{ base: "sm", md: "md" }}
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
            <FormLabel fontSize={{ base: "sm", md: "md" }}>Hasta</FormLabel>
            <Input
              type="date"
              name="till"
              value={formData.till}
              onChange={handleChange}
              fontSize={{ base: "sm", md: "md" }}
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

          <FormControl gridColumn={{ base: "1", md: "span 3" }}>
            <FormLabel fontSize={{ base: "sm", md: "md" }}>Mes</FormLabel>
            <Select
              name="month"
              value={formData.month}
              onChange={handleChange}
              placeholder="Seleccione un mes"
              fontSize={{ base: "sm", md: "md" }}
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
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>
      </Box>

      {selectedBranch && (
        <Tabs variant="enclosed-colored" colorScheme="blue" isFitted>
          <TabList mb={{ base: 2, md: 4 }}>
            <Tab fontSize={{ base: "sm", md: "md" }}>Ingresos</Tab>
            <Tab fontSize={{ base: "sm", md: "md" }}>Egresos</Tab>
            <Tab fontSize={{ base: "sm", md: "md" }}>Abonos</Tab>
            <Tab fontSize={{ base: "sm", md: "md" }}>Balance Final</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={{ base: 0, md: 2 }}>
              <Box p={{ base: 2, md: 4 }} rounded="xl" shadow="sm" overflowX="auto">
                <IngresosSection
                  branchId={selectedBranch}
                  formData={formData}
                  setTotals={setTotals}
                />
              </Box>
            </TabPanel>

            <TabPanel px={{ base: 0, md: 2 }} >
              <Box p={{ base: 2, md: 4 }} rounded="xl" shadow="sm" overflowX="auto">
                <EgresosSection
                  branchId={selectedBranch}
                  formData={formData}
                  setEgresosTotals={setEgresosTotals}
                />
              </Box>
            </TabPanel>

            <TabPanel px={{ base: 0, md: 2 }}>
              <Box p={{ base: 2, md: 4 }} rounded="xl" shadow="sm" overflowX="auto">
                <AbonosSection
                  branchId={selectedBranch}
                  formData={formData}
                  setAbonosTotals={setAbonosTotals}
                />
              </Box>
            </TabPanel>

            <TabPanel px={{ base: 0, md: 2 }}>
              <Box
                p={{ base: 2, md: 6 }}
                rounded="xl"
                shadow="md"
                bg={useColorModeValue('white', 'gray.900')}
              >
                <Heading
                  size="md"
                  mb={4}
                  color={useColorModeValue('gray.700', 'teal.200')}
                  fontSize={{ base: 'md', md: 'lg' }}
                >
                  Balance Final
                </Heading>
                <StatGroup>
                  <Stat>
                    <StatLabel fontSize={{ base: 'sm', md: 'md' }} color={useColorModeValue('gray.600', 'teal.200')}>Efectivo</StatLabel>
                    <StatNumber color={useColorModeValue('green.600', 'green.300')} fontSize={{ base: 'md', md: 'xl' }}>
                      {finalBalance.EFEC}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel fontSize={{ base: 'sm', md: 'md' }} color={useColorModeValue('gray.600', 'teal.200')}>Transferencia</StatLabel>
                    <StatNumber color={useColorModeValue('blue.600', 'blue.300')} fontSize={{ base: 'md', md: 'xl' }}>
                      {finalBalance.TRANS}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel fontSize={{ base: 'sm', md: 'md' }} color={useColorModeValue('gray.600', 'teal.200')}>Datafast</StatLabel>
                    <StatNumber color={useColorModeValue('purple.600', 'purple.300')} fontSize={{ base: 'md', md: 'xl' }}>
                      {finalBalance.DATAF}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel fontSize={{ base: 'sm', md: 'md' }} color={useColorModeValue('gray.600', 'teal.200')}>Total</StatLabel>
                    <StatNumber color={useColorModeValue('black', 'teal.200')} fontSize={{ base: 'md', md: 'xl' }}>{finalBalance.total}</StatNumber>
                  </Stat>
                </StatGroup>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default CashClousure;
