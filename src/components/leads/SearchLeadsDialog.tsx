import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { searchLeads } from "@/lib/api";
import { Loader2, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface SearchLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchLeadsDialog({ open, onOpenChange }: SearchLeadsDialogProps) {
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState([20]);
  const [searchType, setSearchType] = useState<'maps' | 'intent'>('maps');
  const [days, setDays] = useState([30]);
  const [siteFilter, setSiteFilter] = useState<'all' | 'with_site' | 'without_site'>('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearch = async () => {
    // Validação básica para ambos os tipos
    if ((searchType === 'maps' && !location.trim()) || !niche.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: searchType === 'maps' ? "Preencha nicho e local." : "Preencha o termo de busca.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (searchType === 'intent') {
         // Busca de Intenção (Nova)
         const { searchIntent } = await import("@/lib/api");
         result = await searchIntent(niche, days[0]);
      } else {
         // Busca Padrão (Maps)
         const query = `${niche} em ${location}`;
         result = await searchLeads(query, limit[0], siteFilter);
      }
      toast({
        title: "Busca concluída",
        description: `${result.count || 0} leads encontrados e importados.`,
      });

      // Atualização Otimista: Força os leads a aparecerem na lista imediatamente
      if (result.leads && result.leads.length > 0) {
        const newLeads = result.leads.map((l: any, i: number) => ({
            ...l,
            // Garante campos mínimos se vierem incompletos
            id: l.id || `temp-${Date.now()}-${i}`,
            created_at: l.created_at || new Date().toISOString(),
            // Garante que o Adapter do UI consiga ler
            status: l.status || 'lead_novo',
            site_classification: l.site_classification || (l.website ? 'site_ok' : 'sem_site'),
            source: l.source || 'google_search',
        }));

        queryClient.setQueryData(['leads'], (oldData: any[]) => {
            const current = oldData || [];
            // Evita duplicatas visuais simples checando company_name
            const newUnique = newLeads.filter((n: any) => !current.some((c: any) => c.company_name === n.company_name));
            return [...newUnique, ...current];
        });
      }

      // Revalida o cache em segundo plano para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['leads'] });

      onOpenChange(false);
      setNiche("");
      setLocation("");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro na busca",
        description: error.message || "Não foi possível buscar os leads. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buscar Novos Leads</DialogTitle>
          <DialogDescription>
            Encontre empresas locais ou monitore redes sociais por oportunidades.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4 justify-center">
             <Button 
                variant={searchType === 'maps' ? "default" : "outline"}
                onClick={() => setSearchType('maps')}
                size="sm"
             >
                Google Maps (Empresas)
             </Button>
             <Button 
                variant={searchType === 'intent' ? "default" : "outline"} 
                onClick={() => setSearchType('intent')}
                size="sm"
             >
                Redes Sociais (Intenção)
             </Button>
        </div>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="niche" className="text-right">
              {searchType === 'maps' ? 'Nicho' : 'Termo'}
            </Label>
            <Input
              id="niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder={searchType === 'maps' ? "Ex: Pizzaria" : "Ex: preciso de um site"}
              className="col-span-3"
            />
          </div>

          {searchType === 'maps' && (
            <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in zoom-in slide-in-from-top-2">
                <Label htmlFor="location" className="text-right">
                Local
                </Label>
                <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: São Paulo, Centro"
                className="col-span-3"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
            </div>
          )}

          {searchType === 'intent' && (
             <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in zoom-in slide-in-from-top-2">
                <Label htmlFor="days" className="text-right">
                  Período
                </Label>
                <div className="col-span-3 flex items-center gap-4">
                  <Slider
                    id="days"
                    min={1}
                    max={90}
                    step={1}
                    value={days}
                    onValueChange={setDays}
                    className="flex-1"
                  />
                  <span className="w-24 text-sm text-muted-foreground text-right">Últimos {days[0]} dias</span>
                </div>
            </div>
          )}

          {searchType === 'maps' && (
            <>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="limit" className="text-right">
                    Qtd.
                    </Label>
                    <div className="col-span-3 flex items-center gap-4">
                    <Slider
                        id="limit"
                        min={10}
                        max={100}
                        step={10}
                        value={limit}
                        onValueChange={setLimit}
                        className="flex-1"
                    />
                    <span className="w-12 text-sm text-muted-foreground text-right">{limit[0]}</span>
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="filter" className="text-right">
                    Filtro
                    </Label>
                    <Select value={siteFilter} onValueChange={(v: any) => setSiteFilter(v)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um filtro" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="with_site">Apenas com Site</SelectItem>
                        <SelectItem value="without_site">Sem Site ou Site Ruim</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
            </>
          )}

        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSearch} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
