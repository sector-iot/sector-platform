
import type { Metadata } from 'next';
import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';


export const metadata: Metadata = {
    title: 'IoT Device Management',
    description: 'Cloud IoT Management Platform for secure device updates and monitoring',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex h-[calc(100vh-4rem)]">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}