import Sidebar from "../components/Sidebar";

import {House,Truck,Map,Users} from "lucide-react";


const items  = [
  {label:"Dashboard",icon:House,path:"/dashboard"},
  {label:"Driver Manifest",icon:Truck,path:"/driver-manifest"},
  {label:"Map",icon:Map,path:"/map"},
  {label:"Customers",icon:Users,path:"/customers"},
]


const Home = () => {

  return (
    <div>
      <Sidebar items={items}/>
    </div>
  )
}

export default Home;