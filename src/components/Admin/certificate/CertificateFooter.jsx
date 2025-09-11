import { useEffect, useState } from 'react';
import { Box, Flex, Icon, Text, Spinner } from '@chakra-ui/react';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebook, FaInstagram } from 'react-icons/fa';
import { supabase } from '../../../api/supabase';

const CertificateFooter = ({ currentUser, onFooterInfo }) => {
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.branch_id) {
      setLoading(false);
      return;
    }

    const fetchBranch = async () => {
      const { data, error } = await supabase
        .from('branchs')
        .select('address, cell, name, email')
        .eq('id', currentUser.branch_id)
        .single();

      if (error) {
        console.error('Error al cargar datos de la sucursal:', error);
      } else {
        setBranch(data);
        // Construir el string del footer y enviarlo al padre
        if (onFooterInfo && data) {
          const footerString = `${data.name || ''} | ${data.address || ''} | Tel: ${data.cell || ''} | Email: ${data.email || ''}`;
          onFooterInfo(footerString);
        }
      }
      setLoading(false);
    };

    fetchBranch();
  }, [currentUser?.branch_id]);

  if (loading) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner />
      </Box>
    );
  }

  if (!branch) return null;

  return (
    <Box mt={10} pt={4} borderTop="1px solid #ccc" fontSize="sm">
      <Flex direction="column" align="center" gap={2}>
        <Flex align="center" gap={2}>
          <Icon as={FaMapMarkerAlt} />
          <Text>{branch.address}</Text>
        </Flex>

        <Flex align="center" gap={2}>
          <Icon as={FaPhoneAlt} />
          <Text>{branch.cell}</Text>
        </Flex>

        <Flex align="center" gap={2}>
          <Icon as={FaEnvelope} />
          <Text>{branch.email}</Text>
        </Flex>

        <Flex align="center" gap={4} mt={2}>
          <Icon as={FaFacebook} boxSize={5} />
          <Icon as={FaInstagram} boxSize={5} />
        </Flex>
      </Flex>
    </Box>
  );
};

export default CertificateFooter;