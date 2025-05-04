import { DeviceOverview } from "@/components/dashboard/device-overview";

export default function DashboardPage() {
  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500">
          Welcome to your Sector dashboard. Monitor your devices, firmware updates, and system health.
        </p>
      </div>
      <DeviceOverview />
    </main>
  );    
}