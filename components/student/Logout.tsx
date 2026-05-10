"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

type LogoutProps = {
  collapsed?: boolean;
};

export default function Logout({ collapsed = false }: LogoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; Max-Age=0; path=/;";
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
    >
      <LogOut size={16} />

      {!collapsed && <span>Logout</span>}
    </button>
  );
}