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
  const [siteFilter, setSiteFilter] = useState<'all' | 'with_site' | 'without_site'>('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearch = async () => {
    if (!niche.trim() || !location.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nicho e a localização.",
        variant: "destructive",
      });
      return;
    }

    const query = `${niche} em ${location}`;

    setLoading(true);
    try {
      const result = await searchLeads(query, limit[0], siteFilter);
      
      toast({
        title: "Busca concluída",
        description: `${result.count || 0} leads encontrados e importados.`,
      });

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
            Defina o nicho e a localização para encontrar leads qualificados no Google Maps.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="niche" className="text-right">
              Nicho
            </Label>
            <Input
              id="niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Ex: Pizzaria, Advogado"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="limit" className="text-right">
              Quantidade
            </Label>
            <div className="col-span-3 flex items-center gap-4">
              <Slider
                id="limit"
                min={10}
                max={60}
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
                <SelectItem value="without_site">Apenas sem Site</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
