import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmailLogs } from "@/hooks/useLeads";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface EmailLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmailLogDialog = ({ open, onOpenChange }: EmailLogDialogProps) => {
  const { data: logs = [], isLoading } = useEmailLogs();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'opened': return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'bounced': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Envios</DialogTitle>
          <DialogDescription>
            Lista dos últimos 100 emails enviados pelo sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum email enviado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{log.email_address}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={log.subject}>
                      {log.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailLogDialog;
