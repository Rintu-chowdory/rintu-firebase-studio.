'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Command,
  FileCode2,
  Filter,
  FolderKanban,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Moon,
  Plus,
  Rocket,
  Search,
  Send,
  Settings2,
  Sparkles,
  Sun,
  Terminal,
  X,
  Zap,
} from 'lucide-react'

const projects = [
  { name: 'studio-web', branch: 'main', color: 'violet', updated: '2m ago' },
  { name: 'firebase-landing', branch: 'develop', color: 'blue', updated: '1h ago' },
  { name: 'orbit-dashboard', branch: 'main', color: 'amber', updated: 'Yesterday' },
]

const activities = [
  { icon: Rocket, title: 'Deployment completed', detail: 'studio-web • production', time: '2m ago', tone: 'green' },
  { icon: GitBranch, title: 'Branch created', detail: 'feature/auth-flow', time: '18m ago', tone: 'violet' },
  { icon: Bot, title: 'AI agent finished', detail: 'Refactored 6 components', time: '42m ago', tone: 'blue' },
  { icon: FileCode2, title: 'Changes committed', detail: 'Update dashboard layout', time: '1h ago', tone: 'slate' },
]

const suggestions = [
  'Add authentication to my app',
  'Build a responsive dashboard',
  'Create a Firestore data model',
]

export default function Page() {
  const [activeProject, setActiveProject] = useState('studio-web')
  const [activeTab, setActiveTab] = useState('Overview')
  const [query, setQuery] = useState('')
  const [prompt, setPrompt] = useState('')
  const [isLight, setIsLight] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [sent, setSent] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentPrompt, setAgentPrompt] = useState('')
  const [agentReply, setAgentReply] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)

  const filteredProjects = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  async function askAgent() {
    if (!agentPrompt.trim() || agentLoading) return
    setAgentLoading(true)
    setAgentReply('')
    try {
      const response = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: agentPrompt, project: activeProject }) })
      const data = await response.json()
      setAgentReply(data.text ?? 'I could not complete that request.')
    } catch {
      setAgentReply('The agent is unavailable right now. Please try again in a moment.')
    } finally {
      setAgentLoading(false)
    }
  }

  function submitPrompt() {
    if (!prompt.trim() || isCreating) return
    setIsCreating(true)
    window.setTimeout(() => {
      setIsCreating(false)
      setSent(true)
      setPrompt('')
      window.setTimeout(() => setSent(false), 3000)
    }, 900)
  }

  return (
    <main className={isLight ? 'app-shell light-mode' : 'app-shell'}>
      <header className="topbar">
        <div className="brand-wrap">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={18} /></button>
          <div className="firebase-mark" aria-hidden="true"><span /></div>
          <span className="brand-name">Firebase <strong>Studio</strong></span>
          <span className="beta-pill">BETA</span>
        </div>
        <div className="topbar-actions">
          <button className="agent-launcher" onClick={() => setAgentOpen(!agentOpen)}><Bot size={15} /> Personal agent</button>
          <button className="workspace-switcher" aria-label="Switch workspace"><span className="avatar">RC</span><span>Rintu&apos;s workspace</span><ChevronDown size={14} /></button>
          <button className="icon-button" aria-label="Toggle theme" onClick={() => setIsLight(!isLight)}>{isLight ? <Moon size={17} /> : <Sun size={17} />}</button>
          <button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><i /></button>
          <button className="avatar avatar-large" aria-label="Open profile">RC</button>
        </div>
      </header>

      <div className="app-body">
        <aside className={sidebarOpen ? 'sidebar sidebar-open' : 'sidebar'}>
          <div className="sidebar-top">
            <div className="sidebar-label"><span>PROJECTS</span><button className="mini-button" aria-label="New project"><Plus size={14} /></button></div>
            <label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" /><kbd>⌘ K</kbd></label>
          </div>
          <nav className="project-list" aria-label="Projects">
            {filteredProjects.map((project) => <button key={project.name} className={activeProject === project.name ? 'project-item active' : 'project-item'} onClick={() => { setActiveProject(project.name); setSidebarOpen(false) }}><span className={`project-dot ${project.color}`}><FolderKanban size={14} /></span><span className="project-copy"><strong>{project.name}</strong><small><GitBranch size={11} /> {project.branch}</small></span><span className="project-time">{project.updated}</span></button>)}
          </nav>
          <div className="sidebar-section"><div className="sidebar-label"><span>WORKSPACE</span></div><button className="side-link active-link"><LayoutDashboard size={16} /> Overview</button><button className="side-link"><Code2 size={16} /> Workspaces <span className="count">4</span></button><button className="side-link"><Rocket size={16} /> Deployments</button><button className="side-link"><Activity size={16} /> Activity</button></div>
          <div className="sidebar-bottom"><button className="side-link"><Settings2 size={16} /> Settings</button><button className="side-link"><CircleHelp size={16} /> Help &amp; docs <ArrowUpRight size={13} className="external" /></button><div className="upgrade-card"><div className="upgrade-icon"><Zap size={15} /></div><div><strong>Unlock more with Pro</strong><p>More AI capacity and private workspaces.</p><button>Explore plans <ArrowUpRight size={12} /></button></div><button className="close-upgrade" aria-label="Dismiss"><X size={13} /></button></div></div>
        </aside>

        <section className="workspace">
          <div className="workspace-header"><div><div className="breadcrumb"><span>Projects</span><span>/</span><strong>{activeProject}</strong></div><h1>Good morning, Rintu<span className="accent-dot">.</span></h1><p>Here&apos;s what&apos;s happening with your projects today.</p></div><button className="primary-button" onClick={() => setPrompt('Create a new project for me')}><Plus size={16} /> New project</button></div>
          <div className="tab-row" role="tablist">{['Overview', 'Workspaces', 'Deployments'].map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'tab active-tab' : 'tab'} onClick={() => setActiveTab(tab)}>{tab}{tab === 'Workspaces' && <span className="tab-count">4</span>}</button>)}</div>

          {activeTab === 'Overview' ? <>
            <div className="stats-grid"><StatCard icon={Gauge} label="Build minutes" value="184" unit="/ 500" trend="+12%" tone="violet" /><StatCard icon={Rocket} label="Deployments" value="24" unit="this month" trend="+8" tone="green" /><StatCard icon={Bot} label="AI generations" value="68" unit="this month" trend="+24%" tone="blue" /><StatCard icon={Zap} label="Build success" value="98.6" unit="%" trend="+1.2%" tone="amber" /></div>
            <div className="content-grid"><div className="main-column"><section className="panel prompt-panel"><div className="panel-heading"><div><span className="eyebrow"><Sparkles size={13} /> AI WORKSPACE</span><h2>What do you want to build?</h2><p>Describe an idea and Studio will help you turn it into a working app.</p></div><button className="icon-button subtle" aria-label="Prompt options"><MoreHorizontal size={18} /></button></div><div className={isCreating ? 'prompt-input loading' : 'prompt-input'}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); submitPrompt() } }} placeholder="e.g. Build a habit tracker with Firebase Auth and Firestore..." rows={3} /><div className="prompt-footer"><span><Command size={13} /> Enter to generate <span className="muted">•</span> Shift + Enter for new line</span><button className="send-button" onClick={submitPrompt} aria-label="Generate"><Send size={16} /></button></div></div>{sent && <div className="success-message"><Check size={15} /> Your request is queued. Studio is preparing your workspace.</div>}<div className="suggestion-row">{suggestions.map((suggestion) => <button key={suggestion} className="suggestion" onClick={() => setPrompt(suggestion)}><Sparkles size={13} /> {suggestion}</button>)}</div></section>
              <section className="panel"><div className="panel-title-row"><div><span className="eyebrow">RECENT WORKSPACES</span><h2>Continue building</h2></div><button className="text-button">View all <ArrowUpRight size={14} /></button></div><div className="workspace-cards"><WorkspaceCard icon={LayoutDashboard} title="Marketing dashboard" detail="Next.js • Updated 12 min ago" color="violet" /><WorkspaceCard icon={Terminal} title="Firebase auth flow" detail="React • Updated yesterday" color="blue" /><WorkspaceCard icon={BookOpen} title="Recipe collection" detail="Svelte • Updated 3 days ago" color="amber" /></div></section></div>
              <aside className="right-column"><section className="panel health-panel"><div className="panel-title-row"><div><span className="eyebrow">PROJECT HEALTH</span><h2>All systems normal</h2></div><span className="status-dot" /></div><div className="health-meter"><div className="meter-track"><span /></div><strong>98.6%</strong></div><div className="health-list"><div><span className="green-dot" /> Builds passing <strong>42 / 42</strong></div><div><span className="green-dot" /> Latest deploy <strong>2m ago</strong></div><div><span className="green-dot" /> Uptime <strong>99.99%</strong></div></div></section><section className="panel activity-panel"><div className="panel-title-row"><div><span className="eyebrow">ACTIVITY</span><h2>Recent activity</h2></div><button className="icon-button subtle" aria-label="Filter activity"><Filter size={15} /></button></div><div className="activity-list">{activities.map((item) => { const Icon = item.icon; return <div className="activity-item" key={item.title}><span className={`activity-icon ${item.tone}`}><Icon size={14} /></span><div><strong>{item.title}</strong><p>{item.detail}</p></div><time>{item.time}</time></div> })}</div><button className="full-link">View activity <ArrowUpRight size={14} /></button></section></aside></div>
          </> : <div className="empty-tab"><div className="empty-icon"><Code2 size={24} /></div><h2>{activeTab}</h2><p>Your {activeTab.toLowerCase()} will appear here.</p><button className="primary-button" onClick={() => setActiveTab('Overview')}>Back to overview</button></div>}
        </section>
      </div>

      {agentOpen && <section className="agent-panel" aria-label="Personal build agent">
        <div className="agent-panel-header"><div><span className="eyebrow"><Bot size={13} /> PERSONAL AGENT</span><h2>Build with a partner</h2><p>Ask for architecture, Firebase setup, or a clear build plan.</p></div><button className="icon-button subtle" aria-label="Close personal agent" onClick={() => setAgentOpen(false)}><X size={17} /></button></div>
        <div className="agent-suggestions">{['Plan my Firebase architecture', 'Add auth and protected routes', 'Review this project for bugs'].map((item) => <button key={item} onClick={() => setAgentPrompt(item)}>{item}</button>)}</div>
        {agentReply && <div className="agent-reply">{agentReply}</div>}
        <div className="agent-input"><textarea value={agentPrompt} onChange={(event) => setAgentPrompt(event.target.value)} placeholder="What should we build next?" rows={3} /><button className="send-button" onClick={askAgent} disabled={agentLoading} aria-label="Ask personal agent">{agentLoading ? <span className="spinner" /> : <Send size={16} />}</button></div>
      </section>}
    </main>
  )
}

function StatCard({ icon: Icon, label, value, unit, trend, tone }: { icon: typeof Gauge; label: string; value: string; unit: string; trend: string; tone: string }) { return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}><Icon size={16} /></span><span className="trend">{trend}</span></div><div className="stat-value">{value}<small>{unit}</small></div><div className="stat-label">{label}</div></div> }
function WorkspaceCard({ icon: Icon, title, detail, color }: { icon: typeof LayoutDashboard; title: string; detail: string; color: string }) { return <button className="workspace-card"><span className={`workspace-icon ${color}`}><Icon size={18} /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={15} className="card-arrow" /></button> }
