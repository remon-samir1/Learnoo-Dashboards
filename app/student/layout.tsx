import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Rankings",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-row min-h-screen">
    {/* navbar */}
    {/* sidebar */}
      <main className="grow">{children}</main>
    </div>
  );
}
