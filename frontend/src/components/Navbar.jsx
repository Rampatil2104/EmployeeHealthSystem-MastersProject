import { NavLink } from "react-router-dom";
import DarkModeToggle from "./DarkModeToggle";

const link = ({ isActive }) =>
  `px-3 py-1 rounded-full text-sm ${isActive ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-gray-100"}`;

export default function Navbar() {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">
        Employee Health System Dashboard
      </h1>
      <div className="flex items-center gap-2">
        <NavLink to="/" className={link}>Summary View</NavLink>
        <NavLink to="/group" className={link}>Group View</NavLink>
        <NavLink to="/individual" className={link}>Individual View</NavLink>
        <DarkModeToggle />
      </div>
    </div>
  );
}
