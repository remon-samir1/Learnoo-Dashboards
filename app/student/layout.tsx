import Navbar from "@/components/student/Navbar";
import Sidebar from "@/components/student/Sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learnoo-Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
