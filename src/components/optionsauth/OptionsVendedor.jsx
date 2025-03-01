import React from 'react';
import { Button, Box, SimpleGrid, Text, Image } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';


import registrarPacienteIcon from "../../assets/registrarPacientes.svg";
import cierredeCajaIcon from "../../assets/cierredeCaja.svg";
import laboratorioOrdenIcon from "../../assets/laboratorioOrden.svg";
import enviosIcon from "../../assets/envios.svg";
import ventaIcon from "../../assets/venta.svg";
import entregasIcon from "../../assets/entregas.svg";
import saldosIcon from "../../assets/saldos.svg";
import egresosIcon from "../../assets/egresos.svg";
import historiaClinicaIcon from "../../assets/historiaClinica.svg";
import certificadoVisualIcon from "../../assets/certificadoVisual.svg";
import medidasIcon from "../../assets/medidas.svg";
import garantiaIcon from "../../assets/garantia.svg";
import inventarioIcon from "../../assets/inventario.svg";


const options = [
  { label: "REGISTRAR PACIENTE", icon: registrarPacienteIcon },
  { label: "HISTORIAL PACIENTE", icon:  historiaClinicaIcon }, 
  { label: "ORDEN DE LABORATORIO", icon: laboratorioOrdenIcon }, 
  { label: "ENVIOS", icon: enviosIcon }, 
  { label: "VENTA/ CONTRATO DE SERVICIO", icon: ventaIcon },
  { label: "RETIROS", icon: entregasIcon },
  { label: "CIERRE", icon: cierredeCajaIcon },
  { label: "SALDOS", icon: saldosIcon },
  { label: "EGRESOS", icon: egresosIcon },
  { label: "IMPRIMIR CERTIFICADO", icon: certificadoVisualIcon },
  { label: "REGISTRAR MEDIDAS", icon: medidasIcon },
  { label: "CREDITOS", icon: garantiaIcon },
  { label: "INVENTARIO", icon: inventarioIcon },
  { label: "HISTORIAL DE MEDIDAS", icon: registrarPacienteIcon },
];

const VendedorDashBoard = () => {
  const navigate = useNavigate();

  const handleOptionClick = (label) => {
    switch (label) {
      case "REGISTRAR PACIENTE":
        navigate('/RegisterPatient');
        break;
      case "VENTA/ CONTRATO DE SERVICIO":
        navigate('/SalesForm');
        break;
      case "REGISTRAR MEDIDAS":
        navigate('/MeasuresFinal');
        break;
      case "CIERRE":
        navigate('/PatientRecords');
        break;
      case "HISTORIAL DE MEDIDAS":
        navigate('/HistoryMeasureList')
        break;
      case "EGRESOS":
        navigate('/Egresos');
        break;
      case "ORDEN DE LABORATORIO":
        navigate('/OrderLaboratoryList');
        break;
      case "SALDOS":
        navigate('/BalancesPatient')
        break;
      case "RETIROS":
        navigate('/RetreatsPatients')
        break;
      case "CREDITOS":
        navigate('/Balance')
        break;
      case "INVENTARIO":
        navigate('/Inventory');
        break;
      case "HISTORIAL PACIENTE":
          navigate('/PatientHistory')
      default:
        break;
    }
  };

  const handleNavigate = (route) => {
    navigate(route);
  };

  return (
    <>
      <Button onClick={() => handleNavigate('/Login')} mt={4}>
        Cerrar Sesión
      </Button>
      <SimpleGrid columns={[2, null, 4]} spacing={5}>
        {options.map((option, index) => (
          <Box
            key={index}
            textAlign="center"
            p={5}
            boxShadow="md"
            borderRadius="md"
            _hover={{ bg: "gray.100", cursor: "pointer" }}
            onClick={() => handleOptionClick(option.label)}
          >
            <Image
              src={option.icon}
              alt={option.label}
              boxSize="40px"
              mb={3}
              mx="auto"
            />
            <Text>{option.label}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </>
  );
};

export default VendedorDashBoard;