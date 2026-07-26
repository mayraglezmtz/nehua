'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  BackgroundVariant,
  ConnectionMode
} from 'reactflow'
import { motion, AnimatePresence } from 'framer-motion'
import { ArchitectureNode } from './architecture-node'
import { CustomEdge, edgeTypes } from './custom-edge'
import { ArchitectureNode as NodeType, ArchitectureEdge, AnalysisResult } from '@/types'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download, 
  RefreshCw,
  Eye,
  EyeOff,
  Info,
  X
} from 'lucide-react'
import { Button } from './ui/button'

interface ArchitectureDiagramProps {
  analysisResult: AnalysisResult
  onNodeSelect?: (node: NodeType) => void
  onNodeExplain?: (node: NodeType) => void
}

// Node types configuration for React Flow
const nodeTypes = {
  architectureNode: ArchitectureNode,
}

function ArchitectureDiagramContent({ 
  analysisResult, 
  onNodeSelect, 
  onNodeExplain 
}: ArchitectureDiagramProps) {
  const reactFlow = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [highlightedPath, setHighlightedPath] = useState<string[]>([])
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showBackground, setShowBackground] = useState(true)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  
  // Convert analysis result to React Flow format
  useEffect(() => {
    if (!analysisResult.nodes || !analysisResult.edges) return

    // Convert nodes
    const flowNodes: Node[] = analysisResult.nodes.map((node) => ({
      id: node.id,
      type: 'architectureNode',
      position: node.position,
      data: {
        ...node.data,
        label: node.label,
        type: node.type,
        description: node.description,
        selected: node.id === selectedNodeId,
        onSelect: () => handleNodeSelect(node),
        onExplain: () => handleNodeExplain(node)
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
      }
    }))

    // Convert edges with styling
    const flowEdges: Edge[] = analysisResult.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'custom',
      animated: edge.animated || false,
      label: edge.label,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: edge.style?.stroke || '#6B7280'
      },
      style: {
        stroke: edge.style?.stroke || '#6B7280',
        strokeWidth: edge.style?.strokeWidth || 2
      },
      data: {
        type: edge.type,
        animated: edge.animated,
        highlighted: highlightedPath.includes(edge.id)
      }
    }))

    setNodes(flowNodes)
    setEdges(flowEdges)

    // Auto-fit view after a small delay
    setTimeout(() => {
      reactFlow.fitView({ duration: 800, padding: 0.1 })
    }, 100)
  }, [analysisResult, selectedNodeId, highlightedPath, reactFlow])

  const handleNodeSelect = useCallback((node: NodeType) => {
    console.log('Node selected:', node.label)
    
    // Update selected node
    setSelectedNodeId(node.id === selectedNodeId ? null : node.id)
    
    // Find and highlight path from this node
    const connectedEdges = analysisResult.edges.filter(
      edge => edge.source === node.id || edge.target === node.id
    )
    
    setHighlightedPath(connectedEdges.map(edge => edge.id))
    
    // Call external handler
    if (onNodeSelect) {
      onNodeSelect(node)
    }
  }, [selectedNodeId, analysisResult.edges, onNodeSelect])

  const handleNodeExplain = useCallback((node: NodeType) => {
    console.log('Explaining node:', node.label)
    if (onNodeExplain) {
      onNodeExplain(node)
    }
  }, [onNodeExplain])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleZoomIn = () => reactFlow.zoomIn()
  const handleZoomOut = () => reactFlow.zoomOut()
  const handleFitView = () => reactFlow.fitView({ duration: 800, padding: 0.1 })
  const handleCenter = () => {
    if (selectedNodeId) {
      const selectedNode = nodes.find(n => n.id === selectedNodeId)
      if (selectedNode) {
        reactFlow.setCenter(selectedNode.position.x, selectedNode.position.y, { zoom: 1.2, duration: 800 })
      }
    } else {
      handleFitView()
    }
  }

  // Clear selection when clicking empty space
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setHighlightedPath([])
  }, [])

  return (
    <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden border border-gray-200">
      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
        className="bg-white"
      >
        {/* Background */}
        {showBackground && (
          <Background 
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#e5e7eb"
          />
        )}

        {/* Controls */}
        <Controls 
          position="top-left"
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg"
        />

        {/* MiniMap */}
        {showMiniMap && (
          <MiniMap
            position="bottom-right"
            className="bg-white/90 border border-gray-200 rounded-lg shadow-lg"
            nodeColor={(node) => {
              const nodeData = analysisResult.nodes.find(n => n.id === node.id)
              return nodeData?.style?.backgroundColor || '#6B7280'
            }}
          />
        )}
      </ReactFlow>

      {/* Custom Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
        {/* Main controls */}
        <div className="glass-card p-2 flex flex-col space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="w-10 h-10 p-0"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="w-10 h-10 p-0"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCenter}
            className="w-10 h-10 p-0"
          >
            <Maximize className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitView}
            className="w-10 h-10 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* View options */}
        <div className="glass-card p-2 flex flex-col space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMiniMap(!showMiniMap)}
            className={`w-10 h-10 p-0 ${showMiniMap ? 'bg-nehua-primary/20' : ''}`}
          >
            {showMiniMap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBackground(!showBackground)}
            className={`w-10 h-10 p-0 ${showBackground ? 'bg-nehua-secondary/20' : ''}`}
          >
            {showBackground ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsInfoOpen(true)}
            className="w-10 h-10 p-0"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedNodeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-4 glass-card p-4 max-w-sm z-10"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Selected Component</h3>
            <button 
              onClick={() => setSelectedNodeId(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {(() => {
            const selectedNode = analysisResult.nodes.find(n => n.id === selectedNodeId)
            return selectedNode ? (
              <div className="text-sm space-y-2">
                <p className="font-medium text-nehua-primary">{selectedNode.label}</p>
                <p className="text-gray-600 text-xs">{selectedNode.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Connections: {highlightedPath.length}</span>
                  {selectedNode.data.files && (
                    <span>Files: {selectedNode.data.files.length}</span>
                  )}
                </div>
              </div>
            ) : null
          })()}
        </motion.div>
      )}

      {/* Info Modal */}
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsInfoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Architecture Diagram Guide
                </h3>
                <button
                  onClick={() => setIsInfoOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Interactions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Click nodes to select and highlight connections</li>
                    <li>Use "Explain Component" for detailed AI analysis</li>
                    <li>Drag to pan, scroll to zoom</li>
                    <li>Click empty space to clear selection</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-1">Edge Types:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><span className="text-nehua-primary">Pink:</span> Dependencies</li>
                    <li><span className="text-nehua-secondary">Cyan:</span> API Calls</li>
                    <li><span className="text-nehua-accent">Yellow:</span> Imports</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-1">Components analyzed:</p>
                  <p className="text-xs">{analysisResult.nodes.length} nodes, {analysisResult.edges.length} connections</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ArchitectureDiagram(props: ArchitectureDiagramProps) {
  return (
    <ReactFlowProvider>
      <ArchitectureDiagramContent {...props} />
    </ReactFlowProvider>
  )
}