import { useEffect, useState, useCallback } from "react";
import { Box, Flex, Heading, Text, SimpleGrid, Input, Button, Badge, FormControl, FormLabel, Switch, useToast, useColorModeValue } from "@chakra-ui/react";
import { supabase } from "../../api/supabase";

const ACCENT = "#00A88E";

/** El SuperAdmin define precio y límites de cada plan. 0 = ilimitado. */
const PlansManager = () => {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [counts, setCounts] = useState({});
  const [saving, setSaving] = useState(null);
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("gray.50", "gray.700");

  const load = useCallback(async () => {
    const { data } = await supabase.from("plans").select("*").order("price_monthly");
    setPlans(data || []);
    const { data: t } = await supabase.from("tenants").select("plan");
    const c = {}; (t || []).forEach((x) => { c[x.plan] = (c[x.plan] || 0) + 1; });
    setCounts(c);
  }, []);
  useEffect(() => { load(); }, [load]);

  const edit = (code, field, value) => setPlans((p) => p.map((x) => (x.code === code ? { ...x, [field]: value } : x)));

  const save = async (p) => {
    setSaving(p.code);
    const { error } = await supabase.from("plans").update({
      name: p.name, price_monthly: Number(p.price_monthly) || 0,
      max_branches: Number(p.max_branches) || 0, max_users: Number(p.max_users) || 0, active: p.active,
    }).eq("code", p.code);
    setSaving(null);
    if (error) toast({ title: "No se pudo guardar", description: error.message, status: "error" });
    else toast({ title: `Plan ${p.name} actualizado`, status: "success", duration: 2500 });
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1100px" mx="auto">
      <Box h="4px" borderRadius="full" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" mb={6} />
      <Heading size="lg" mb={1}>Planes</Heading>
      <Text color={muted} mb={6}>Define cuánto cuesta cada plan y cuántas sucursales y usuarios permite. Pon 0 para ilimitado. El límite se aplica de verdad: si una óptica lo alcanza, el sistema no le deja crear más.</Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
        {plans.map((p) => (
          <Box key={p.code} bg={cardBg} border="1px solid" borderColor={border} borderRadius="24px" overflow="hidden">
            <Box h="4px" bg={ACCENT} />
            <Box p={5}>
              <Flex justify="space-between" align="center" mb={4}>
                <Badge colorScheme="teal" borderRadius="full" px={2}>{p.code}</Badge>
                <Text fontSize="xs" color={muted}>{counts[p.code] || 0} óptica(s)</Text>
              </Flex>
              <FormControl mb={3}><FormLabel fontSize="xs">Nombre</FormLabel><Input value={p.name} onChange={(e) => edit(p.code, "name", e.target.value)} bg={inputBg} borderRadius="10px" /></FormControl>
              <FormControl mb={3}><FormLabel fontSize="xs">Precio mensual ($)</FormLabel><Input type="number" value={p.price_monthly} onChange={(e) => edit(p.code, "price_monthly", e.target.value)} bg={inputBg} borderRadius="10px" /></FormControl>
              <SimpleGrid columns={2} spacing={3} mb={3}>
                <FormControl><FormLabel fontSize="xs">Sucursales</FormLabel><Input type="number" min={0} value={p.max_branches} onChange={(e) => edit(p.code, "max_branches", e.target.value)} bg={inputBg} borderRadius="10px" /></FormControl>
                <FormControl><FormLabel fontSize="xs">Usuarios</FormLabel><Input type="number" min={0} value={p.max_users} onChange={(e) => edit(p.code, "max_users", e.target.value)} bg={inputBg} borderRadius="10px" /></FormControl>
              </SimpleGrid>
              <Flex align="center" justify="space-between" mb={4}>
                <Text fontSize="sm">Plan disponible</Text>
                <Switch isChecked={p.active} onChange={(e) => edit(p.code, "active", e.target.checked)} colorScheme="teal" />
              </Flex>
              <Button w="full" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="full" isLoading={saving === p.code} onClick={() => save(p)}>Guardar cambios</Button>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default PlansManager;
