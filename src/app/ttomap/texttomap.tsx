'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  inputText?: string;
  searchParams?: Promise<{ text?: string }>;
  onBack?: () => void;
  userEmail?: string;
}

export default function TextToMap({ inputText, searchParams, onBack, userEmail }: TextToMapProps) {
  const [mindMap, setMindMap] = useState<MindMapResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  // Removed dragging state - circles will stay fixed
  const [urlText, setUrlText] = useState<string>('');
  
  // Refs to prevent duplicate generation
  const hasGeneratedRef = useRef(false);
  const generatingRef = useRef(false);

  // Handle searchParams
  useEffect(() => {
    if (searchParams) {
      searchParams.then(params => {
        setUrlText(params.text || '');
      });
    }
  }, [searchParams]);

  // Check for sessionStorage data from history
  useEffect(() => {
    const savedInput = sessionStorage.getItem('mindmapInput');
    const shouldRegenerate = sessionStorage.getItem('regenerateMindmap');
    
    if (savedInput && shouldRegenerate === 'true') {
      console.log('[TextToMap] Loading from history:', savedInput);
      setUrlText(savedInput);
      // Clear the flags
      sessionStorage.removeItem('mindmapInput');
      sessionStorage.removeItem('regenerateMindmap');
    }
  }, []);

  // Determine the final input text
  const finalInputText = inputText || urlText;

  const generateMindMap = useCallback(async () => {
    // Prevent duplicate generation
    if (generatingRef.current || hasGeneratedRef.current) {
      console.log('[TextToMap] Mindmap generation already in progress or completed, skipping...');
      return;
    }
    
    generatingRef.current = true;
    setIsGenerating(true);
    setError(null);

    try {
      // Generate unique request ID
      const requestId = `mindmap-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`[TextToMap] Starting mindmap generation with requestId: ${requestId}`);
      
      const response = await fetch('/api/mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: finalInputText,
          userEmail: userEmail || 'anonymous@example.com',
          requestId: requestId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mind map');
      }

      const data = await response.json();
      
      // Validate the response structure
      if (data.result && data.result.nodes && Array.isArray(data.result.nodes)) {
        setMindMap(data.result);
        console.log('[TextToMap] Mindmap generation successful');
      } else {
        throw new Error('Invalid mindmap data structure received');
      }
      
      hasGeneratedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('[TextToMap] Error generating mindmap:', err);
    } finally {
      setIsGenerating(false);
      generatingRef.current = false;
    }
  }, [finalInputText, userEmail]);

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
    if (finalInputText && finalInputText.trim()) {
      generateMindMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalInputText]);

  const getTextSize = (level: number) => {
    // All nodes same text size regardless of level
    return 'text-sm font-medium';
  };

  const getNodeSize = (level: number) => {
    // All nodes same circular size regardless of level - increased size for better text fitting
    return { radius: 80 };
  };

  const getMaxTextLength = (level: number) => {
    // All nodes same text length limit regardless of level - increased for larger circles
    return 35;
  };

  const fitTextToNode = (text: string, level: number) => {
    if (!text) return { text: '', fontSize: getTextSize(level) };
    
    const nodeSize = getNodeSize(level);
    const maxLength = getMaxTextLength(level);
    
    // If text fits within limits, return as is
    if (text.length <= maxLength) {
      return { text, fontSize: getTextSize(level) };
    }
    
    // Try with smaller font size first
    const smallFontSize = 'text-xs font-medium';
    
    // For larger circles, allow more text even with small font
    const extendedLength = maxLength + 10; // Increased from 5 to 10
    
    // If text is still too long even with extended length, truncate
    const finalText = text.length > extendedLength ? `${text.substring(0, extendedLength)}...` : text;
    
    return { text: finalText, fontSize: smallFontSize };
  };


  // Removed mouse event handlers - circles will stay fixed

  const improveNodeSpacing = (nodes: MindMapNode[]) => {
    if (!nodes || !Array.isArray(nodes)) return [];
    
    const horizontalSpacing = 100; // Minimum horizontal spacing between circular nodes (increased for larger circles)
    const verticalSpacing = 180;  // Minimum vertical spacing between levels (further increased for more vertical space)
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
    if (!mindMap || !mindMap.nodes || !mindMap.nodes.length) return mindMap;
    
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
    
        // SVG viewport dimensions - larger for better visibility with bigger circles and more vertical space
        const svgWidth = 1800;  // Increased width to prevent cropping
        const svgHeight = 1500;  // Further increased height to prevent bottom cropping

    // Add more padding to ensure nodes aren't cut off
    const padding = 150;
    const effectiveWidth = svgWidth - (padding * 2);
    const effectiveHeight = svgHeight - (padding * 2);
    
    // Calculate offset to center the mindmap properly
    const centerOffsetX = (svgWidth - currentWidth) / 2 - minX;
    const centerOffsetY = (svgHeight - currentHeight) / 2 - minY;
    
    // Ensure minimum padding from edges while maintaining center
    const finalOffsetX = Math.max(centerOffsetX, padding);
    const finalOffsetY = Math.max(centerOffsetY, padding);
    
    // Return centered mindmap with improved spacing and guaranteed padding
    return {
      ...mindMap,
      nodes: spacedNodes.map(node => ({
        ...node,
        x: node.x + finalOffsetX,
        y: node.y + finalOffsetY
      }))
    };
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Mind Map</h1>
            <button
              onClick={onBack || (() => window.history.back())}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{mindMap.title || 'Mind Map'}</h2>
            <p className="text-gray-600">Interactive mind map generated from your text</p>
          </div>
        </div>

        {/* Mind Map Visualization */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          
          <div className="relative w-full h-[800px] overflow-auto border-2 border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-blue-50 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            {(() => {
              const centeredMindMap = centerMindMap();
              
              if (!centeredMindMap) return null;
              
              return (
                <svg
                  className="select-none"
                  width="1800"
                  height="1500"
                  viewBox="0 0 1800 1500"
              preserveAspectRatio="xMidYMid meet"
                  style={{ userSelect: 'none', minWidth: '1800px', minHeight: '1500px' }}
            >
              {/* Render connections */}
                  {centeredMindMap.connections && centeredMindMap.connections.map((connection, index) => {
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
                  {centeredMindMap.nodes && centeredMindMap.nodes.map((node) => {
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
                          className={`${getNodeColor(node.level)}`}
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
