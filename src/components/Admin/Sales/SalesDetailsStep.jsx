import SalesDetails from "./SalesDetails";

const SalesDetailsStep = ({
  formData,
  setFormData,
  onTotalsChange,
  accessories,
  setAccessories,
  onOpenAddMore,
}) => (
  <SalesDetails
    formData={formData}
    setFormData={setFormData}
    onTotalsChange={onTotalsChange}
    accessories={accessories}
    setAccessories={setAccessories}
    onOpenAddMore={onOpenAddMore}
  />
);

export default SalesDetailsStep;
