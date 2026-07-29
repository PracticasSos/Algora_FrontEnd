import { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  VStack,
  HStack,
  Text,
  Link,
  Spinner,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { FiFileText, FiExternalLink } from "react-icons/fi";
import { supabase } from "../../api/supabase";

const CertificateHistoryModal = ({ isOpen, onClose, patientId, patientName }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !patientId) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("certificates")
        .select("id, issue_date, pdf_url, diagnosis, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (!error) setCertificates(data || []);
      setLoading(false);
    };
    load();
  }, [isOpen, patientId]);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", md: "md" }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius={{ base: 0, md: "20px" }}>
        <ModalHeader fontSize="md">
          Certificados de {patientName || "este paciente"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {loading ? (
            <Spinner size="sm" />
          ) : certificates.length === 0 ? (
            <Text fontSize="sm" color={subtitleColor}>
              Todavía no se ha generado ningún certificado para este paciente.
            </Text>
          ) : (
            <VStack align="stretch" spacing={3}>
              {certificates.map((cert) => (
                <HStack
                  key={cert.id}
                  justify="space-between"
                  p={3}
                  borderRadius="12px"
                  border={`1px solid ${borderColor}`}
                >
                  <HStack>
                    <Icon as={FiFileText} color="#00A88E" />
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        {cert.issue_date}
                      </Text>
                      {cert.diagnosis && (
                        <Text fontSize="xs" color={subtitleColor} noOfLines={1} maxW="220px">
                          {cert.diagnosis}
                        </Text>
                      )}
                    </Box>
                  </HStack>
                  {cert.pdf_url && (
                    <Link href={cert.pdf_url} isExternal color="#00A88E" fontSize="sm" fontWeight="semibold">
                      Ver <Icon as={FiExternalLink} boxSize={3} mb={0.5} />
                    </Link>
                  )}
                </HStack>
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CertificateHistoryModal;
