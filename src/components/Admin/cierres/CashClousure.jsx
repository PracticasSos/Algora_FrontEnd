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
  Badge,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { FaMoneyBillWave, FaExchangeAlt, FaCreditCard, FaBalanceScale } from "react-icons/fa";
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

  const [totals, setTotals] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
  const [egresosTotals, setEgresosTotals] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
  const [abonosTotals, setAbonosTotals] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });
  const [finalBalance, setFinalBalance] = useState({ EFEC: 0, TRANS: 0, DATAF: 0, total: 0 });

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase.from("branchs").select("id, name");
      if (!error) setBranches(data || []);
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const balance = {
      EFEC: totals.EFEC - egresosTotals.EFEC + abonosTotals.EFEC,
      TRANS: totals.TRANS - egresosTotals.TRANS + abonosTotals.TRANS,
      DATAF: totals.DATAF - egresosTotals.DATAF + abonosTotals.DATAF,
    };
    balance.total = balance.EFEC + balance.TRANS + balance.DATAF;
    setFinalBalance(balance);
  }, [totals, egresosTotals, abonosTotals]);

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

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectBg = useColorModeValue('white', 'gray.700');
  const shadow = useColorModeValue('md', 'dark-lg');

  return (
    <Box p={{ base: 2, md: 8 }} minH="100vh" bg={bgColor} color={textColor}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Heading
        mt={4}
        mb={6}
        textAlign="left"
        size="lg"
        fontWeight="800"
        color={useColorModeValue('teal.700', 'teal.200')}
        letterSpacing="tight"
      >
        Cierre de Caja
      </Heading>
      <Box
        p={{ base: 3, md: 6 }}
        rounded="2xl"
        shadow={shadow}
        mb={{ base: 4, md: 10 }}
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
      >
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={{ base: 3, md: 6 }}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold">Sucursal</FormLabel>
            <Select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              placeholder="Seleccione una sucursal"
              fontSize="sm"
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
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
            <FormLabel fontSize="sm" fontWeight="bold">Desde</FormLabel>
            <Input
              type="date"
              name="since"
              value={formData.since}
              onChange={handleChange}
              fontSize="sm"
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
              _focus={{
                borderColor: useColorModeValue('blue.500', 'blue.300'),
                boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
              }}
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold">Hasta</FormLabel>
            <Input
              type="date"
              name="till"
              value={formData.till}
              onChange={handleChange}
              fontSize="sm"
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
              _focus={{
                borderColor: useColorModeValue('blue.500', 'blue.300'),
                boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
              }}
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold">Mes</FormLabel>
            <Select
              name="month"
              value={formData.month}
              onChange={handleChange}
              placeholder="Seleccione un mes"
              fontSize="sm"
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
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
        <Tabs variant="soft-rounded" colorScheme="teal" isFitted>
          <TabList mb={{ base: 2, md: 4 }}>
            <Tab fontSize={{ base: "sm", md: "md" }}>
              <Icon as={FaMoneyBillWave} mr={2} /> Ingresos
            </Tab>
            <Tab fontSize={{ base: "sm", md: "md" }}>
              <Icon as={FaExchangeAlt} mr={2} /> Egresos
            </Tab>
            <Tab fontSize={{ base: "sm", md: "md" }}>
              <Icon as={FaCreditCard} mr={2} /> Abonos
            </Tab>
            <Tab fontSize={{ base: "sm", md: "md" }}>
              <Icon as={FaBalanceScale} mr={2} /> Balance Final
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={{ base: 0, md: 2 }}>
              <Box
                p={{ base: 2, md: 4 }}
                rounded="xl"
                shadow="sm"
                overflowX="auto"
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
              >
                <IngresosSection
                  branchId={selectedBranch}
                  formData={formData}
                  setTotals={setTotals}
                />
              </Box>
            </TabPanel>

            <TabPanel px={{ base: 0, md: 2 }}>
              <Box
                p={{ base: 2, md: 4 }}
                rounded="xl"
                shadow="sm"
                overflowX="auto"
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
              >
                <EgresosSection
                  branchId={selectedBranch}
                  formData={formData}
                  setEgresosTotals={setEgresosTotals}
                />
              </Box>
            </TabPanel>

            <TabPanel px={{ base: 0, md: 2 }}>
              <Box
                p={{ base: 2, md: 4 }}
                rounded="xl"
                shadow="sm"
                overflowX="auto"
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
              >
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
                rounded="2xl"
                shadow="md"
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
              >
                <Heading
                  size="md"
                  mb={4}
                  color={useColorModeValue('gray.700', 'teal.200')}
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="bold"
                >
                  Balance Final
                </Heading>
                <StatGroup>
                  <Stat>
                    <Flex align="center" gap={2}>
                      <Icon as={FaMoneyBillWave} color="green.400" />
                      <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'teal.200')}>Efectivo</StatLabel>
                      <Badge colorScheme="green" ml={2}>EFEC</Badge>
                    </Flex>
                    <StatNumber color={useColorModeValue('green.600', 'green.300')} fontSize={{ base: 'md', md: 'xl' }}>
                      {finalBalance.EFEC}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <Flex align="center" gap={2}>
                      <Icon as={FaExchangeAlt} color="blue.400" />
                      <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'teal.200')}>Transferencia</StatLabel>
                      <Badge colorScheme="blue" ml={2}>TRANS</Badge>
                    </Flex>
                    <StatNumber color={useColorModeValue('blue.600', 'blue.300')} fontSize={{ base: 'md', md: 'xl' }}>
                      {finalBalance.TRANS}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <Flex align="center" gap={2}>
                      <Icon as={FaCreditCard} color="purple.400" />
                      <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'teal.200')}>Datafast</StatLabel>
                      <Badge colorScheme="purple" ml={2}>DATAF</Badge>
                    </Flex>
                    <StatNumber color={useColorModeValue('purple.600', 'purple.300')} fontSize={{ base: 'md', md: 'xl' }}>
                      {finalBalance.DATAF}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <Flex align="center" gap={2}>
                      <Icon as={FaBalanceScale} color="teal.400" />
                      <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'teal.200')}>Total</StatLabel>
                      <Badge colorScheme="teal" ml={2}>TOTAL</Badge>
                    </Flex>
                    <StatNumber color={useColorModeValue('black', 'teal.200')} fontSize={{ base: 'md', md: 'xl' }}>
                      {finalBalance.total}
                    </StatNumber>
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
