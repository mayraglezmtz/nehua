# 🏗️ Nehua - Autonomous Software Architecture Agent

![Nehua Banner](https://img.shields.io/badge/Hackathon-24h%20MVP-FA0080?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-00DDFA?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-FADD00?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Demo%20Ready-22c55e?style=for-the-badge)

Nehua reconstructs architectural knowledge from existing GitHub repositories through autonomous analysis that combines deterministic static analysis with LLM-powered reasoning.

## ✨ Features Completed (100%)

- 🔐 **GitHub OAuth Integration** - Secure authentication with full session management
- 📊 **Interactive Architecture Visualization** - React Flow diagrams with liquid glass UI
- 🧠 **AI-Powered Analysis** - Gemini API integration via Kiro MCP with fallback
- 📈 **Health Score System** - Comprehensive 4-category evaluation with AI reasoning
- 🎨 **Liquid Glass UI** - Modern glassmorphism design with advanced animations
- 📋 **Detailed Reports** - Multi-format exports (JSON, Markdown, PDF) with action plans
- 🎯 **Interactive Nodes** - Click-to-select, path highlighting, real-time AI explanations
- ⚡ **Performance Optimized** - Error boundaries, analytics tracking, demo polish

## 🚀 Supported Frameworks

- **Django** - Python web framework with models, views, URL analysis
- **FastAPI** - Modern async Python API framework with router detection  
- **React** - JavaScript UI library with component and hook analysis
- **Next.js** - Full-stack React framework with app/pages directory support

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + React Flow
- **Authentication**: NextAuth.js with GitHub Provider
- **UI**: Tailwind CSS + Framer Motion + Radix UI + Liquid Glass Effects
- **Visualization**: Custom React Flow nodes with animated edges
- **AI**: Gemini API via Kiro MCP with intelligent fallback
- **Analysis**: Multi-framework static analysis engine
- **Export**: JSON/Markdown/PDF report generation

## 📦 Quick Start

### Prerequisites

- Conda (Miniconda or Anaconda)
- GitHub Account
- Kiro CLI (for Gemini API access)

### Installation

1. **Clone and setup conda environment**
```bash
git clone <repository-url>
cd nehua

# Create and activate conda environment
conda env create -f environment.yml
conda activate nehua-env

# Install Node.js dependencies
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env.local
```

Configure your `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
KIRO_API_ENDPOINT=http://localhost:8000
```

3. **GitHub OAuth Setup**
- Go to GitHub Settings > Developer Settings > OAuth Apps
- Create new OAuth App:
  - Homepage URL: `http://localhost:3000`
  - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
- Copy Client ID and Client Secret to `.env.local`

4. **Kiro MCP Setup (for AI Analysis)**
```bash
# Install and configure Kiro CLI with Gemini API access
# Start Kiro MCP server for AI analysis
kiro mcp start --port 8000

# Verify MCP endpoint is working
curl http://localhost:8000/health
```

5. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` and start analyzing your repositories!

## 🎯 Project Structure

```
nehua/
├── app/                           # Next.js App Router
│   ├── auth/signin/              # Authentication pages
│   ├── repositories/             # Repository selection
│   ├── analysis/                 # Architecture visualization
│   └── api/                      # API endpoints
├── components/                    # Reusable UI components
│   ├── ui/                       # Base UI components
│   ├── architecture-diagram.tsx  # Interactive React Flow
│   ├── health-score-gauge.tsx   # Animated health metrics
│   └── report-viewer.tsx        # Comprehensive report modal
├── lib/                          # Core business logic
│   ├── analysis/                 # Static analysis engine
│   │   ├── analyzers/           # Framework-specific analyzers
│   │   └── static-engine.ts     # Analysis orchestrator
│   ├── kiro-mcp.ts             # AI integration service
│   ├── report-generator.ts      # Multi-format report export
│   └── demo-optimization.ts     # Demo polish & analytics
├── types/                        # TypeScript definitions
└── nehua-config.json            # Centralized configuration
```

## 🔧 Configuration

All project settings are centralized in `nehua-config.json`:

- **Framework Detection Rules** - File patterns and key indicators
- **Node Types & Colors** - 12 component types with custom styling
- **Health Score Metrics** - Weighted scoring with AI integration
- **UI Theme Settings** - Liquid glass effects and animations
- **Analysis Parameters** - File limits and supported extensions
- **LLM Prompts** - Configurable AI analysis prompts

## 📊 Health Score System

| Category | Weight | AI Analysis | Static Fallback |
|----------|--------|-------------|-----------------|
| Dependencies | 25% | Package freshness, security vulnerabilities | Version analysis, known issues |
| Architecture | 25% | Design patterns, separation of concerns | Component relationships, structure |
| Code Quality | 25% | Documentation, maintainability | File organization, naming |
| Performance | 25% | Optimization opportunities, async patterns | Bundle size estimates, complexity |

## 🎨 Design System

### Color Palette
- **Primary**: `#FA0080` (Nehua Pink) - Main brand, CTAs, highlights  
- **Secondary**: `#00DDFA` (Cyan Blue) - Interactive elements, data flows
- **Accent**: `#FADD00` (Electric Yellow) - Warnings, notifications
- **Neutrals**: `#A59837`, `#7A3D5D`, `#3D737A` - Supporting elements

### Liquid Glass Effects
- **glass-panel**: Premium panels with advanced blur and gradients
- **glass-card-hover**: Interactive cards with smooth transitions
- **glass-input**: Form inputs with focus effects
- **animate-border**: Gradient animated borders
- **pulse-glow**: Status indicators with breathing effects

## 🔄 Demo Flow

1. **Authentication** - GitHub OAuth with animated glass UI
2. **Repository Selection** - Filtered browsing with framework detection
3. **Analysis Processing** - Real-time progress with AI enhancement
4. **Architecture Visualization** - Interactive React Flow diagrams
5. **Report Generation** - Multi-format export with action plans

## 🚦 Implementation Status (All Tasks Complete!)

- [x] **Project Setup** - Conda environment, dependencies, configuration
- [x] **GitHub OAuth** - Authentication flow with session management  
- [x] **Repository Interface** - Selection, filtering, framework detection
- [x] **Static Analysis** - Multi-framework parsing and component detection
- [x] **AI Integration** - Gemini API via Kiro MCP with intelligent fallback
- [x] **Interactive Visualization** - React Flow with custom nodes and edges
- [x] **Health Score System** - AI-powered scoring with category breakdown
- [x] **Liquid Glass UI** - Modern glassmorphism with advanced animations
- [x] **Report Generation** - Comprehensive exports with actionable insights
- [x] **Interactive Features** - Node selection, path highlighting, explanations
- [x] **Demo Polish** - Error handling, analytics, performance optimization

## 📈 Demo Analytics

The application includes comprehensive demo tracking:

- **User Journey**: Page views, interactions, completion rates
- **Performance**: Analysis timing, API response times, loading states
- **Feature Usage**: Node selections, report generations, export formats
- **Error Handling**: Graceful fallbacks with user-friendly messages

## 🏆 Hackathon Highlights

**Built in 24 hours with:**
- ✅ Complete end-to-end user experience
- ✅ Production-ready error handling and fallbacks  
- ✅ Advanced UI animations and glassmorphism effects
- ✅ AI integration with intelligent static analysis fallback
- ✅ Multi-framework support with extensible analyzer architecture
- ✅ Comprehensive reporting with actionable insights
- ✅ Interactive architecture visualization with real-time explanations
- ✅ Performance optimization and demo analytics

## 🛡️ Architecture Decisions

### Scalability
- **Modular Analyzers**: Easy to add new frameworks
- **Configurable Everything**: No hardcoded values, JSON-driven
- **Fallback Strategies**: Graceful degradation when AI unavailable
- **Performance Monitoring**: Built-in timing and analytics

### User Experience  
- **Liquid Glass Design**: Modern, cohesive visual language
- **Interactive Feedback**: Loading states, progress indicators, animations
- **Error Recovery**: User-friendly error boundaries and retry mechanisms
- **Demo Polish**: Smooth transitions, performance optimizations

### Technical Excellence
- **Type Safety**: Comprehensive TypeScript definitions
- **Code Organization**: Clear separation of concerns
- **Configuration Management**: Centralized, environment-aware settings
- **Testing Ready**: Error boundaries, analytics, performance monitoring

## 📄 License

MIT License - Built for educational and demonstration purposes.

---

**🎯 Hackathon Achievement: Complete MVP in 24 hours**  
**🏗️ Architecture Agent that actually works**  
**🎨 Liquid glass UI that feels magical**  
**🧠 AI integration that enhances rather than replaces**  

Built with ❤️ and ☕ for the ultimate architecture analysis experience.