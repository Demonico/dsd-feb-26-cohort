import Sidebar from "../components/Sidebar";

import {House,Truck,Map,Users} from "lucide-react";


const items  = [
  {label:"Dashboard",icon:House},
  {label:"Driver Manifest",icon:Truck},
  {label:"Map",icon:Map},
  {label:"Customers",icon:Users},
]


const Home = () => {

  return (
    <div>
      <Sidebar items={items}/>
    </div>
  )
}

export default Home;