import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../../api/supabase';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  useColorModeValue
} from '@chakra-ui/react';
import SmartHeader from "../header/SmartHeader";

const HistoryClinic = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState('');
  const [branches, setBranches] = useState([]);
  const [messageTemplate, setMessageTemplate] = useState('');
  const navigate = useNavigate();

  const defaultMessage = 'Hola {nombre}, aquí está su historial clínico: {pdf_url}';

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchPatients(selectedBranch);
      fetchMessageTemplate(selectedBranch);
    } else {
      setPatients([]);
      setFilteredPatients([]);
      setMessageTemplate(defaultMessage);
    }
  }, [selectedBranch]);

  const fetchPatients = async (branchId) => {
    if (!branchId) return;

    const { data, error } = await supabase
      .from('sales')
      .select('branchs_id, patients(id, pt_firstname, pt_lastname, pt_ci, pt_phone), pdf_url, date')
      .eq('branchs_id', branchId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching patients:', error);
      return;
    }

    const map = new Map();
    for (const sale of data) {
      const patient = sale.patients;
      if (patient && patient.id) {
        const key = `${patient.id}-${sale.branchs_id}`;
        if (!map.has(key)) {
          map.set(key, {
            ...patient,
            branchs_id: sale.branchs_id,
            pdf_url: sale.pdf_url || null,
            date: sale.date,
          });
        }
      }
    }

    const uniquePatients = Array.from(map.values());
    uniquePatients.sort((a, b) => new Date(b.date) - new Date(a.date));
    setPatients(uniquePatients);
    setFilteredPatients(uniquePatients);
  };

  const fetchMessageTemplate = async (branchId) => {
    const { data, error } = await supabase
      .from("messages")
      .select("content")
      .eq("branch_id", branchId)
      .eq("route", "/sales") // Asegúrate que esta ruta sea la correcta
      .single();

    if (error || !data || !data.content) {
      console.error("Error fetching message template, using default.", error);
      setMessageTemplate(defaultMessage);
    } else {
      setMessageTemplate(data.content);
    }
  };

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('branchs')
      .select('id, name');

    if (error) {
      console.error('Error fetching branches:', error);
    } else {
      setBranches(data);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setFilteredPatients(
      patients.filter(patient =>
        `${patient.pt_firstname} ${patient.pt_lastname} ${patient.pt_ci}`
          .toLowerCase()
          .includes(value.toLowerCase())
      )
    );
  };

  const handlePatientSelect = (patient) => {
    navigate(`/history-clinic/patient-history/${patient.id}`, { state: { patientData: patient } });
  };

  const moduleSpecificButton = null;

  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectBg = useColorModeValue('white', 'gray.700');

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight="100vh"
      bg={useColorModeValue('gray.50', 'gray.800')}
      py={8}
    >
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Box w="90%" mt={6} mb={6} px={4}>
        <Heading
          mb={2}
          textAlign="left"
          size="lg"
          fontWeight="bold"
          color={useColorModeValue('teal.700', 'teal.200')}
          letterSpacing="tight"
        >
          Historial de Venta
        </Heading>
        <Box
          h="2px"
          w="60px"
          bgGradient="linear(to-r, teal.400, teal.600)"
          borderRadius="full"
          mb={4}
        />
      </Box>
      <Box
        as="form"
        width="90%"
        p={8}
        boxShadow={useColorModeValue('xl', 'dark-lg')}
        borderRadius="2xl"
        bg={useColorModeValue('white', 'gray.700')}
        mb={8}
        transition="box-shadow 0.2s"
      >
        <Box
          display="flex"
          flexDirection={{ base: "column", md: "row" }}
          gap={4}
          mb={6}
        >
          <Input
            placeholder="Buscar por nombre, apellido o cédula"
            value={search}
            onChange={handleSearchChange}
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
            _placeholder={{ color: useColorModeValue('gray.400', 'gray.500') }}
            _hover={{ borderColor: useColorModeValue('teal.300', 'teal.500') }}
            _focus={{
              borderColor: useColorModeValue('teal.500', 'teal.300'),
              boxShadow: useColorModeValue('0 0 0 2px teal.200', '0 0 0 2px teal.600')
            }}
            transition="all 0.2s"
          />
          <Select
            placeholder="Seleccione una sucursal"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
            _hover={{ borderColor: useColorModeValue('teal.300', 'teal.500') }}
            _focus={{
              borderColor: useColorModeValue('teal.500', 'teal.300'),
              boxShadow: useColorModeValue('0 0 0 2px teal.200', '0 0 0 2px teal.600')
            }}
            transition="all 0.2s"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </Select>
        </Box>
        <Box
          overflowX="auto"
          width="100%"
          borderRadius="lg"
          boxShadow={useColorModeValue('md', 'dark-lg')}
          bg={useColorModeValue('gray.50', 'gray.800')}
          p={2}
        >
          <Table variant="striped" colorScheme="teal" minWidth="800px">
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>Apellido</Th>
                <Th>Cédula</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredPatients.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center" py={8} color="gray.500">
                    No se encontraron pacientes.
                  </Td>
                </Tr>
              ) : (
                filteredPatients.map(patient => (
                  <Tr
                    key={`${patient.id}-${patient.branchs_id}`}
                    onClick={() => handlePatientSelect(patient)}
                    _hover={{ bg: useColorModeValue('teal.50', 'teal.900'), cursor: 'pointer' }}
                    transition="background 0.2s"
                  >
                    <Td fontWeight="medium">{patient.pt_firstname}</Td>
                    <Td>{patient.pt_lastname}</Td>
                    <Td>{patient.pt_ci}</Td>
                    <Td>
                      {patient.pdf_url && (
                        <Button
                          size="sm"
                          colorScheme="teal"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();

                            let mensajeFinal = messageTemplate.replace('{nombre}', patient.pt_firstname);

                            if (mensajeFinal.includes('{pdf_url}')) {
                              mensajeFinal = mensajeFinal.replace('{pdf_url}', patient.pdf_url);
                            } else {
                              mensajeFinal += ` ${patient.pdf_url}`;
                            }

                            const whatsappUrl = `https://wa.me/${patient.pt_phone}?text=${encodeURIComponent(mensajeFinal)}`;
                            window.open(whatsappUrl, "_blank");
                          }}
                          leftIcon={
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.472-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.2 5.077 4.363.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            </svg>
                          }
                        >
                          Enviar PDF
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}

export default HistoryClinic;