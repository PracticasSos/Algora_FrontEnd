import React, { useEffect, useState } from 'react';
import { Button, Box, SimpleGrid, Text, Image } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';


import iconocertificadovisual from "../../assets/iconocertificadovisual.png";
import iconocierrediario from "../../assets/iconocierrediario.png";
import iconoconsultarcierre from "../../assets/iconoconsultarcierre.png";
import iconocreditos from "../../assets/iconocreditos.png";
import iconoegresos from "../../assets/iconoegresos.png";
import iconoenvios from "../../assets/iconoenvios.png";
import iconoexperienciausuario from "../../assets/iconoexperienciausuario.png";
import iconohistorialmedidas from "../../assets/iconohistorialmedidas.png";
import iconohistorialventa from "../../assets/iconohistorialventa.png";
import iconoinventario from "../../assets/iconoinventario.png";
import iconolaboratorios from "../../assets/iconolaboratorios.png";
import iconolunas from "../../assets/iconolunas.png";
import iconomedidas from "../../assets/iconomedidas.png";
import iconomensajes from "../../assets/iconomensajes.png";
import iconoordenlaboratorio from "../../assets/iconoordenlaboratorio.png";
import iconoregistrar from "../../assets/iconoregistrar.png";
import iconoretiros from "../../assets/iconoretiros.png";
import iconossaldos from "../../assets/iconossaldos.png";
import iconosucursal from "../../assets/iconosucursal.png";
import iconousuarios from "../../assets/iconousuarios.png";
import iconoventa from "../../assets/iconoventa.png";
import { supabase } from '../../api/supabase';


const options = [
  { label: "REGISTRAR PACIENTE", icon: iconoregistrar },
  { label: "HISTORIAL PACIENTE", icon:  iconohistorialventa }, 
  { label: "ORDEN DE LABORATORIO", icon: iconoordenlaboratorio }, 
  { label: "ENVIOS", icon: iconoenvios }, 
  { label: "VENTA/ CONTRATO DE SERVICIO", icon: iconoventa },
  { label: "RETIROS", icon: iconoretiros },
  { label: "CIERRE", icon: iconocierrediario },
  { label: "SALDOS", icon: iconossaldos },
  { label: "EGRESOS", icon: iconoegresos },
  { label: "HISTORIAL DE MEDIDAS", icon: iconohistorialmedidas },
  { label: "INVENTARIO", icon: iconoinventario },
  { label: "USUARIOS", icon: iconousuarios },
  { label: "LABORATORIOS", icon: iconolaboratorios },
  { label: "SUCURSAL", icon: iconosucursal },
  { label: "CONSULTAR CIERRE", icon: iconoconsultarcierre },
  { label: "IMPRIMIR CERTIFICADO", icon: iconocertificadovisual },
  { label: "REGISTRAR LUNAS", icon: iconolunas },
  { label: "REGISTRAR MEDIDAS", icon: iconomedidas },
  { label: "CREDITOS", icon: iconocreditos },
  { label: "EXPERIENCIA", icon: iconoexperienciausuario },
  {label: "MENSAJES", icon: iconomensajes },
  {label: "LOGOS", icon: iconomensajes },
  {label: "TENANT", icon: iconomensajes }

];

const SuperAdminDashBoard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        console.error('Error al obtener la sesión:', error);
        navigate('/Login');
      } else {
        setUser(session.user);
        localStorage.setItem('user', JSON.stringify(session.user));
      }
      setLoading(false);
    };

    const userFromStorage = JSON.parse(localStorage.getItem('user'));
    if (userFromStorage) {
      setUser(userFromStorage);
      setLoading(false);
    } else {
      checkSession();
    }
  }, [navigate]);

  if (loading || !user) {
    return null; 
  }

  const handleOptionClick = (label) => {
    switch (label) {
      case "USUARIOS":
        navigate('/Register');
        break;
      case "REGISTRAR PACIENTE":
        navigate('/RegisterPatient');
        break;
      case "INVENTARIO":
        navigate('/Inventory');
        break;
      case "SUCURSAL":
        navigate('/Branch');
        break;
      case "LABORATORIOS":
        navigate('/Labs');
        break;
      case "CONSULTAR CIERRE":
        navigate('/CashClousure');
        break;
      case "VENTA/ CONTRATO DE SERVICIO":
        navigate('/Sales');
        break;
      case "REGISTRAR LUNAS":
        navigate('/RegisterLens');
        break;
      case "REGISTRAR MEDIDAS":
        navigate('/MeasuresFinal');
        break;
      case "CIERRE":
        navigate('/PatientRecords');
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
      case "HISTORIAL DE MEDIDAS":
        navigate('/HistoryMeasureList')
        break;
      case "IMPRIMIR CERTIFICADO":
        navigate('/print-certificate')
      break;
      case "HISTORIAL DE VENTAS":
          navigate('/HistoryClinic')
        break;
      case "LOGOS":
        navigate('/UploadLogo')
        break;
      case "TENANT":
        navigate('/Tenant')
        break;
      default:
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

export default SuperAdminDashBoard;