import logo from "../assets/image.jpeg";
import { ChevronFirst, ChevronLast } from "lucide-react";
import { CircleUser } from "lucide-react";
import { LogOut } from "lucide-react";
import type { SidebarItem } from "../types/sidebar";
import { Link ,useLocation} from "react-router-dom";
import type { User } from "../types/auth";

type SidebarProps = {
  items: SidebarItem[];
  user: User | null;
  onLogout: () => void;
  expand: boolean;
  setExpand: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const Sidebar = ({ items, user, onLogout, expand, setExpand }: SidebarProps) => {
  const location = useLocation();

  const allowedPathsByRole: Record<string, string[]> = {
    driver: ["/dashboard", "/driver"],
    customer: ["/dashboard"],
  };

  const visibleItems = user?.role
    ? items.filter((it) =>
        allowedPathsByRole[user.role ?? ""]?.includes(it.path),
      )
    : items.filter((it) => it.path === "/dashboard");

  return (
    <div
      className={`h-screen fixed top-0 left-0 bg-gray-100 transition-all ${expand ? "w-64" : "w-20"}`}
    >
      <nav className="h-full flex flex-col gap-15 ">
        <div className="p-3 pb-2 flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="logo" className="w-10 h-10 shrink-0" />

            {expand && (
              <h1 className="ml-2 text-md font-bold text-[#005B17]">RECYKLE</h1>
            )}
          </div>

          <button
            onClick={() => setExpand(!expand)}
            className="p-1.5 rounded-lg cursor-pointer shrink-0"
          >
            {expand ? <ChevronFirst size={22} /> : <ChevronLast size={22} />}
          </button>
        </div>

        <ul className="flex-1 px-3 ">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <li key={index}>
                <Link
                  to={item.path}

                  className={`relative flex items-center gap-2 p-3 hover:bg-gray-100 hover:text-green-600 rounded-md cursor-pointer group ${location.pathname === item.path ? "bg-green-100 text-green-600":"hover:bg-gray-100 hover:text-green-600"}`}
                
                >
                  <Icon size={20} />
                  <span
                    className={`font-semibold whitespace-nowrap overflow-hidden transition-all ${
                      expand ? "w-30 ml-3" : "w-0"
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* {!expand && (
                    <div
                      className={`absolute left-full rounded-md px-2 py-1 ml-6 font-medium  text-green-500 text-sm invisible opacity-20 
                translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}
                    >
                      {item.label}
                    </div>
                  )} */}
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
              <h2 className="font-semibold">{user?.email?.split("@")[0] ?? "Guest"}</h2>
              <p className="text-xs">{user?.role ?? "—"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer hover:bg-gray-300 rounded-xl p-1"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
