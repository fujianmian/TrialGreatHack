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
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

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
      'bg-blue-500',      // Level 0 - Main topic
      'bg-green-500',     // Level 1 - Primary branches
      'bg-purple-500',    // Level 2 - Secondary branches
      'bg-orange-500',    // Level 3 - Tertiary branches
      'bg-pink-500',      // Level 4 - Details
      'bg-indigo-500',    // Level 5+ - More details
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  useEffect(() => {
    if (inputText.trim()) {
      generateMindMap();
    }
  }, [inputText, generateMindMap]);

  const getTextSize = (level: number) => {
    const sizes = [
      'text-lg font-bold',    // Level 0 - Main topic
      'text-base font-semibold', // Level 1 - Primary branches
      'text-sm font-medium',  // Level 2 - Secondary branches
      'text-xs font-medium',  // Level 3 - Tertiary branches
      'text-xs',              // Level 4 - Details
      'text-xs',              // Level 5+ - More details
    ];
    return sizes[Math.min(level, sizes.length - 1)];
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
          <div className="relative w-full h-96 overflow-auto border-2 border-gray-200 rounded-lg bg-gray-50">
            <svg
              className="w-full h-full"
              viewBox="0 0 800 400"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Render connections */}
              {mindMap.connections.map((connection, index) => {
                const fromNode = mindMap.nodes.find(n => n.id === connection.from);
                const toNode = mindMap.nodes.find(n => n.id === connection.to);
                
                if (!fromNode || !toNode) return null;
                
                return (
                  <line
                    key={index}
                    x1={fromNode.x + 64} // Center of node
                    y1={fromNode.y + 32}
                    x2={toNode.x + 64}
                    y2={toNode.y + 32}
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#9CA3AF"
                  />
                </marker>
              </defs>

              {/* Render nodes */}
              {mindMap.nodes.map((node) => (
                <g key={node.id}>
                  <rect
                    x={node.x}
                    y={node.y}
                    width="128"
                    height="64"
                    rx="8"
                    ry="8"
                    className={`${getNodeColor(node.level)} cursor-pointer transition-all duration-200 hover:scale-105 ${
                      selectedNode === node.id ? 'ring-4 ring-yellow-400' : ''
                    }`}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  />
                  <text
                    x={node.x + 64}
                    y={node.y + 35}
                    textAnchor="middle"
                    className={`${getTextSize(node.level)} text-white fill-current`}
                    style={{ dominantBaseline: 'middle' }}
                  >
                    {node.text.length > 15 ? `${node.text.substring(0, 15)}...` : node.text}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Node Details */}
        {selectedNode && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Node Details</h3>
            {(() => {
              const node = mindMap.nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Text: </span>
                    <span className="text-gray-600">{node.text}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Level: </span>
                    <span className="text-gray-600">{node.level}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Position: </span>
                    <span className="text-gray-600">({node.x}, {node.y})</span>
                  </div>
                  {node.children && node.children.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-700">Children: </span>
                      <span className="text-gray-600">{node.children.length}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <div key={level} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getNodeColor(level)}`}></div>
                <span className="text-sm text-gray-600">
                  Level {level}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>• Click on any node to see its details</p>
            <p>• Nodes are color-coded by hierarchy level</p>
            <p>• Arrows show relationships between concepts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
