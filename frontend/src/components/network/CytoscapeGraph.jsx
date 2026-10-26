import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function CytoscapeGraph({ 
  elements = [], 
  layoutName = 'cose', 
  onSelectNode,
  focusMmsi 
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#F1F5F9',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': '6px',
            'background-color': '#0B1220',
            'border-width': 2.5,
            'border-color': (ele) => {
              const tier = ele.data('riskTier');
              if (tier === 'CRITICAL_MONITORING') return '#FF5C65';
              if (tier === 'ELEVATED_ATTENTION') return '#F5B942';
              if (tier === 'MODERATE_INTERACTION') return '#4285F4';
              return '#39D98A';
            },
            'width': (ele) => {
              const betw = ele.data('betweenness') || 0;
              return 32 + Math.min(betw * 60, 40);
            },
            'height': (ele) => {
              const betw = ele.data('betweenness') || 0;
              return 32 + Math.min(betw * 60, 40);
            },
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': '0.3s',
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#20D5E8',
            'border-width': 4,
            'background-color': '#162338',
            'color': '#20D5E8',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele) => {
              const count = ele.data('count') || 1;
              return Math.min(1.5 + count * 0.7, 5);
            },
            'line-color': (ele) => {
              const risk = ele.data('risk') || 0.5;
              if (risk >= 0.75) return '#FF5C65';
              if (risk >= 0.5) return '#F5B942';
              return '#243249';
            },
            'curve-style': 'bezier',
            'opacity': 0.75,
            'line-style': (ele) => {
              const type = ele.data('interactionType');
              if (type === 'PROXIMITY_EVENT') return 'dashed';
              if (type === 'TUG_SUPPORT') return 'dotted';
              return 'solid';
            }
          }
        },
        {
          selector: '.highlighted',
          style: {
            'opacity': 1,
            'line-color': '#20D5E8',
            'border-color': '#20D5E8',
            'border-width': 4,
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.15,
          }
        }
      ],
      layout: {
        name: layoutName,
        padding: 40,
        animate: true,
        animationDuration: 600,
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onSelectNode) onSelectNode(node.data());

      cy.elements().removeClass('highlighted dimmed');
      const neighborhood = node.neighborhood().add(node);
      cy.elements().difference(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted dimmed');
        if (onSelectNode) onSelectNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [elements, layoutName, onSelectNode]);

  // Focus node if requested
  useEffect(() => {
    if (!focusMmsi || !cyRef.current) return;
    const node = cyRef.current.getElementById(focusMmsi);
    if (node && node.length > 0) {
      cyRef.current.elements().removeClass('highlighted dimmed');
      const neighborhood = node.neighborhood().add(node);
      cyRef.current.elements().difference(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
      cyRef.current.animate({
        center: { eles: node },
        zoom: 1.5,
        duration: 500,
      });
      if (onSelectNode) onSelectNode(node.data());
    }
  }, [focusMmsi, onSelectNode]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}
