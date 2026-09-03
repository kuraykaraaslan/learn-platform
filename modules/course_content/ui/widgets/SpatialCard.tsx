// P14 (docs/phases/14-bim-ifc-data-models.md): an IFC spatial tree the reader
// can walk, with the teaching error sitting on an EDGE rather than in a node
// label — which is the whole reason this is not a mermaid diagram. The `rel`
// chip beside each node names the actual IFC relationship entity holding it
// there, because "which relationship puts this element somewhere" is the
// question four courses in this branch keep coming back to.
//
// Gate: an `ask` is an exercise, so it obeys the same stopping rule QuizCard
// and RecallCard do and never opens on an unverified lesson — but the TREE is
// not an exercise, so it still renders there in full. That is the difference
// from the two cards above, which return null outright: a dark widget would
// be worse than an ungated reference tree.
//
// Nothing here reaches the progress store. An open node is a reading position,
// not progress (docs/phases/README.md invariant #4), and PersistedProgress's
// key set is deliberately guarded by progress.store.test.ts.
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import type { SpatialNode, SpatialRel, SpatialWidget } from '../../course_content.spatial';
import { WidgetShell } from '../WidgetShell';
import { canReveal, charsRemaining } from '../reveal-gate';
import { BTN_PRIMARY, FIELD, FOCUS_RING } from '../widget-ui';

/** The IFC entity behind each `rel`. This is the lesson, not decoration:
 *  containment and aggregation look alike in a viewer and behave differently
 *  in every per-storey take-off. */
const REL_ENTITY: Record<SpatialRel, string> = {
  aggregates: 'IfcRelAggregates',
  contained: 'IfcRelContainedInSpatialStructure',
  voids: 'IfcRelVoidsElement',
  fills: 'IfcRelFillsElement',
  nests: 'IfcRelNests',
  assigns: 'IfcRelAssignsToGroup',
};

const FLAG_ROW: Record<string, string> = {
  focus: 'bg-primary/10 ring-1 ring-primary',
  good: 'bg-success-subtle',
  bad: 'bg-error-subtle',
};

// CSS-drawn, never an inline <svg> — WidgetShell.tsx's own rule, and
// MermaidBlock.test.ts asserts no '<svg' in server-rendered lesson markup.
const CARET = 'inline-block size-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-current transition-transform';
const LEAF = 'inline-block h-px w-[5px] bg-current';

function NodeView({
  node,
  collapsed,
  onToggle,
}: {
  node: SpatialNode;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
}) {
  const children = node.children ?? [];
  const open = children.length > 0 && !collapsed.has(node.id);

  return (
    <li className="relative">
      <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-sm px-1 py-0.5', node.flag && FLAG_ROW[node.flag])}>
        {children.length > 0 ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}
            className={cn('shrink-0 rounded-sm px-0.5 text-text-secondary hover:text-text-primary', FOCUS_RING)}
          >
            <span aria-hidden="true" className={cn(CARET, open && 'rotate-90')} />
          </button>
        ) : (
          <span aria-hidden="true" className={cn('shrink-0 px-0.5 text-text-disabled', LEAF)} />
        )}
        <code className="font-mono text-xs text-text-primary">{node.type}</code>
        <span className="text-xs text-text-secondary">{node.name}</span>
        {node.rel && (
          <span className="rounded-sm border border-border px-1 font-mono text-[10px] text-text-secondary">
            {REL_ENTITY[node.rel]}
          </span>
        )}
      </div>

      {node.props && node.props.length > 0 && (
        <ul className="ml-4 border-l border-border pl-3">
          {node.props.map((p, i) => (
            <li key={i} className="py-0.5 font-mono text-[11px] text-text-secondary">
              {p.set}.{p.name} = <span className="text-text-primary">{p.value}</span>
              {p.inherited && <span className="ml-1 not-italic text-text-disabled">(inherited from type)</span>}
            </li>
          ))}
        </ul>
      )}

      {open && (
        <ul className="ml-4 border-l border-border pl-3">
          {children.map((child) => (
            <NodeView key={child.id} node={child} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SpatialCard({ widget, verified }: { widget: SpatialWidget; verified: boolean }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);

  // An `ask` is an exercise; the tree is not. Only the first half is gated.
  const gated = widget.ask !== undefined && widget.reveal !== undefined && verified;

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <WidgetShell kind="spatial" status={gated ? (revealed ? 'revealed' : 'answer hidden') : undefined}>
      <p className="mb-2 text-sm font-medium text-text-primary">{widget.title}</p>

      {gated && !revealed && (
        <div className="mb-3">
          <p className="mb-1 text-sm text-text-primary">{widget.ask}</p>
          <textarea
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            rows={2}
            placeholder="Answer from the tree below before revealing…"
            className={cn(FIELD, 'resize-y p-2')}
          />
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={!canReveal(guess)}
            className={cn(BTN_PRIMARY, 'mt-2')}
          >
            Show
          </button>
          {!canReveal(guess) && guess.length > 0 && (
            <p className="mt-1 text-xs text-text-secondary">{charsRemaining(guess)} more characters</p>
          )}
        </div>
      )}

      {gated && revealed && (
        <div className="mb-3">
          <p className="mb-1 text-xs text-text-secondary">You said:</p>
          <p className="mb-2 whitespace-pre-wrap rounded-md border border-border bg-surface-overlay p-2 text-sm text-text-primary">
            {guess}
          </p>
          <p className="rounded-md border border-primary bg-primary/10 p-2 text-sm text-text-primary">{widget.reveal}</p>
        </div>
      )}

      <ul className="font-sans">
        <NodeView node={widget.root} collapsed={collapsed} onToggle={toggle} />
      </ul>
    </WidgetShell>
  );
}
