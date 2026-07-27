'use client'

import { Handle, Position } from 'reactflow'
import { motion } from 'framer-motion'
import { 
  Monitor, 
  Server, 
  Database, 
  Zap, 
  List, 
  Archive, 
  Lock, 
  Cloud, 
  Brain, 
  Globe, 
  Layers, 
  Activity,
  Code2,
  FileCode,
  Cpu,
  Shield
} from 'lucide-react'
import { NodeType } from '@/types'

interface ArchitectureNodeProps {
  data: {
    label: string
    type: NodeType
    description: string
    files?: string[]
    dependencies?: string[]
    exports?: string[]
    health_score?: number
    risks?: string[]
    selected?: boolean
    onSelect?: () => void
    onExplain?: () => void
  }
  selected?: boolean
}

const nodeIcons: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  frontend: Monitor,
  backend: Server,
  database: Database,
  cache: Zap,
  queue: List,
  storage: Archive,
  authentication: Lock,
  cloud_service: Cloud,
  ai_service: Brain,
  external_api: Globe,
  infrastructure: Layers,
  monitoring: Activity,
}

const nodeColors: Record<NodeType, { bg: string; border: string; glow: string }> = {
  frontend: { bg: '#00DDFA', border: '#00B8D4', glow: '0 0 20px rgba(0, 221, 250, 0.4)' },
  backend: { bg: '#FA0080', border: '#D5006D', glow: '0 0 20px rgba(250, 0, 128, 0.4)' },
  database: { bg: '#FADD00', border: '#E6C200', glow: '0 0 20px rgba(250, 221, 0, 0.4)' },
  cache: { bg: '#A59837', border: '#8A7F2F', glow: '0 0 20px rgba(165, 152, 55, 0.4)' },
  queue: { bg: '#7A3D5D', border: '#63334A', glow: '0 0 20px rgba(122, 61, 93, 0.4)' },
  storage: { bg: '#3D737A', border: '#335E66', glow: '0 0 20px rgba(61, 115, 122, 0.4)' },
  authentication: { bg: '#FA0080', border: '#D5006D', glow: '0 0 20px rgba(250, 0, 128, 0.4)' },
  cloud_service: { bg: '#00DDFA', border: '#00B8D4', glow: '0 0 20px rgba(0, 221, 250, 0.4)' },
  ai_service: { bg: '#FADD00', border: '#E6C200', glow: '0 0 20px rgba(250, 221, 0, 0.4)' },
  external_api: { bg: '#A59837', border: '#8A7F2F', glow: '0 0 20px rgba(165, 152, 55, 0.4)' },
  infrastructure: { bg: '#7A3D5D', border: '#63334A', glow: '0 0 20px rgba(122, 61, 93, 0.4)' },
  monitoring: { bg: '#3D737A', border: '#335E66', glow: '0 0 20px rgba(61, 115, 122, 0.4)' },
}

export function ArchitectureNode({ data, selected }: ArchitectureNodeProps) {
  const Icon = nodeIcons[data.type] || Code2
  const colors = nodeColors[data.type]
  const isSelected = selected || data.selected

  const handleClick = () => {
    if (data.onSelect) {
      data.onSelect()
    }
  }

  const handleExplainClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.onExplain) {
      data.onExplain()
    }
  }

  return (
    <>
      {/* Invisible handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-0 pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0 pointer-events-none"
      />

      <motion.div
        className={`
          relative group cursor-pointer
          ${isSelected ? 'z-20' : 'z-10'}
        `}
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20,
          delay: Math.random() * 0.5 
        }}
      >
        {/* Node container */}
        <div
          className={`
            relative min-w-[180px] max-w-[240px] rounded-xl 
            backdrop-blur-md border-2 transition-all duration-300
            ${isSelected 
              ? 'ring-4 ring-white ring-opacity-30' 
              : 'hover:shadow-xl'
            }
          `}
          style={{
            backgroundColor: `${colors.bg}15`,
            borderColor: isSelected ? colors.border : `${colors.border}80`,
            boxShadow: isSelected ? colors.glow : 'none'
          }}
        >
          {/* Header */}
          <div 
            className="p-3 rounded-t-xl flex items-center space-x-3"
            style={{ backgroundColor: `${colors.bg}25` }}
          >
            <div 
              className="p-2 rounded-lg flex-shrink-0"
              style={{ backgroundColor: colors.bg }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {data.label}
              </h3>
              <p className="text-xs text-gray-600 capitalize">
                {data.type.replace('_', ' ')}
              </p>
            </div>

            {/* Health score indicator */}
            {data.health_score && (
              <div className="flex-shrink-0">
                <div 
                  className={`
                    w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white
                    ${data.health_score >= 80 ? 'bg-green-500' : 
                      data.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
                  `}
                >
                  {data.health_score}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            {/* Description */}
            <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
              {data.description}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              {data.files && (
                <span className="flex items-center space-x-1">
                  <FileCode className="w-3 h-3" />
                  <span>{data.files.length} files</span>
                </span>
              )}
              
              {data.dependencies && (
                <span className="flex items-center space-x-1">
                  <Layers className="w-3 h-3" />
                  <span>{data.dependencies.length} deps</span>
                </span>
              )}

              {data.risks && data.risks.length > 0 && (
                <span className="flex items-center space-x-1 text-red-500">
                  <Shield className="w-3 h-3" />
                  <span>{data.risks.length} risks</span>
                </span>
              )}
            </div>

            {/* Exports preview */}
            {data.exports && data.exports.length > 0 && (
              <div className="text-xs">
                <span className="text-gray-600">Exports: </span>
                <span className="text-gray-800 font-medium">
                  {data.exports.slice(0, 2).join(', ')}
                  {data.exports.length > 2 && ` +${data.exports.length - 2} more`}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-3 pb-3">
            <button
              onClick={handleExplainClick}
              className={`
                w-full py-2 px-3 rounded-lg text-xs font-medium 
                transition-all duration-200 
                hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50
              `}
              style={{
                backgroundColor: colors.bg,
                color: 'white',
                '--tw-ring-color': colors.border
              } as React.CSSProperties}
            >
              Explain Component
            </button>
          </div>

          {/* Selection indicator */}
          {isSelected && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: `linear-gradient(45deg, ${colors.bg}10, ${colors.bg}20, ${colors.bg}10)`,
                backgroundSize: '20px 20px'
              }}
              animate={{
                backgroundPosition: ['0px 0px', '40px 40px']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}

          {/* Hover glow effect */}
          <div 
            className={`
              absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 
              transition-opacity duration-300 pointer-events-none
            `}
            style={{ backgroundColor: colors.bg }}
          />
        </div>

        {/* Pulse animation for new nodes */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ 
            border: `2px solid ${colors.bg}`,
            backgroundColor: 'transparent'
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
    </>
  )
}