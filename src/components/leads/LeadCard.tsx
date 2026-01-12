import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/lead";
import { Building2, MapPin, Globe, Mail, Phone } from "lucide-react";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

const LeadCard = ({ lead, onClick }: LeadCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {lead.companyName}
        </CardTitle>
        <Badge variant={lead.status === 'novo' ? 'default' : 'secondary'}>
          {lead.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{lead.segment}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{lead.city}</span>
          </div>
          {lead.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <a href={lead.website} target="_blank" rel="noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>
                Website
              </a>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadCard;
