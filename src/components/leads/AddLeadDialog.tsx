import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useCreateLead, useImportLeads } from '@/hooks/useLeads';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    website: '',
    segment: '',
    city: '',
  });

  const createLead = useCreateLead();
  const importLeads = useImportLeads();

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) return;

    await createLead.mutateAsync(formData);
    setFormData({ company_name: '', email: '', phone: '', website: '', segment: '', city: '' });
    onOpenChange(false);
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) return;

    await importLeads.mutateAsync({ csvText, source: 'csv_import' });
    setCsvText('');
    onOpenChange(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Lead</DialogTitle>
          <DialogDescription>
            Adicione leads manualmente ou importe via CSV
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="csv">Importar CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Empresa *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Nome da empresa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segment">Segmento</Label>
                  <Input
                    id="segment"
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    placeholder="Ex: Restaurantes"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="www.empresa.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createLead.isPending}>
                {createLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Lead
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Arquivo CSV</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar arquivo CSV
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv">Ou cole o conteúdo CSV</Label>
              <Textarea
                id="csv"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="empresa,email,telefone,website,segmento,cidade&#10;Empresa A,contato@a.com,11999999999,www.a.com,Restaurante,São Paulo"
                className="h-32 font-mono text-xs"
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Colunas aceitas: empresa, email, telefone, website, segmento, cidade</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleCsvImport}
              disabled={!csvText.trim() || importLeads.isPending}
            >
              {importLeads.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar Leads
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
