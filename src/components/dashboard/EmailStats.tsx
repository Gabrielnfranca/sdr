import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmailStats } from "@/hooks/useLeads";
import { Mail, Send, Eye, AlertCircle, CheckCircle2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import EmailLogDialog from "./EmailLogDialog";

const EmailStats = () => {
  const { data: stats, isLoading } = useEmailStats();
  const [showLogs, setShowLogs] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    {
      title: "Enviados",
      value: stats.sent,
      icon: Send,
      color: "text-blue-500",
      description: "Total de emails disparados"
    },
    {
      title: "Entregues",
      value: stats.delivered,
      icon: CheckCircle2,
      color: "text-green-500",
      description: "Chegaram na caixa de entrada"
    },
    {
      title: "Abertos",
      value: stats.opened,
      icon: Eye,
      color: "text-purple-500",
      description: "Leads que visualizaram"
    },
    {
      title: "Recusados (Bounce)",
      value: stats.bounced,
      icon: AlertCircle,
      color: "text-red-500",
      description: "Emails inválidos ou bloqueados"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowLogs(true)}>
          <List className="w-4 h-4 mr-2" />
          Ver Histórico Completo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmailLogDialog open={showLogs} onOpenChange={setShowLogs} />
    </div>
  );
};

export default EmailStats;
