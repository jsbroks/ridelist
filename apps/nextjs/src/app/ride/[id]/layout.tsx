import { Navbar } from "~/app/_components/navbar";

export default function RideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}
