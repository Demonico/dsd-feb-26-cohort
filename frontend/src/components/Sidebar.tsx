import { useState } from "react";
import logo from "../assets/image.jpeg";
import { ChevronFirst, ChevronLast } from "lucide-react";
import { CircleUser } from "lucide-react";
import { Settings } from "lucide-react";
import type { SidebarItem } from "../types/sidebar";
import {Link} from "react-router-dom";

type SidebarProps = {
  items: SidebarItem[];
};

const Sidebar = ({ items }: SidebarProps) => {
  const [expand, setExpand] = useState(true);
  return (
    <div
      className={`h-screen bg-gray-100 transition-all ${expand ? "w-64" : "w-20"}`}
    >
      <nav className="h-full flex flex-col gap-15">
        <div className="p-3 pb-2 flex items-center justify-between">
          <img
            src={logo}
            alt="logo"
            className={`overflow-hidden transition-all ${expand ? "w-15" : "w-0"}`}
          ></img>
          <span></span>
          <button
            onClick={() => setExpand(!expand)}
            className="p-1.5 rounded-lg ml-3 cursor-pointer hover:bg-gray-200"
          >
            {expand ? (
              <ChevronFirst size={25} className="text-black-500" />
            ) : (
              <ChevronLast size={25} className="text-black-500" />
            )}
          </button>
        </div>

        <ul className="flex-1 px-3 ">
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <li
                key={index}
              
              >
                <Link to={item.path}   className="relative flex items-center gap-2 p-3 hover:bg-gray-100 hover:text-green-600 rounded-md cursor-pointer group">
                <Icon size={30} />
                <span
                  className={`font-bold whitespace-nowrap overflow-hidden transition-all ${expand ? "w-30 ml-3" : "w-0"}`}
                >
                  {item.label}
                </span>
                {!expand  && ( <div className={`
                absolute left-full rounded-md px-2 py-1 ml-6 font-bold  text-green-500 text-sm invisible opacity-20 
                translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}>{item.label}</div>)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t flex p-2 items-center gap-2 justify-between">
          <div className={`flex items-center gap-2 `}>
            <CircleUser size={33} />
            <div
              className={`overflow-hidden transition-all ${expand ? "w-30 ml-1" : "w-0"}`}
            >
              <h2 className="font-semibold">John Doe</h2>
              <p className="text-xs">Driver</p>
            </div>
          </div>
          <div
            className={`overflow-hidden transition-all ${expand ? "w-30 ml-1" : "w-0"}`}
          >
            <Settings
              size={30}
              className="cursor-pointer hover:bg-gray-300 rounded-xl "
            />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
