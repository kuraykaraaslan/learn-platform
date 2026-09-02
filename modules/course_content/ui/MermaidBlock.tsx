// docs/phases/07-mermaid.md — "don't assume Mermaid" was correct when
// written (the roadmap measured a ~40KB client JS cost on every lesson page,
// since there was nowhere to put an island inside prose). P0's block split
// removed that constraint: this component's own module never imports
// 'mermaid' at the top level, only inside the effect below, once the block
// has actually scrolled into view. A page with no mermaid fence never runs
// that import, so it ships zero bytes of the library.
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/modules/shared/useMounted';

type RenderState =
  | { status: 'pending' }
  | { status: 'rendered'; svg: string }
  | { status: 'error'; message: string };

let mermaidIdCounter = 0;

export function MermaidBlock({ source, html }: { source: string; html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [intersected, setIntersected] = useState(false);
  const [state, setState] = useState<RenderState>({ status: 'pending' });
  const { resolvedTheme } = useTheme();

  // A browser with no IntersectionObserver gets the diagram immediately, but
  // that has to be decided after mount, not during render: the server has no
  // IntersectionObserver either, and reading it during the hydrating render
  // would make the two passes disagree.
  const mounted = useMounted();
  const visible = intersected || (mounted && typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return; // handled by `visible` above
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIntersected(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: resolvedTheme === 'dark' ? 'dark' : 'default' });
        const id = `mermaid-diagram-${mermaidIdCounter++}`;
        const { svg } = await mermaid.render(id, source);
        if (!cancelled) setState({ status: 'rendered', svg });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Diagram failed to render.',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-runs (and re-renders) on a theme change, matching mermaid's own
    // baked-in-at-render-time colors — a stale-themed diagram left over
    // from before a toggle would be wrong, not just unstyled.
  }, [visible, resolvedTheme, source]);

  return (
    <div ref={containerRef} className="mb-3">
      {state.status === 'error' && (
        <p className="mb-2 rounded-md border border-error bg-error-subtle px-3 py-2 text-xs text-error-fg">
          Diagram failed to render: {state.message}
        </p>
      )}
      {state.status === 'rendered' ? (
        // eslint-disable-next-line react/no-danger -- svg from our own mermaid.render() call, not user input
        <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: state.svg }} />
      ) : (
        // Source stays visible as literal text until (or unless) mermaid
        // loads and renders successfully — a reader with JS off, or mid
        // page-load, or hitting a parse error still gets the diagram's
        // definition, not a silent blank.
        // eslint-disable-next-line react/no-danger -- block.html is our own build-time markdown pipeline output, not user input
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}
