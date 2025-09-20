'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  parent?: string;
  children?: string[];
}

interface MindMapResponse {
  nodes: MindMapNode[];
  connections: Array<{
    from: string;
    to: string;
  }>;
  title: string;
}

interface TextToMapProps {
  inputText: string;
  onBack: () => void;
}

export default function TextToMap({ inputText, onBack }: TextToMapProps) {
  const [mindMap, setMindMap] = useState<MindMapResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const generateMindMap = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mind map');
      }

      const data = await response.json();
      setMindMap(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, [inputText]);

  const getNodeColor = (level: number) => {
    const colors = [
      'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg',     // Level 0 - Main topic
      'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md',         // Level 1 - Primary branches
      'bg-gradient-to-br from-green-500 to-green-600 shadow-md',       // Level 2 - Secondary branches
      'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-sm',     // Level 3 - Tertiary branches
      'bg-gradient-to-br from-red-500 to-red-600 shadow-sm',           // Level 4 - Details
      'bg-gradient-to-br from-gray-500 to-gray-600 shadow-sm',         // Level 5+ - More details
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  useEffect(() => {
    if (inputText.trim()) {
      generateMindMap();
    }
  }, [inputText, generateMindMap]);

  const getTextSize = (level: number) => {
    // All nodes same text size regardless of level
    return 'text-sm font-medium';
  };

  const getNodeSize = (level: number) => {
    // All nodes same circular size regardless of level
    return { radius: 60 };
  };

  const getMaxTextLength = (level: number) => {
    // All nodes same text length limit regardless of level
    return 25;
  };

  const fitTextToNode = (text: string, level: number) => {
    const nodeSize = getNodeSize(level);
    const maxLength = getMaxTextLength(level);
    
    // If text fits within limits, return as is
    if (text.length <= maxLength) {
      return { text, fontSize: getTextSize(level) };
    }
    
    // Use smaller font size for long text (same for all levels)
    const fontSize = 'text-xs font-medium';
    
    // If still too long, truncate but with more characters
    const extendedLength = maxLength + 5;
    const finalText = text.length > extendedLength ? `${text.substring(0, extendedLength)}...` : text;
    
    return { text: finalText, fontSize };
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) { // Only start dragging on SVG background, not on nodes
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPanX(prev => prev - deltaX / zoom);
      setPanY(prev => prev - deltaY / zoom);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const improveNodeSpacing = (nodes: MindMapNode[]) => {
    const horizontalSpacing = 80; // Minimum horizontal spacing between circular nodes
    const verticalSpacing = 100;  // Minimum vertical spacing between levels
    const improvedNodes = [...nodes];
    
    // Group nodes by level for better spacing
    const nodesByLevel = improvedNodes.reduce((acc, node) => {
      if (!acc[node.level]) acc[node.level] = [];
      acc[node.level].push(node);
      return acc;
    }, {} as Record<number, MindMapNode[]>);
    
    // Apply horizontal spacing to each level
    Object.values(nodesByLevel).forEach(levelNodes => {
      // Sort nodes by x position
      levelNodes.sort((a, b) => a.x - b.x);
      
      // Apply minimum horizontal spacing for circular nodes
      for (let i = 1; i < levelNodes.length; i++) {
        const prevNode = levelNodes[i - 1];
        const currentNode = levelNodes[i];
        const nodeRadius = getNodeSize(prevNode.level).radius;
        
        const minDistance = (nodeRadius * 2) + horizontalSpacing;
        const currentDistance = currentNode.x - prevNode.x;
        
        if (currentDistance < minDistance) {
          const adjustment = minDistance - currentDistance;
          // Move all subsequent nodes
          for (let j = i; j < levelNodes.length; j++) {
            const nodeIndex = improvedNodes.findIndex(n => n.id === levelNodes[j].id);
            if (nodeIndex !== -1) {
              improvedNodes[nodeIndex].x += adjustment;
            }
          }
        }
      }
    });
    
    // Apply vertical spacing between levels
    const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < levels.length; i++) {
      const prevLevel = levels[i - 1];
      const currentLevel = levels[i];
      
      const prevLevelNodes = nodesByLevel[prevLevel];
      const currentLevelNodes = nodesByLevel[currentLevel];
      
      if (prevLevelNodes && currentLevelNodes) {
        const nodeRadius = getNodeSize(prevLevelNodes[0].level).radius;
        const minPrevY = Math.min(...prevLevelNodes.map(n => n.y));
        const maxPrevY = Math.max(...prevLevelNodes.map(n => n.y + (nodeRadius * 2)));
        const minCurrentY = Math.min(...currentLevelNodes.map(n => n.y));
        
        const currentDistance = minCurrentY - maxPrevY;
        if (currentDistance < verticalSpacing) {
          const adjustment = verticalSpacing - currentDistance;
          currentLevelNodes.forEach(node => {
            const nodeIndex = improvedNodes.findIndex(n => n.id === node.id);
            if (nodeIndex !== -1) {
              improvedNodes[nodeIndex].y += adjustment;
            }
          });
        }
      }
    }
    
    return improvedNodes;
  };

  const centerMindMap = () => {
    if (!mindMap || !mindMap.nodes.length) return mindMap;
    
    // First improve spacing
    const spacedNodes = improveNodeSpacing(mindMap.nodes);
    
    // Calculate bounding box of all circular nodes with padding
    const nodePositions = spacedNodes.map(node => {
      const nodeSize = getNodeSize(node.level);
      const radius = nodeSize.radius;
      return {
        x: node.x - radius,
        y: node.y - radius,
        width: radius * 2,
        height: radius * 2
      };
    });
    
    const minX = Math.min(...nodePositions.map(n => n.x));
    const maxX = Math.max(...nodePositions.map(n => n.x + n.width));
    const minY = Math.min(...nodePositions.map(n => n.y));
    const maxY = Math.max(...nodePositions.map(n => n.y + n.height));
    
    const currentWidth = maxX - minX;
    const currentHeight = maxY - minY;
    
    // SVG viewport dimensions - larger for better visibility
    const svgWidth = 1400;  // Increased width
    const svgHeight = 800;  // Increased height
    
    // Add padding to ensure nodes aren't cut off
    const padding = 50;
    const effectiveWidth = svgWidth - (padding * 2);
    const effectiveHeight = svgHeight - (padding * 2);
    
    // Calculate offset to center the mindmap with padding
    const offsetX = (effectiveWidth - currentWidth) / 2 - minX + padding;
    const offsetY = (effectiveHeight - currentHeight) / 2 - minY + padding;
    
    // Return centered mindmap with improved spacing
    return {
      ...mindMap,
      nodes: spacedNodes.map(node => ({
        ...node,
        x: node.x + offsetX,
        y: node.y + offsetY
      }))
    };
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Generating Mind Map</h2>
          <p className="text-gray-600">Please wait while we analyze your text and create a visual mind map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Generating Mind Map</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-gray-400 text-6xl mb-6">🧠</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Mind Map Available</h2>
          <p className="text-gray-600 mb-6">Unable to generate mind map for the provided text.</p>
          <button
            onClick={onBack}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Mind Map</h1>
            <button
              onClick={onBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{mindMap.title}</h2>
            <p className="text-gray-600">Interactive mind map generated from your text</p>
          </div>
        </div>

        {/* Mind Map Visualization */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          
          <div className="relative w-full h-[600px] overflow-hidden border-2 border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-blue-50">
            {(() => {
              const centeredMindMap = centerMindMap();
              
              if (!centeredMindMap) return null;
              
              return (
                <svg
                  className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
                  viewBox={`${panX} ${panY} ${1400 / zoom} ${800 / zoom}`}
                  preserveAspectRatio="xMidYMid meet"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  style={{ userSelect: 'none' }}
                >
                  {/* Render connections */}
                  {centeredMindMap.connections.map((connection, index) => {
                    const fromNode = centeredMindMap.nodes.find(n => n.id === connection.from);
                    const toNode = centeredMindMap.nodes.find(n => n.id === connection.to);
                    
                    if (!fromNode || !toNode) return null;
                    
                    const fromNodeSize = getNodeSize(fromNode.level);
                    const toNodeSize = getNodeSize(toNode.level);
                    const fromCenterX = fromNode.x;
                    const fromCenterY = fromNode.y;
                    const toCenterX = toNode.x;
                    const toCenterY = toNode.y;
                    
                    return (
                      <line
                        key={index}
                        x1={fromCenterX}
                        y1={fromCenterY}
                        x2={toCenterX}
                        y2={toCenterY}
                        stroke="#4F46E5"
                        strokeWidth="2"
                        strokeOpacity="0.7"
                        markerEnd="url(#arrowhead)"
                        className="drop-shadow-sm"
                      />
                    );
                  })}
              
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 6 2, 0 4"
                    fill="#4F46E5"
                    fillOpacity="0.6"
                  />
                </marker>
              </defs>

                  {/* Render nodes */}
                  {centeredMindMap.nodes.map((node) => {
                    const nodeSize = getNodeSize(node.level);
                    const radius = nodeSize.radius;
                    const centerX = node.x;
                    const centerY = node.y;
                    const { text: displayText, fontSize } = fitTextToNode(node.text, node.level);
                    
                    return (
                      <g key={node.id}>
                        <circle
                          cx={centerX}
                          cy={centerY}
                          r={radius}
                          className={`${getNodeColor(node.level)} transition-all duration-200 hover:scale-105 hover:shadow-xl`}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))';
                          }}
                          filter="drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
                        />
                        <text
                          x={centerX}
                          y={centerY}
                          textAnchor="middle"
                          className={`${fontSize} text-white fill-current`}
                          style={{ 
                            dominantBaseline: 'middle',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                            fontWeight: 'bold'
                          }}
                        >
                          <tspan x={centerX} dy="0">
                            {displayText}
                          </tspan>
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
        </div>


      </div>
    </div>
  );
}
