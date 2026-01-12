import { Users, UserCheck, MessageSquare, TrendingUp, Clock, Target } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import RecentLeads from '@/components/dashboard/RecentLeads';
import CampaignList from '@/components/dashboard/CampaignList';
import { mockLeads, mockCampaigns, getDashboardMetrics } from '@/data/mockData';

const Dashboard = () => {
  const metrics = getDashboardMetrics();

  return (
    <div className="p-8 space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total de Leads"
          value={metrics.totalLeads}
          icon={Users}
          trend={{ value: 12.5, positive: true }}
        />
        <MetricCard
          title="Leads Novos"
          value={metrics.newLeads}
          icon={UserCheck}
          variant="primary"
        />
        <MetricCard
          title="Em Progresso"
          value={metrics.inProgress}
          icon={MessageSquare}
        />
        <MetricCard
          title="Com Interesse"
          value={metrics.interested}
          icon={Target}
          variant="success"
        />
        <MetricCard
          title="Atendimento"
          value={metrics.humanAttention}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Tempo Médio"
          value={metrics.avgResponseTime}
          subtitle="resposta"
          icon={Clock}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentLeads leads={mockLeads} />
        <CampaignList campaigns={mockCampaigns} />
      </div>

      {/* Conversion Funnel Visual */}
      <div className="bg-card rounded-xl border shadow-card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-6">Funil de Conversão</h3>
        <div className="flex items-end justify-between gap-4 h-48">
          {[
            { label: 'Novos', value: metrics.newLeads, total: metrics.totalLeads },
            { label: 'Contato', value: 3, total: metrics.totalLeads },
            { label: 'Follow-up', value: 2, total: metrics.totalLeads },
            { label: 'Engajados', value: 1, total: metrics.totalLeads },
            { label: 'Interesse', value: metrics.interested, total: metrics.totalLeads },
            { label: 'Atendimento', value: metrics.humanAttention, total: metrics.totalLeads },
          ].map((stage, index) => {
            const height = Math.max(20, (stage.value / metrics.totalLeads) * 100);
            return (
              <div key={stage.label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-lg font-bold text-foreground">{stage.value}</span>
                <div 
                  className="w-full rounded-t-lg gradient-primary transition-all duration-500"
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${index * 100}ms`
                  }}
                />
                <span className="text-xs text-muted-foreground text-center">{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
