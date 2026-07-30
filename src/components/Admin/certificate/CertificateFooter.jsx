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

  if (loading || !branch) return null;

  // Ya no se muestra en pantalla — esta información completa (dirección,
  // teléfono, redes) se ve en la Vista Previa y en el PDF final, mostrarla
  // también aquí mientras se edita era redundante.
  return null;
};

export default CertificateFooter;