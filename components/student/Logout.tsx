"use client";

import { userLogout } from "@/src/services/student/auth.service";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "@/lib/cookies";

type LogoutProps = {
  collapsed?: boolean;
};

export default function Logout({ collapsed = false }: LogoutProps) {
  const router = useRouter();

const handleLogout = async () => {
  const res = await userLogout();

  if (!res.success) {
    toast.error(res.message || "Logout failed");
    return;
  }

  toast.success(res.message || "Logged out successfully");

  Cookies.remove("token");

  router.push("/login");
  router.refresh();
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