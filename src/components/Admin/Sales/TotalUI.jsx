import { useEffect, useState } from "react";
import {
  Box,
  SimpleGrid,
  Flex,
  FormControl,
  FormLabel,
  Select,
  Input,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { supabase } from "../../../api/supabase";
import { Store, CalendarDays } from "lucide-react";

/**
 * Fecha y sucursal de la venta. El resto de lo que mostraba antes (nombre de
 * armazón/luna y totales) ya se ve en SalesDetails justo arriba, así que se
 * quitó de aquí para no repetir los mismos datos dos veces.
 */
const TotalUI = ({ onFormDataChange, initialFormData = {} }) => {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase.from("branchs").select("*");
      if (!error) setBranches(data || []);
    };
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange({ [name]: value });
  };

  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectBg = useColorModeValue("white", "gray.700");
  const iconBg = useColorModeValue("blue.50", "blue.900");
  const iconColor = useColorModeValue("blue.500", "blue.300");

  const FieldIcon = ({ as }) => (
    <Flex
      align="center"
      justify="center"
      boxSize="36px"
      borderRadius="10px"
      bg={iconBg}
      color={iconColor}
      flexShrink={0}
    >
      <Icon as={as} boxSize="16px" />
    </Flex>
  );

  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="100%">
      <Flex align="center" gap={3}>
        <FieldIcon as={CalendarDays} />
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="semibold" mb={1}>Fecha</FormLabel>
          <Input
            type="date"
            name="date"
            value={initialFormData.date || ""}
            onChange={(e) => onFormDataChange({ date: e.target.value })}
            h="42px"
            borderRadius="lg"
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
          />
        </FormControl>
      </Flex>

      <Flex align="center" gap={3}>
        <FieldIcon as={Store} />
        <FormControl isRequired>
          <FormLabel fontSize="xs" fontWeight="semibold" mb={1}>Sucursal</FormLabel>
          <Select
            name="branchs_id"
            value={initialFormData.branchs_id || ""}
            onChange={handleChange}
            h="42px"
            borderRadius="lg"
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
          >
            <option value="">Selecciona...</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name || branch.id}
              </option>
            ))}
          </Select>
        </FormControl>
      </Flex>
    </SimpleGrid>
  );
};

export default TotalUI;
