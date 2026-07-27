'use client'

import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  EdgeProps, 
  getBezierPath,
  MarkerType
} from 'reactflow'
import { motion } from 'framer-motion'

interface CustomEdgeProps extends EdgeProps {
  data?: {
    animated?: boolean
    highlighted?: boolean
    type?: 'dependency' | 'api_call' | 'import' | 'inherits' | 'contains'
  }
}

const edgeTypeColors: Record<string, { stroke: string; glow: string }> = {
  dependency: { stroke: '#FA0080', glow: 'rgba(250, 0, 128, 0.4)' },
  api_call: { stroke: '#00DDFA', glow: 'rgba(0, 221, 250, 0.4)' },
  import: { stroke: '#FADD00', glow: 'rgba(250, 221, 0, 0.4)' },
  inherits: { stroke: '#A59837', glow: 'rgba(165, 152, 55, 0.4)' },
  contains: { stroke: '#7A3D5D', glow: 'rgba(122, 61, 93, 0.4)' },
  default: { stroke: '#6B7280', glow: 'rgba(107, 114, 128, 0.4)' }
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  label
}: CustomEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const edgeType = data?.type || 'default'
  const colors = edgeTypeColors[edgeType] || edgeTypeColors.default
  const isAnimated = data?.animated || false
  const isHighlighted = data?.highlighted || false

  const strokeWidth = isHighlighted ? 4 : 2
  const opacity = isHighlighted ? 1 : 0.8

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth,
          stroke: colors.stroke,
          opacity,
          filter: isHighlighted ? `drop-shadow(0 0 8px ${colors.glow})` : 'none'
        }}
      />

      {/* Animated flow particles */}
      {isAnimated && (
        <motion.circle
          r="3"
          fill={colors.stroke}
          opacity="0.8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </motion.circle>
      )}

      {/* Edge label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className={`
                px-2 py-1 rounded-full text-xs font-medium
                backdrop-blur-sm border transition-all duration-200
                ${isHighlighted
                  ? 'bg-slate-800 border-white/30 shadow-lg'
                  : 'bg-slate-900/80 border-white/10'
                }
              `}
              style={{
                color: colors.stroke,
                borderColor: isHighlighted ? colors.stroke : undefined
              }}
            >
              {label}
            </motion.div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Highlight glow effect */}
      {isHighlighted && (
        <BaseEdge
          path={edgePath}
          style={{
            strokeWidth: 8,
            stroke: colors.stroke,
            opacity: 0.3,
            filter: `blur(4px)`
          }}
        />
      )}
    </>
  )
}

// Edge types configuration for React Flow
export const edgeTypes = {
  custom: CustomEdge,
}