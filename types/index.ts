// Core types for Nehua architecture analysis

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  default_branch: string;
  language: string | null;
  languages_url: string;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface FrameworkDetection {
  framework: string;
  confidence: number;
  evidence: string[];
  version?: string;
}

export interface ArchitectureNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  position: { x: number; y: number };
  data: {
    files: string[];
    dependencies: string[];
    exports: string[];
    framework?: string;
    health_score?: number;
    risks?: string[];
  };
  style?: {
    backgroundColor: string;
    borderColor: string;
    color: string;
  };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: 'dependency' | 'api_call' | 'import' | 'inherits' | 'contains';
  label?: string;
  animated?: boolean;
  style?: {
    stroke: string;
    strokeWidth: number;
  };
}

export type NodeType = 
  | 'frontend' 
  | 'backend' 
  | 'database' 
  | 'cache' 
  | 'queue' 
  | 'storage' 
  | 'authentication' 
  | 'cloud_service' 
  | 'ai_service' 
  | 'external_api' 
  | 'infrastructure' 
  | 'monitoring';

export interface HealthScore {
  overall: number;
  categories: {
    dependencies: number;
    architecture: number;
    code_quality: number;
    performance: number;
  };
  reasoning: {
    dependencies: string;
    architecture: string;
    code_quality: string;
    performance: string;
    overall?: string;
  };
}

export interface AnalysisResult {
  repository: Repository;
  frameworks: FrameworkDetection[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  health_score: HealthScore;
  risks: Risk[];
  recommendations: Recommendation[];
  metadata: {
    analyzed_at: string;
    analysis_duration: number;
    files_analyzed: number;
    llm_calls: number;
  };
}

export interface Risk {
  id: string;
  category: 'security' | 'performance' | 'maintainability' | 'scalability' | 'technical_debt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_files: string[];
  recommendation: string;
}

export interface Recommendation {
  id: string;
  category: 'architecture' | 'dependencies' | 'code_quality' | 'performance' | 'security';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  implementation: string;
  estimated_effort: 'low' | 'medium' | 'high';
}

export interface FileAnalysis {
  path: string;
  type: 'source' | 'config' | 'dependency' | 'documentation' | 'test';
  language: string;
  size: number;
  lines_of_code: number;
  complexity?: number;
  imports: string[];
  exports: string[];
  dependencies: string[];
}

export interface LLMPromptContext {
  repository: Repository;
  frameworks: FrameworkDetection[];
  file_analysis: FileAnalysis[];
  config: any; // From nehua-config.json
}

export interface KiroMCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// UI Component Types
export interface NodeComponentProps {
  data: ArchitectureNode['data'] & {
    label: string;
    type: NodeType;
  };
  selected?: boolean;
  onSelect?: () => void;
}

export interface ArchitectureDiagramProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  onNodeSelect: (node: ArchitectureNode) => void;
  onPathHighlight: (nodeId: string) => void;
  selectedNodeId?: string;
}

export interface HealthScoreDisplayProps {
  score: HealthScore;
  size?: 'sm' | 'md' | 'lg';
}

// Configuration types (from nehua-config.json)
export interface NehuaConfig {
  project: {
    name: string;
    description: string;
    version: string;
  };
  frameworks: Record<string, {
    name: string;
    type: string;
    key_files: string[];
    structure_patterns: string[];
    dependency_files: string[];
  }>;
  node_types: Record<NodeType, {
    icon: string;
    color: string;
    description: string;
  }>;
  health_score: {
    categories: Record<string, {
      weight: number;
      description: string;
    }>;
    thresholds: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
  ui: {
    theme: {
      background: string;
      glass_opacity: number;
      blur_strength: string;
      border_opacity: number;
    };
    colors: Record<string, string>;
    animations: Record<string, string | number>;
  };
  analysis: {
    detail_level: string;
    risk_categories: string[];
    report_format: string;
    max_files_to_analyze: number;
    supported_extensions: string[];
  };
  github: {
    scope: string;
    rate_limit_buffer: number;
    max_repo_size_mb: number;
  };
  llm: {
    provider: string;
    model: string;
    max_tokens: number;
    temperature: number;
    prompts: Record<string, string>;
  };
}