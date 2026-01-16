import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/pages/Dashboard';
import Pipeline from '@/pages/Pipeline';
import Leads from '@/pages/Leads';
import Campaigns from '@/pages/Campaigns';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import { cn } from '@/lib/utils';

const PAGE_CONFIG: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral do seu funil de prospecção' },
  kanban: { title: 'Pipeline', subtitle: 'Gerencie seus leads por etapa do funil' },
  leads: { title: 'Leads', subtitle: 'Todos os seus leads em um só lugar' },
  campaigns: { title: 'Campanhas', subtitle: 'Automações de prospecção ativas' },
  analytics: { title: 'Analytics', subtitle: 'Métricas detalhadas de performance' },
  automations: { title: 'Automações', subtitle: 'Configure seus workflows n8n' },
  settings: { title: 'Configurações', subtitle: 'Preferências e integrações' },
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determina a página inicial com base na URL
  const getPageFromPath = (path: string) => {
    const p = path.replace('/', '');
    if (p === '' || p === 'dashboard') return 'dashboard';
    if (p === 'pipeline') return 'kanban'; // Mapeia URL pipeline -> key kanban
    return p;
  };

  const [currentPage, setCurrentPage] = useState(getPageFromPath(location.pathname));
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const pageConfig = PAGE_CONFIG[currentPage] || PAGE_CONFIG.dashboard;

  // Sincroniza URL se o currentPage mudar internamente (pelo Sidebar)
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Atualiza a URL sem recarregar (opcional, mas bom UX)
    let path = page;
    if (page === 'dashboard') path = '/';
    else if (page === 'kanban') path = '/pipeline';
    else path = `/${page}`;
    
    navigate(path);
  };

  // Sincroniza estado se a URL mudar (ex: back button)
  useEffect(() => {
    setCurrentPage(getPageFromPath(location.pathname));
  }, [location.pathname]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'kanban':
        return <Pipeline searchTerm={searchTerm} />;
      case 'leads':
        return <Leads globalSearchTerm={searchTerm} />;
      case 'campaigns':
        return <Campaigns />;
      default:
        return (
          <div className="p-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Em Desenvolvimento</h2>
              <p className="text-muted-foreground">Esta seção estará disponível em breve.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <main className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        <Header 
          title={pageConfig.title} 
          subtitle={pageConfig.subtitle}
          onAddLead={currentPage !== 'campaigns' ? () => setAddLeadOpen(true) : undefined}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        {renderPage()}
      </main>

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </div>
  );
};

export default Index;
