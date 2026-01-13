import { Bell, Search, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/mode-toggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddLead?: () => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

const Header = ({ title, subtitle, onAddLead, searchTerm, onSearchChange }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads por nome, email..."
              className="pl-10 pr-8 bg-secondary/50 border-0 focus-visible:ring-1"
              value={searchTerm || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
                <span className="sr-only">Limpar busca</span>
              </button>
            )}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          <ModeToggle />

          {/* Add Lead */}
          {onAddLead && (
            <Button onClick={onAddLead} variant="gradient">
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
