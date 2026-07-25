import Total from "./Total";

const PaymentStep = ({ formData, onFormDataChange }) => (
  <Total formData={formData} setFormData={onFormDataChange} />
);

export default PaymentStep;
