import { Plus, Play, Pause, Settings, Trash2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockCampaigns } from '@/data/mockData';
import { cn } from '@/lib/utils';

const Campaigns = () => {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Suas Campanhas</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas automações de prospecção</p>
        </div>
        <Button variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCampaigns.map((campaign, index) => (
          <div
            key={campaign.id}
            className="bg-card rounded-xl border shadow-card overflow-hidden animate-fade-in hover:shadow-lg transition-shadow"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Card Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      campaign.status === 'active' 
                        ? "bg-success/10 text-success" 
                        : campaign.status === 'paused'
                        ? "bg-warning/10 text-warning"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {campaign.status === 'active' ? 'Ativa' : campaign.status === 'paused' ? 'Pausada' : 'Concluída'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={campaign.status === 'active' ? 'text-success' : 'text-warning'}
                >
                  {campaign.status === 'active' ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">{campaign.leadsCount}</p>
                  <p className="text-xs text-muted-foreground">Total de leads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{campaign.sentCount}</p>
                  <p className="text-xs text-muted-foreground">E-mails enviados</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium text-foreground">
                    {Math.round((campaign.sentCount / campaign.leadsCount) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${(campaign.sentCount / campaign.leadsCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-success">{campaign.openRate}%</p>
                  <p className="text-xs text-muted-foreground">Abertura</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{campaign.replyRate}%</p>
                  <p className="text-xs text-muted-foreground">Resposta</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-accent">{Math.round(campaign.replyRate * 0.6)}%</p>
                  <p className="text-xs text-muted-foreground">Conversão</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-secondary/30 border-t border-border flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex-1">
                <BarChart3 className="w-4 h-4 mr-1" />
                Analytics
              </Button>
              <Button variant="ghost" size="sm" className="flex-1">
                <Settings className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* New Campaign Card */}
        <button className="bg-card rounded-xl border-2 border-dashed border-border hover:border-primary/50 min-h-[320px] flex flex-col items-center justify-center gap-4 transition-colors">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Criar Nova Campanha</p>
            <p className="text-sm text-muted-foreground mt-1">Configure uma nova automação de prospecção</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Campaigns;
