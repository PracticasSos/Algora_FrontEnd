import { Route, Routes } from "react-router-dom";
import Welcome from "../components/Welcome";
import LoginForm from "../components/autorizacion/LoginForm";
import AdminDashBoard from "../components/optionsauth/OptionsAdmin";
import ListUsers from "../components/Admin/ListUsers";
import RegisterPatientForm from "../components/Optometra/RegisterPatient";
import OptometraDashBoard from "../components/optionsauth/OptionsOptometra";
import VendedorDashBoard from "../components/optionsauth/OptionsVendedor.jsx";
import ListPatients from "../components/Optometra/ListPatients"
import Inventario from "../components/Admin/Inventario.jsx";
import InventarioList from "../components/Admin/InventarioList.jsx";
import Branch from "../components/Admin/Branch.jsx";
import ListBranch from "../components/Admin/ListBranch.jsx";
import Lab from "../components/Admin/Labs.jsx";
import ListLab from "../components/Admin/ListLab.jsx";
import CashClousure from "../components/Admin/CashClousure.jsx";
import RegisterLens from "../components/Admin/RegisterLens.jsx";
import MeasuresFinal from "../components/Admin/MeasuresFinal.jsx"
import PatientRecords from "../components/Admin/PatientRecords.jsx"
import Egresos from "../components/Admin/Egresos.jsx"
import PatientHistory from "../components/Admin/PatientHistory.jsx"
import LaboratoryOrder from "../components/Admin/OrderLaboratory/LaboratoryOrder.jsx"
import OrderLaboratoryList from "../components/Admin/OrderLaboratory/OrderLaboratoryList.jsx"
import BalancesPatient from "../components/Admin/BalancesPatient.jsx"
import RetreatsPatients from "../components/Admin/RetreatsPatients.jsx"
import Retreats from "../components/Admin/Retreats.jsx"
import Balance from "../components/Admin/Balance.jsx"
import HistoryMeasureList from "../components/Admin/HistoryMeasureList.jsx";
import HistoryMeasures from "../components/Admin/HistoryMeasures.jsx";
import ListLens from "../components/Admin/ListLens.jsx";
import ListBalance from "../components/Admin/ListBalance.jsx";
import ListSales from "../components/Admin/ListSales.jsx";
import Sales from "../components/Admin/Sales/Sales.jsx";
import Register from "../components/Admin/Register.jsx";
import HistoryClinic from "../components/Admin/HistoryClinic.jsx";
import SalesHistory from "../components/Admin/Sales/history/SalesHistory.jsx";
import Tenants from "../components/tenants/Tenants.jsx";
import PrintCertificate from "../components/Admin/certificate/PrintCertificate.jsx";
import Tenant from "../components/Admin/Tenant.jsx";
import UploadLogo from "../components/Admin/certificate/UploadLogo.jsx";
import SuperAdminDashBoard from "../components/optionsauth/OptionsSuperAdmin.jsx";
import FormInitial from '../components/ExperienceModule/pages/FormInitial.jsx';
import QuestionnairePage from '../components/ExperienceModule/pages/QuestionnairePage.jsx'
import Results from '../components/ExperienceModule/pages/Results.jsx'
import VirtualTryOn3D from '../components/ExperienceModule/TryOn3D/VirtualTryOn3D.jsx'
import AdminPanelModels from '../components/ExperienceModule/TryOn3D/AdminPanelModels.jsx';
import MaterialSelector from '../components/ExperienceModule/pages/MaterialSelector.jsx';
import MessageManager from "../components/Admin/MensaageManager.jsx";
import LensCustomizer from "../components/ExperienceModule/pages/LensCustomizer.jsx";
import Loader from "../components/ExperienceModule/ExperienceUI/Loader.jsx";
import MessageClients from "../components/ExperienceModule/pages/MessageClients.jsx";
import ChangePassword from "../components/optionsauth/ChangePassword.jsx";


const AppRouter = () => {
    return(
        <Routes>
            <Route path="/" element={<Welcome />} /> {/*Cada route sera una ruta de acceso a la pagina */}
            <Route path="/register" element={<Register/>} />{/*Ruta para registrar usuarios (solo admin accede)*/}
            <Route path="/change-password" element={<ChangePassword/>} />{/*Ruta para cambiar contraseña*/}
            <Route path="/tenants" element={<Tenants/>} />{/*Ruta para registrar usuarios (solo admin accede)*/}
            <Route path="/inventory" element={<Inventario/>}></Route>
            <Route path="/login-form" element={<LoginForm/>} />
            <Route path="/admin" element={<AdminDashBoard/>} />
            <Route path="/super-admin" element={<SuperAdminDashBoard/>} />{/*Ruta de las opciones de rol admin*/}
            <Route path="/list-users" element={<ListUsers />} />{/*Ruta para listar usuarios (empleados) (solo admin puede)*/}
            <Route path="/register-patient" element={<RegisterPatientForm />} />
            <Route path="/vendedor" element={<VendedorDashBoard />} />
            <Route path="/optometra" element={<OptometraDashBoard />} />
            <Route path="/list-patients" element={<ListPatients />} />
            <Route path="/list-inventory" element={<InventarioList/>}></Route>
            <Route path="/branch" element={<Branch/>}></Route>
            <Route path="/list-branch" element={<ListBranch/>}></Route>
            <Route path="/labs" element={<Lab/>}></Route>
            <Route path="/list-labs" element={<ListLab/>}></Route>
            <Route path="/cash-closure" element={<CashClousure />} ></Route>
            <Route path="/sales" element= {<Sales/>}></Route>
            <Route path="/sales/:id" element= {<Sales/>}></Route>
            <Route path="/register-lens" element={<RegisterLens/>}></Route>
            <Route path="/patient-records" element={<PatientRecords />}> </Route>
            <Route path="/measures-final" element={<MeasuresFinal />}></Route>
            <Route path="/measures-final/:id" element={<MeasuresFinal />} />
            <Route path="/order-laboratory-list" element={<OrderLaboratoryList/>}> </Route>
            <Route path="/order-laboratory-list/laboratory-order/:patientId" element={<LaboratoryOrder />}></Route>
            <Route path="/history-measure-list" element={<HistoryMeasureList/>}> </Route>
            <Route path="/history-measure-list/history-measures/:patientId" element={<HistoryMeasures/>}></Route>
            <Route path="/egresos" element={<Egresos />}> </Route>
            <Route path="/balances-patient" element={<BalancesPatient/>}></Route>
            <Route path="/retreats-patients" element={<RetreatsPatients/>}></Route>
            <Route path="/retreats-patients/retreats/:saleId" element={<Retreats/>}></Route>
            <Route path="/balance" element={<Balance/>}></Route>
            <Route path="/list-lens" element={<ListLens/>}></Route>
            <Route path="/list-balance" element={<ListBalance/>}></Route>
            <Route path="/list-sales" element={<ListSales/>}></Route>
            <Route path="/history-clinic" element={<HistoryClinic />} />
            <Route path="/history-clinic/patient-history/:patientId" element={<PatientHistory />} />
            <Route path="/history-clinic/patient-history/:patientId/sales-history/:saleId" element={<SalesHistory />} />
            <Route path="/print-certificate" element={<PrintCertificate/>}></Route>
            <Route path="/tenant" element={<Tenant/>}></Route>
            <Route path="/upload-logo" element={<UploadLogo/>}></Route>
            <Route path="/message-manager" element={<MessageManager/>}></Route>
            <Route path="/register-experience" element={<FormInitial />}> </Route>
            <Route path="/cuestionario" element={<QuestionnairePage />}> </Route>
            <Route path="/resultados" element={<Results />} > </Route>
            <Route path="/tryon" element={<VirtualTryOn3D />} > </Route>
            <Route path="/admin/modelos" element={<AdminPanelModels />} />
            <Route path="/material" element={<MaterialSelector />} />
            <Route path="/lens" element={<LensCustomizer />} />
            <Route path="/loader" element={<Loader />} />
            <Route path="/mensajeria" element={<MessageClients />} />


        </Routes>
    )
}

export default AppRouter;