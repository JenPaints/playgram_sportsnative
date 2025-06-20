import { useState } from "react";
import { SignOutButton } from "../SignOutButton";
import ProductsTab from "./ProductsTab";
import ContentTab from "./ContentTab";
import UsersTab from "./UsersTab";
import BatchesTab from "./BatchesTab";
import MessagingTab from "./MessagingTab";
import OrdersTab from "./admin/OrdersTab";
import SettingsTab from "./SettingsTab";
import { OverviewTab } from "./OverviewTab";
import SportsTab from "./SportsTab";
import CoachesTab from "./CoachesTab";
import InvoicesTab from "./InvoicesTab";
import RewardsTab from "./RewardsTab";
import AnalyticsTab from "./AnalyticsTab";
import ReportsTab from "./ReportsTab";
import { LayoutDashboard, Users, Dumbbell, Box as LucideBox, ShoppingCart, FileText, MessageSquare, Receipt, Gift, LineChart, Settings, Table } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "sports", label: "Sports", icon: Dumbbell },
  { id: "batches", label: "Batches", icon: LucideBox },
  { id: "products", label: "Products", icon: ShoppingCart },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "content", label: "Content", icon: FileText },
  { id: "messaging", label: "Messaging", icon: MessageSquare },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "reports", label: "Reports", icon: Table },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "coaches", label: "Coaches", icon: Users },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`fixed z-30 inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block`}>
        <div className="flex items-center h-16 px-6 font-bold text-lg tracking-tight border-b border-border">
          Admin Dashboard
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  className={`flex items-center w-full px-6 py-2 rounded-lg transition-colors text-left gap-3 ${activeTab === tab.id ? "bg-primary text-primary-foreground shadow" : "hover:bg-muted"}`}
                onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-border">
          <SignOutButton className="w-full admin-button-secondary" />
        </div>
      </aside>

          {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile sidebar toggle */}
        <div className="md:hidden flex items-center h-16 px-4 border-b border-border bg-card">
          <button
            className="mr-2 p-2 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-bold text-lg">Admin Dashboard</span>
        </div>
        <main className="flex-1 p-6 bg-background">
          {/* Render the active tab's content here */}
                {activeTab === "overview" && <OverviewTab />}
                {activeTab === "users" && <UsersTab />}
                {activeTab === "sports" && <SportsTab />}
                {activeTab === "batches" && <BatchesTab />}
                {activeTab === "products" && <ProductsTab />}
                {activeTab === "orders" && <OrdersTab />}
                {activeTab === "content" && <ContentTab />}
                {activeTab === "messaging" && <MessagingTab />}
                {activeTab === "invoices" && <InvoicesTab />}
                {activeTab === "rewards" && <RewardsTab />}
                {activeTab === "analytics" && <AnalyticsTab />}
                {activeTab === "reports" && <ReportsTab />}
                {activeTab === "settings" && <SettingsTab />}
          {activeTab === "coaches" && <CoachesTab />}
        </main>
      </div>
    </div>
  );
}
