import SalesDetails from "./SalesDetails";

const SalesDetailsStep = ({
  formData,
  setFormData,
  onTotalsChange,
  accessories,
  setAccessories,
  onOpenAddMore,
  treatmentsCatalog,
  selectedTreatmentIds,
  setSelectedTreatmentIds,
  treatmentPriceOverrides,
  setTreatmentPriceOverrides,
  treatmentsSubtotal,
  treatmentsTotal,
}) => (
  <SalesDetails
    formData={formData}
    setFormData={setFormData}
    onTotalsChange={onTotalsChange}
    accessories={accessories}
    setAccessories={setAccessories}
    onOpenAddMore={onOpenAddMore}
    treatmentsCatalog={treatmentsCatalog}
    selectedTreatmentIds={selectedTreatmentIds}
    setSelectedTreatmentIds={setSelectedTreatmentIds}
    treatmentPriceOverrides={treatmentPriceOverrides}
    setTreatmentPriceOverrides={setTreatmentPriceOverrides}
    treatmentsSubtotal={treatmentsSubtotal}
    treatmentsTotal={treatmentsTotal}
  />
);

export default SalesDetailsStep;
