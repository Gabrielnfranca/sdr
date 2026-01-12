import { Campaign } from '@/types/lead';
import { Play, Pause, MoreHorizontal, TrendingUp, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CampaignListProps {
  campaigns: Campaign[];
}

const CampaignList = ({ campaigns }: CampaignListProps) => {
  return (
    <div className="bg-card rounded-xl border shadow-card animate-fade-in">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Campanhas Ativas</h3>
          <p className="text-sm text-muted-foreground mt-1">Automações em execução</p>
        </div>
        <Button variant="outline" size="sm">Ver todas</Button>
      </div>
      
      <div className="divide-y divide-border">
        {campaigns.map((campaign, index) => (
          <div
            key={campaign.id}
            className="p-4 hover:bg-secondary/30 transition-colors duration-200"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              <button className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                campaign.status === 'active' 
                  ? "bg-success/10 text-success hover:bg-success/20" 
                  : "bg-warning/10 text-warning hover:bg-warning/20"
              )}>
                {campaign.status === 'active' ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{campaign.name}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    campaign.status === 'active' 
                      ? "bg-success/10 text-success" 
                      : "bg-warning/10 text-warning"
                  )}>
                    {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{campaign.leadsCount} leads</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{campaign.sentCount} enviados</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-success">
                    <TrendingUp className="w-4 h-4" />
                    <span>{campaign.openRate}% abertura</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{campaign.replyRate}%</p>
                <p className="text-xs text-muted-foreground">taxa de resposta</p>
              </div>

              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignList;
