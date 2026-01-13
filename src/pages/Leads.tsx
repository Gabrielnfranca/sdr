import { useState } from 'react';
import { Filter, Download, Upload, LayoutGrid, List, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LeadTable from '@/components/leads/LeadTable';
import LeadCard from '@/components/leads/LeadCard';
import { useLeads, useDeleteLeads } from '@/hooks/useLeads';
import { Lead as UILead, LeadStatus, LeadClassification } from '@/types/lead';
import { Lead as DBLead } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import SearchLeadsDialog from '@/components/leads/SearchLeadsDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Adapter function
const mapSupabaseLeadToUILead = (dbLead: DBLead): UILead => {
  const statusMap: Record<string, LeadStatus> = {
    'lead_novo': 'novo',
    'contato_automatico_enviado': 'contato_enviado',
    'follow_up_1': 'followup_1',
    'follow_up_2': 'followup_2',
    'lead_engajado': 'engajado',
    'lead_com_interesse': 'interesse',
    'atendimento_humano': 'atendimento_humano',
    'perdido': 'perdido'
  };

  const classificationMap: Record<string, LeadClassification> = {
    'sem_site': 'sem_site',
    'site_fraco': 'site_ruim',
    'site_sem_seo': 'site_sem_seo',
    'site_ok': 'site_ok'
  };

  // Extract address from notes if available
  let address = dbLead.city || 'Não informado';
  if (dbLead.notes && dbLead.notes.includes('Endereço Completo:')) {
    const match = dbLead.notes.match(/Endereço Completo: (.*?)(?:\n|$)/);
    if (match) {
      address = match[1];
    }
  }

  return {
    id: dbLead.id,
    companyName: dbLead.company_name,
    segment: dbLead.segment || 'Não informado',
    city: dbLead.city || 'Não informado',
    address: address,
    email: dbLead.email || '',
    phone: dbLead.phone || undefined,
    whatsapp: dbLead.whatsapp || undefined,
    website: dbLead.website || undefined,
    status: statusMap[dbLead.status] || 'novo',
    classification: (dbLead.site_classification ? classificationMap[dbLead.site_classification] : (dbLead.website ? 'pendente' : 'sem_site')),
    origin: dbLead.source,
    tags: dbLead.tags || [],
    createdAt: new Date(dbLead.created_at),
    lastContactAt: dbLead.last_contact_date ? new Date(dbLead.last_contact_date) : undefined,
    score: dbLead.score || 0
  };
};

interface LeadsProps {
  globalSearchTerm?: string;
}

const Leads = ({ globalSearchTerm = '' }: LeadsProps) => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  // Combine global and local search
  const searchTerm = globalSearchTerm || localSearchTerm;

  const { data: dbLeads = [], isLoading } = useLeads();
  const deleteLeadsMutation = useDeleteLeads();
  
  const leads = dbLeads.map(mapSupabaseLeadToUILead);

  const filteredLeads = leads.filter(lead => {
    const normalizedPhone = (lead.phone || '').replace(/\D/g, '');
    const normalizedTerm = searchTerm.replace(/\D/g, '');
    const phoneMatch = lead.phone?.includes(searchTerm) || (normalizedTerm.length > 0 && normalizedPhone.includes(normalizedTerm));

    return (
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phoneMatch
    );
  });


  const handleLeadClick = (lead: UILead) => {
    toast({
      title: lead.companyName,
      description: `Email: ${lead.email || 'N/A'}`,
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedLeads.length === 0) return;
    
    try {
      await deleteLeadsMutation.mutateAsync(selectedLeads);
      setSelectedLeads([]);
      setDeleteDialogOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDeleteOne = async (id: string) => {
    try {
      await deleteLeadsMutation.mutateAsync([id]);
      if (selectedLeads.includes(id)) {
        setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
      }
      setLeadToDelete(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const confirmDelete = () => {
    if (leadToDelete) {
      handleDeleteOne(leadToDelete);
    } else {
      handleDeleteSelected();
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar por empresa, segmento ou cidade..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="w-80"
          />
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          {selectedLeads.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setDeleteDialogOpen(true)}
              className="animate-fade-in"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir ({selectedLeads.length})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'table' ? "bg-secondary" : "hover:bg-secondary/50"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'grid' ? "bg-secondary" : "hover:bg-secondary/50"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={() => setSearchDialogOpen(true)}>
            <Search className="w-4 h-4 mr-2" />
            Buscar no Google
          </Button>

          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <span className="text-muted-foreground">
          <strong className="text-foreground">{filteredLeads.length}</strong> leads encontrados
        </span>
        <span className="text-muted-foreground">
          <strong className="text-success">{filteredLeads.filter(l => l.status === 'interesse').length}</strong> com interesse
        </span>
        <span className="text-muted-foreground">
          <strong className="text-primary">{filteredLeads.filter(l => l.status === 'atendimento_humano').length}</strong> em atendimento
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              onClick={() => handleLeadClick(lead)} 
            />
          ))}
        </div>
      ) : (
        <LeadTable 
          leads={filteredLeads} 
          onLeadClick={handleLeadClick}
          selectedLeads={selectedLeads}
          onSelectionChange={setSelectedLeads}
          onDeleteLead={(id) => {
            setLeadToDelete(id);
            setDeleteDialogOpen(true);
          }}
        />
      )}

      <SearchLeadsDialog 
        open={searchDialogOpen} 
        onOpenChange={setSearchDialogOpen} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente {leadToDelete ? 'o lead selecionado' : `${selectedLeads.length} leads selecionados`} e removerá seus dados de nossos servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setLeadToDelete(null);
            }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Leads;
