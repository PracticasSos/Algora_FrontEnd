import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import MessageSection from "./MenssageSection";
import { useEffect } from "react";
import { supabase } from "../../../api/supabase";


const MessageStep = ({ selectedBranch, formData, setFormData }) => {
  const cardBg = useColorModeValue(
    'rgba(207, 202, 202, 0.5)',
    'rgba(48, 44, 44, 0.2)'
  );

  useEffect(() => {
    const fetchMessage = async () => {
      if (!selectedBranch) return;
      const { data, error } = await supabase
        .from("messages")
        .select("content")
        .eq("branch_id", selectedBranch)
        .eq("route", "/sales")
        .single();
      if (error) {
        setFormData((prev) => ({ ...prev, message: "" }));
      } else if (data && data.content) {
        setFormData((prev) => ({ ...prev, message: data.content }));
      } else {
        setFormData((prev) => ({ ...prev, message: "" }));
      }
    };
    fetchMessage();
  }, [selectedBranch]);

  return (
    <Box mt={8}>
      <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
        Mensaje
      </Text>
      <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
        <MessageSection
          selectedBranch={selectedBranch}
          formData={formData}
          setFormData={setFormData}
        />
      </Box>
    </Box>
  );
};

export default MessageStep;
