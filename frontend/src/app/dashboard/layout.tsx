export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen w-screen bg-[#060606] overflow-hidden">{children}</div>;
}
