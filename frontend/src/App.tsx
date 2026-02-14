import {BrowserRouter,Routes,Route} from "react-router-dom";
import Home from '../src/pages/Home';
import Dashboard from "../src/pages/Dashboard";
import CustomerPage from "./pages/CustomerPage";
import NotFound from "./pages/NotFound";

function App(){
  return (
    <BrowserRouter>
       <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="customer-page" element={<CustomerPage/>}/>
        <Route path="*" element = {<NotFound/>}/>
       </Routes>
    
    
    </BrowserRouter>
 
   
  )
}

export default App;