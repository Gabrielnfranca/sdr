import { useState, useEffect } from "react";
import { Lead } from "@/types/lead";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar as CalendarIcon, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  ExternalLink,
  MessageSquare,
  Clock,
  Building2,
  Save,
  History,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LeadDetailsSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (leadId: string, data: Partial<Lead>) => void;
}

export default function LeadDetailsSheet({ 
  lead, 
  open, 
  onOpenChange,
  onSave 
}: LeadDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData(lead);
    }
  }, [lead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (lead && onSave) {
      setIsSaving(true);
      await onSave(lead.id, formData);
      setTimeout(() => setIsSaving(false), 500); 
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'contacted': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'qualified': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'converted': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[600px] flex flex-col p-0 gap-0 sm:max-w-[600px]">
        
        {/* Header - More professional look */}
        <div className="bg-muted/30 border-b px-6 py-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${getStatusColor(lead.status)} border capitalize`}>
                  {lead.status.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
              <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                {lead.companyName}
              </SheetTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />
                <span>{lead.segment}</span>
                <span>•</span>
                <MapPin className="w-3.5 h-3.5" />
                <span>{lead.city}</span>
              </div>
            </div>
            
             <Button variant="outline" size="icon" onClick={() => onOpenChange(false)}>
                <span className="sr-only">Fechar</span>
                <span aria-hidden="true" className="text-xl">×</span>
             </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            <div className="px-6 border-b">
              <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-6">
                <TabsTrigger 
                  value="info" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium"
                >
                  Notas e Follow-up
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium"
                >
                  Histórico
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 pb-20">
                <TabsContent value="info" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                  
                  {/* Lead Score Card */}
                  <Card className="bg-muted/10 border-muted">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-primary" />
                        Análise de Qualidade
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Lead Score</span>
                          <span className="text-sm font-bold">{lead.score}/100</span>
                        </div>
                        <Progress value={lead.score} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Classificação</span>
                        <div className="font-semibold capitalize flex items-center gap-2">
                          {lead.classification.replace('_', ' ')}
                          {lead.score > 70 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Info Group */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados de Contato</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs">Email Comercial</Label>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="email" 
                            name="email"
                            className="pl-9"
                            placeholder="email@empresa.com"
                            value={formData.email || ''} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs">Telefone / WhatsApp</Label>
                        <div className="relative">
                          <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="phone" 
                            name="phone"
                            className="pl-9"
                            placeholder="(00) 00000-0000"
                            value={formData.phone || ''} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="website" className="text-xs">Website</Label>
                         <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="website" 
                              name="website"
                              className="pl-9"
                              placeholder="www.empresa.com.br"
                              value={formData.website || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                          {formData.website && (
                             <Button variant="outline" size="icon" asChild title="Visitar site">
                              <a href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`} target="_blank" rel="noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                   <Separator />

                  {/* Location Group */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Localização</h3>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-xs">Endereço Completo</Label>
                      <Textarea 
                        id="address" 
                        name="address"
                        className="resize-none"
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        value={formData.address || ''} 
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </div>
                  </div>

                </TabsContent>

                <TabsContent value="notes" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                  <div className="flex flex-col h-[400px]">
                     <div className="space-y-2 flex-1">
                        <Label htmlFor="notes" className="text-base font-medium flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Bloco de Notas
                        </Label>
                        <Textarea 
                          id="notes" 
                          name="notes"
                          placeholder="Digite aqui anotações sobre reuniões, dores do cliente, ou próximos passos..."
                          value={formData.notes || ''} 
                          onChange={handleInputChange}
                          className="h-full resize-none p-4 text-base leading-relaxed"
                        />
                      </div>
                  </div>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                         <Clock className="w-4 h-4" /> Agendar Follow-up
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                       <div className="flex flex-wrap gap-3 items-end">
                          <div className="grid gap-1.5 flex-1 min-w-[150px]">
                            <Label className="text-xs">Data</Label>
                            <Input type="date" />
                          </div>
                          <div className="grid gap-1.5 w-[120px]">
                             <Label className="text-xs">Horário</Label>
                            <Input type="time" />
                          </div>
                          <Button variant="secondary" className="w-full sm:w-auto">
                            Agendar
                          </Button>
                       </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="m-0 space-y-4 animate-in fade-in-50 duration-300">
                   <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-3 bg-muted/5 border-dashed">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <History className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Sem histórico recente</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                          Todas as interações, mudanças de estágio e emails enviados aparecerão aqui.
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Registrar Interação Manual
                      </Button>
                   </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-10 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
          <div className="flex w-full items-center justify-between">
             <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
             </Button>
            <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
              {isSaving ? (
                 <>
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                   Salvando...
                 </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
