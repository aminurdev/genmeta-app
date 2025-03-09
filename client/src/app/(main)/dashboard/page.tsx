import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "@/components/dashboard/overview-tab";
import TokensTab from "@/components/dashboard/tokens-tab";
import HistoryTab from "@/components/dashboard/history-tab";
import AccountTab from "@/components/dashboard/account-tab";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto bg-background">
      <div className="flex flex-1 flex-col">
        <main className="p-4 md:p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>

            <TabsContent value="tokens">
              <TokensTab />
            </TabsContent>

            <TabsContent value="history">
              <HistoryTab />
            </TabsContent>

            <TabsContent value="account">
              <AccountTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
