/**
 * Strategies Page
 * 
 * Lists all user strategies and allows creating/editing/deleting them.
 * Each strategy defines how the AI should analyze markets.
 */

'use client';

import { useState } from 'react';
import { useStrategies, useCreateStrategy, useDeleteStrategy, Strategy } from '@/hooks/useStrategies';
import { cn } from '@/lib/utils';

export default function StrategiesPage() {
  const { data: strategies, isLoading, error } = useStrategies();
  const createMutation = useCreateStrategy();
  const deleteMutation = useDeleteStrategy();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    await createMutation.mutateAsync({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
    });

    setNewName('');
    setNewDescription('');
    setShowCreateForm(false);
  }

  async function handleDelete(id: string, isDefault: boolean) {
    if (isDefault) {
      alert('Cannot delete the default strategy. Set another strategy as default first.');
      return;
    }
    if (confirm('Are you sure you want to delete this strategy?')) {
      await deleteMutation.mutateAsync(id);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Strategies</h2>
          <p className="mt-1 text-muted-foreground">
            Define how the AI analyzes markets. Each strategy has its own rules and prompt.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ New Strategy'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="glass rounded-xl p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-foreground mb-4">Create New Strategy</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., ICT Silver Bullet"
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe this strategy's approach..."
                rows={3}
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending || !newName.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Strategy'}
            </button>
          </form>
        </div>
      )}

      {/* Strategies List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-destructive">Failed to load strategies. Make sure your backend and database are running.</p>
        </div>
      ) : !strategies || strategies.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-lg font-medium text-foreground mb-2">No strategies yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first strategy to define how the AI analyzes markets.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onDelete={() => handleDelete(strategy.id, strategy.is_default)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Strategy Card
// ──────────────────────────────────────────────

function StrategyCard({ strategy, onDelete }: { strategy: Strategy; onDelete: () => void }) {
  return (
    <div className="glass rounded-xl p-5 animate-fade-in hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{strategy.name}</h3>
          {strategy.is_default && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
              Default
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'h-2 w-2 rounded-full',
            strategy.is_enabled ? 'bg-bullish' : 'bg-muted-foreground'
          )} />
          <span className="text-xs text-muted-foreground">
            {strategy.is_enabled ? 'Active' : 'Disabled'}
          </span>
        </div>
      </div>

      {strategy.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {strategy.description}
        </p>
      )}

      {/* Indicators */}
      {strategy.indicators && strategy.indicators.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {strategy.indicators.slice(0, 4).map((indicator, i) => (
            <span
              key={i}
              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {indicator}
            </span>
          ))}
          {strategy.indicators.length > 4 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              +{strategy.indicators.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Rules count */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{strategy.entry_rules?.length || 0} entry rules</span>
        <span>{strategy.exit_rules?.length || 0} exit rules</span>
        <span>{strategy.risk_rules?.length || 0} risk rules</span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
        <button className="text-xs text-primary hover:text-primary/80 transition-colors">
          Edit
        </button>
        {!strategy.is_default && (
          <button
            onClick={onDelete}
            className="text-xs text-destructive hover:text-destructive/80 transition-colors ml-auto"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
