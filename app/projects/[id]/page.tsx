'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AnalysisView from '@/components/AnalysisView';
import BlueprintView from '@/components/BlueprintView';
import LivePreview from '@/components/LivePreview';
import ChatEditor from '@/components/ChatEditor';
import PipelineStepper from '@/components/PipelineStepper';
import TerminalWidget from '@/components/TerminalWidget';
import VSCodeEditor from '@/components/VSCodeEditor';
import { Project, ChatMessage, ProjectFile } from '@/types';
import { getDefaultFullStackFiles } from '@/lib/groq';
import { Layers, Eye, Database, Globe, ArrowLeft, Terminal, Sparkles, CheckCircle2, Play, Code } from 'lucide-react';

export default function ProjectStudioPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBuildingBlueprint, setIsBuildingBlueprint] = useState(false);
  const [isGeneratingUI, setIsGeneratingUI] = useState(false);
  const [isRefiningChat, setIsRefiningChat] = useState(false);

  const [pipelineStep, setPipelineStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analysis' | 'vscode' | 'studio' | 'terminal'>('vscode');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.project) {
        throw new Error(data.error || 'Failed to load project details.');
      }

      const proj: Project = data.project;
      setProject(proj);

      // Auto-progress pipeline stepper based on project state
      if (proj.uiCode || (proj.generatedFiles && proj.generatedFiles.length > 0)) {
        setPipelineStep(5);
        setActiveTab('vscode');
      } else if (proj.blueprint) {
        setPipelineStep(4);
        setActiveTab('vscode');
      } else if (proj.analysis) {
        setPipelineStep(3);
        setActiveTab('analysis');
      } else {
        setPipelineStep(2);
        setActiveTab('pipeline');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleBuildBlueprint = async () => {
    if (!projectId) return;
    setIsBuildingBlueprint(true);
    setPipelineStep(3);

    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate blueprint.');
      }

      setProject((prev) =>
        prev
          ? {
              ...prev,
              blueprint: data.blueprint,
              generatedFiles: data.generatedFiles || data.blueprint.generatedFiles,
            }
          : null
      );
      setPipelineStep(4);
      setActiveTab('vscode');

      handleGenerateUI();
    } catch (err: any) {
      alert(err?.message || 'Error generating blueprint');
    } finally {
      setIsBuildingBlueprint(false);
    }
  };

  const handleGenerateUI = async () => {
    if (!projectId) return;
    setIsGeneratingUI(true);
    setPipelineStep(4);

    try {
      const res = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate UI code.');
      }

      setProject((prev) => (prev ? { ...prev, uiCode: data.uiCode } : null));
      setPipelineStep(5);
    } catch (err: any) {
      alert(err?.message || 'Error generating UI code');
    } finally {
      setIsGeneratingUI(false);
    }
  };

  const handleSendMessage = async (userMsg: string) => {
    if (!projectId) return;
    setIsRefiningChat(true);

    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      projectId,
      role: 'user',
      content: userMsg,
      createdAt: new Date().toISOString(),
    };

    setProject((prev) =>
      prev ? { ...prev, chatHistory: [...(prev.chatHistory || []), tempUserMsg] } : null
    );

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: userMsg }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to refine blueprint.');
      }

      setProject((prev) =>
        prev
          ? {
              ...prev,
              blueprint: data.blueprint,
              uiCode: data.uiCode,
              generatedFiles: data.generatedFiles || prev.generatedFiles,
              chatHistory: [
                ...(prev.chatHistory || []),
                {
                  id: crypto.randomUUID(),
                  projectId,
                  role: 'assistant',
                  content: data.assistantMessage,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : null
      );
    } catch (err: any) {
      alert(err?.message || 'Error refining product.');
    } finally {
      setIsRefiningChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Loading Product Studio...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
          <p className="text-xs text-rose-400 font-mono">{error || 'Project not found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-xs bg-slate-900 border border-white/10 hover:bg-slate-850 px-4 py-2 rounded-xl text-slate-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Active files list
  const activeFiles: ProjectFile[] =
    project.generatedFiles && project.generatedFiles.length > 0
      ? project.generatedFiles
      : project.blueprint?.generatedFiles && project.blueprint.generatedFiles.length > 0
      ? project.blueprint.generatedFiles
      : getDefaultFullStackFiles(project.blueprint?.productName || project.name);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      {/* Workspace Navigation Header */}
      <div className="bg-slate-900/90 border-b border-white/[0.08] px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-colors"
              title="Back to Projects"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-white tracking-tight">
                  {project.blueprint?.productName || project.name}
                </h1>
                <span className="text-[10px] bg-slate-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-400" /> Groq + Claude AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Globe className="w-3 h-3 text-indigo-400" /> {project.websiteUrl}
              </p>
            </div>
          </div>

          {/* Studio Workspace Mode Tabs */}
          <div className="flex items-center space-x-2">
            <div className="bg-slate-950 border border-white/[0.08] p-1 rounded-xl flex space-x-1 text-xs">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1.5 text-xs ${
                  activeTab === 'pipeline' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Agent Pipeline</span>
              </button>

              {project.analysis && (
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1.5 text-xs ${
                    activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>2. Strategy</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('vscode')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1.5 text-xs ${
                  activeTab === 'vscode' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>3. VS Code Studio</span>
              </button>

              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1.5 text-xs ${
                  activeTab === 'terminal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>4. CLI Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {activeTab === 'pipeline' ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <PipelineStepper
              currentStep={pipelineStep}
              scrapedTitle={project.scrapedInfo?.title}
              scrapedHeadings={project.scrapedInfo?.headings}
              productName={project.blueprint?.productName}
              onContinueToStudio={() => setActiveTab('vscode')}
            />

            {!project.blueprint && (
              <div className="text-center pt-2">
                <button
                  onClick={handleBuildBlueprint}
                  disabled={isBuildingBlueprint}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md shadow-indigo-500/20 inline-flex items-center space-x-2 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Groq API & Claude Code Agent</span>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'analysis' && project.analysis ? (
          <div className="max-w-4xl mx-auto">
            <AnalysisView
              analysis={project.analysis}
              scrapedInfo={project.scrapedInfo}
              onBuildProduct={handleBuildBlueprint}
              isBuilding={isBuildingBlueprint}
            />
          </div>
        ) : activeTab === 'terminal' ? (
          <div className="max-w-4xl mx-auto">
            <TerminalWidget
              projectId={project.id}
              productName={project.blueprint?.productName || project.name}
              uiCode={project.uiCode}
              blueprint={project.blueprint}
            />
          </div>
        ) : (
          /* VS Code-Style Multi-File Code Studio */
          <div className="space-y-4">
            <VSCodeEditor
              files={activeFiles}
              productName={project.blueprint?.productName || project.name}
              chatHistory={project.chatHistory || []}
              onSendMessage={handleSendMessage}
              isSending={isRefiningChat}
            />
          </div>
        )}
      </main>
    </div>
  );
}
