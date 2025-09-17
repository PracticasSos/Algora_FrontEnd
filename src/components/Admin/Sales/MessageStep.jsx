import { Box, Grid, Flex } from "@chakra-ui/react";
import MessageSection from "./MenssageSection";
import { useEffect } from "react";
import { supabase } from "../../../api/supabase";

const MessageStep = ({ selectedBranch, formData, setFormData }) => {

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
    <Flex justify="center" align="center" >
      <Box mt={8}>
        <Grid gap={6}>
          <MessageSection
            selectedBranch={selectedBranch}
            formData={formData}
            setFormData={setFormData}
          />
        </Grid>
      </Box>
    </Flex>
  );
};

export default MessageStep;
