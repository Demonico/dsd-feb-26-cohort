import logo from "../assets/image.jpeg";
import { ChevronFirst, ChevronLast } from "lucide-react";
import { CircleUser } from "lucide-react";
import { LogOut } from "lucide-react";
import type { SidebarItem } from "../types/sidebar";
import { Link ,useLocation} from "react-router-dom";
import type { User } from "../types/auth";
import { useEffect, useState } from "react";

type SidebarProps = {
  items: SidebarItem[];
  user: User | null;
  onLogout: () => void;
  expand: boolean;
  setExpand: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const Sidebar = ({ items, user, onLogout, expand, setExpand }: SidebarProps) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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
          {visibleItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <li key={index}>
                <Link
                  to={item.path}

                  className={`relative flex items-center gap-2 p-3 hover:bg-gray-100 hover:text-green-600 rounded-md cursor-pointer group ${location.pathname === item.path ? "bg-green-100 text-green-600":"hover:bg-gray-100 hover:text-green-600"}`}
                
                >
                  <Icon size={30} />
                  <span
                    className={`font-bold whitespace-nowrap overflow-hidden transition-all ${
                      expand ? "w-30 ml-3" : "w-0"
                    }`}
                  >
                    {item.label}
                  </span>
                  {!expand && (
                    <div
                      className={`absolute left-full rounded-md px-2 py-1 ml-6 font-bold  text-green-500 text-sm invisible opacity-20 
                translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}
                    >
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t flex p-2 items-center overflow-hidden">
          {isMobile ? (
            <div className="flex flex-col gap-2 items-stretch w-full">
              <button
                type="button"
                className={`flex items-center gap-2 overflow-hidden rounded-xl p-1 cursor-pointer hover:bg-gray-200 ${
                  expand ? "w-full" : "justify-center w-full"
                }`}
                onClick={() => setShowProfileModal((prev) => !prev)}
                aria-haspopup="dialog"
                aria-expanded={showProfileModal}
                title="Profile"
              >
                <CircleUser size={33} />
                <div
                  className={`overflow-hidden transition-all ${
                    expand ? "w-30 ml-1" : "w-0"
                  }`}
                >
                  <h2 className="font-semibold truncate">
                    {user?.email?.split("@")[0] ?? "Guest"}
                  </h2>
                  <p className="text-xs truncate">{user?.role ?? "—"}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="cursor-pointer hover:bg-gray-300 rounded-xl p-1 shrink-0 w-full flex justify-center"
                title="Logout"
              >
                <LogOut size={24} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 overflow-hidden">
                <CircleUser size={33} />
                <div
                  className={`overflow-hidden transition-all ${
                    expand ? "w-30 ml-1" : "w-0"
                  }`}
                >
                  <h2 className="font-semibold truncate">
                    {user?.email?.split("@")[0] ?? "Guest"}
                  </h2>
                  <p className="text-xs truncate">{user?.role ?? "—"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="cursor-pointer hover:bg-gray-300 rounded-xl p-1 shrink-0 ml-auto"
                title="Logout"
              >
                <LogOut size={24} />
              </button>
            </>
          )}
        </div>
      </nav>

      {isMobile && showProfileModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-start bg-black/30"
          onClick={() => setShowProfileModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`m-4 w-[240px] rounded-xl bg-white p-4 shadow-xl ${expand ? "ml-64" : "ml-20"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">User Details</h3>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-3 text-sm">
              <p className="font-medium">Username</p>
              <p className="text-gray-600">
                {user?.email?.split("@")[0] ?? "Guest"}
              </p>
              <p className="mt-2 font-medium">Role</p>
              <p className="text-gray-600">{user?.role ?? "—"}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Sidebar;
