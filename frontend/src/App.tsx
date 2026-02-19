import {BrowserRouter,Routes,Route} from "react-router-dom";
import Home from './pages/Home';
import Dashboard from "./pages/Dashboard";
import CustomerPage from "./pages/CustomerPage";
import NotFound from "./pages/NotFound";
import DriverManifest from "./pages/DriverManifest";

function App(){
  return (
    <BrowserRouter>
       <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/customer-page" element={<CustomerPage/>}/>
        <Route path="/driver-manifest" element={<DriverManifest/>}/>
        <Route path="*" element = {<NotFound/>}/>
       </Routes>
    </BrowserRouter>
 
   
  )
}

export default App;