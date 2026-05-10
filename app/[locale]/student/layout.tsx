import Navbar from "@/components/student/Navbar";
import Sidebar from "@/components/student/Sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learnoo-Dashboard",
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="flex-1  p-5">{children}</main>
      </div>
    </div>
  );
}
