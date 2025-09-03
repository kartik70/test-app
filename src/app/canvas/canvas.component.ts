// diagram.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxGraphModule, Node, Edge, ClusterNode } from '@swimlane/ngx-graph';
import { Subject } from 'rxjs';
import * as shape from 'd3-shape';

interface DiagramNode extends Node {
  data: {
    color?: string;
  };
}

interface DiagramEdge extends Edge {
  data?: any;
}

@Component({
  selector: 'app-diagram',
  standalone: true,
  imports: [CommonModule, NgxGraphModule],
  template: `
    <div class="diagram-container">
      <ngx-graph
        class="chart-container"
        [nodes]="nodes"
        [links]="links"
        [clusters]="clusters"
        [curve]="curve"
        [draggingEnabled]="false"
        [panningEnabled]="false"
        [enableZoom]="true"
        [enableZoom]="false"
        [autoZoom]="false"
        [autoCenter]="true"
        [update$]="update$"
        layout="dagre"
        [layoutSettings]="layoutSettings">

        <!-- Custom node template -->
        <ng-template #nodeTemplate let-node>
          <svg:g class="node">
            <svg:rect
              [attr.width]="nodeWidth"
              [attr.height]="nodeHeight"
              [attr.x]="0"
              [attr.y]="0"
              [attr.fill]="node.data?.color || '#ffffff'"
              class="node-rect"
              rx="8"
              ry="8" />
            <svg:text
              class="node-icon"
              text-anchor="middle"
              dominant-baseline="central"
              dy="10">+</svg:text>
            <svg:text
              class="node-label"
              text-anchor="middle"
              [attr.y]="nodeHeight/2 + 20"
              dy="0">{{ node.label }}</svg:text>
          </svg:g>
        </ng-template>

        <!-- Custom link template with plus icon -->
        <ng-template #linkTemplate let-link>
          <svg:g class="edge">
            <svg:path
              class="line"
              stroke-width="2"
              [attr.d]="link.line"
              marker-end="url(#arrowhead)" />
            
            <!-- Plus icon in the middle of the link -->
            <svg:circle
              [attr.cx]="getLinkMidpoint(link).x"
              [attr.cy]="getLinkMidpoint(link).y"
              r="12"
              class="link-icon-bg" />
            <svg:text
              [attr.x]="getLinkMidpoint(link).x"
              [attr.y]="getLinkMidpoint(link).y"
              class="link-icon"
              text-anchor="middle"
              dominant-baseline="central"
              dy="1">+</svg:text>
          </svg:g>
        </ng-template>

        <!-- Defs template for arrow markers -->
        <ng-template #defsTemplate>
          <svg:defs>
            <svg:marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="0"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth">
              <svg:polygon
                points="0,0 8,3 0,6"
                fill="#4A90E2" />
            </svg:marker>
          </svg:defs>
        </ng-template>
      </ngx-graph>
    </div>
  `,
  styles: [`
    .diagram-container {
      width: 100%;
      height: 100vh;
      background: #f0f2f5;
      overflow: hidden;
    }

    .chart-container {
      width: 100%;
      height: 100%;
    }

    .node-rect {
      stroke: #4A90E2;
      stroke-width: 2;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      transition: all 0.3s ease;
    }

    .node-icon {
      font-family: 'Arial', sans-serif;
      font-size: 24px;
      font-weight: bold;
      fill: #4A90E2;
      pointer-events: none;
    }

    .node-label {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      font-weight: 500;
      fill: #333;
      pointer-events: none;
    }

    .line {
      fill: none;
      stroke: #4A90E2;
      stroke-linecap: round;
    }

    .link-icon-bg {
      fill: #ffffff;
      stroke: #4A90E2;
      stroke-width: 2;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }

    .link-icon {
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      font-weight: bold;
      fill: #4A90E2;
      pointer-events: none;
    }

    .node:hover .node-rect {
      stroke: #2171b5;
      stroke-width: 3;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

    /* Custom styling for ngx-graph */
    ::ng-deep .ngx-graph {
      background: transparent !important;
    }

    ::ng-deep .pan-zoom-frame {
      background: transparent !important;
    }
  `]
})
export class DiagramComponent implements OnInit {
  nodeWidth = 120;
  nodeHeight = 70;

  // Nodes matching the image layout with appropriate colors
  nodes: DiagramNode[] = [
    {
      id: 'start',
      label: 'Start',
      data: { color: '#a8c8ec' },
      dimension: { width: this.nodeWidth, height: this.nodeHeight }
    },
    {
      id: 'processA',
      label: 'Process A',
      data: { color: '#d4a5d1' },
      dimension: { width: this.nodeWidth, height: this.nodeHeight }
    },
    {
      id: 'processB',
      label: 'Process B',
      data: { color: '#87ceeb' },
      dimension: { width: this.nodeWidth, height: this.nodeHeight }
    },
    {
      id: 'decision',
      label: 'Decision',
      data: { color: '#cd5c5c' },
      dimension: { width: this.nodeWidth, height: this.nodeHeight }
    },
    {
      id: 'processC',
      label: 'Process C',
      data: { color: '#87ceeb' },
      dimension: { width: this.nodeWidth, height: this.nodeHeight }
    },
    {
      id: 'processD',
      label: 'Process D',
      data: { color: '#cd5c5c' },
      dimension: { width: this.nodeWidth, height: this.nodeHeight }
    },
    {
      id: 'end',
      label: 'End',
      data: { color: '#87ceeb' },
      dimension: { width: this.nodeWidth, height: this.nodeHeight }
    }
  ];

  // Complex workflow connections matching the image
  links: DiagramEdge[] = [
    { id: 'link1', source: 'start', target: 'processA' },
    { id: 'link2', source: 'processA', target: 'processB' },
    { id: 'link3', source: 'processB', target: 'decision' },
    { id: 'link4', source: 'decision', target: 'processC' },
    { id: 'link5', source: 'decision', target: 'processD' },
    { id: 'link6', source: 'processC', target: 'end' },
    { id: 'link7', source: 'processD', target: 'end' },
    { id: 'link8', source: 'start', target: 'decision' }, // Direct path
    { id: 'link9', source: 'processA', target: 'processD' } // Cross connection
  ];

  clusters: ClusterNode[] = [];

  // Layout configuration for dagre
  layoutSettings = {
  rankdir: 'LR',
  ranksep: 120,
  nodesep: 80,
  edgesep: 30,
  marginx: 20,
  marginy: 20
};

  layouts: any = {};

  // Smooth curve for connectors
  curve = shape.curveBundle.beta(1);

  // Subjects for graph updates
  zoomToFit$ = new Subject<boolean>();
  update$ = new Subject<boolean>();

  ngOnInit(): void {
    // Initialize the graph layout
    setTimeout(() => {
      this.update$.next(true);
      this.zoomToFit$.next(true);
    }, 200);
  }

  // Calculate midpoint of a link for placing plus icon
  getLinkMidpoint(link: any): { x: number, y: number } {
    if (!link.points || link.points.length < 2) {
      return { x: 0, y: 0 };
    }

    // Get the middle point of the path
    const points = link.points;
    const midIndex = Math.floor(points.length / 2);
    
    if (points[midIndex]) {
      return {
        x: points[midIndex].x,
        y: points[midIndex].y
      };
    }

    // Fallback to simple midpoint calculation
    const start = points[0];
    const end = points[points.length - 1];
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
  }
}

