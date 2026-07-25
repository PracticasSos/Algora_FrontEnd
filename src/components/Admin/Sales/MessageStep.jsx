import { useEffect } from "react";
import MessageSection from "./MenssageSection";
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
    <MessageSection selectedBranch={selectedBranch} formData={formData} setFormData={setFormData} />
  );
};

export default MessageStep;
