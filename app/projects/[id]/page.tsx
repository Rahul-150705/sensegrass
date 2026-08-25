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
import { Project, ChatMessage } from '@/types';
import { Layers, Eye, Database, Globe, ArrowLeft, Terminal, Sparkles, CheckCircle2, Play } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analysis' | 'studio' | 'terminal'>('pipeline');

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
      if (proj.uiCode) {
        setPipelineStep(5);
        setActiveTab('studio');
      } else if (proj.blueprint) {
        setPipelineStep(4);
        setActiveTab('studio');
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

      setProject((prev) => (prev ? { ...prev, blueprint: data.blueprint } : null));
      setPipelineStep(4);
      setActiveTab('studio');

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
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
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
          <p className="text-sm text-rose-400">{error || 'Project not found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      {/* Sub-Header Studio Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-white">
                  {project.blueprint?.productName || project.name}
                </h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Database className="w-3 h-3" /> Saved
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-400" /> {project.websiteUrl}
              </p>
            </div>
          </div>

          {/* Studio View Mode Tabs */}
          <div className="flex items-center space-x-2">
            <div className="bg-slate-950 border border-slate-800 p-1 rounded-2xl flex space-x-1 text-xs">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'pipeline' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Agent Pipeline</span>
              </button>

              {project.analysis && (
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>2. Product Analysis</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('studio')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'studio' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>3. Live UI Studio</span>
              </button>

              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'terminal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>4. Terminal Exporter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {activeTab === 'pipeline' ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <PipelineStepper
              currentStep={pipelineStep}
              scrapedTitle={project.scrapedInfo?.title}
              scrapedHeadings={project.scrapedInfo?.headings}
              productName={project.blueprint?.productName}
              onContinueToStudio={() => setActiveTab('studio')}
            />

            {!project.blueprint && (
              <div className="text-center pt-2">
                <button
                  onClick={handleBuildBlueprint}
                  disabled={isBuildingBlueprint}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 inline-flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Next Stage: Build Product Blueprint</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Pane: Product Blueprint */}
            <div className="lg:col-span-4 space-y-4">
              {project.blueprint ? (
                <BlueprintView
                  blueprint={project.blueprint}
                  onGenerateUI={handleGenerateUI}
                  isGeneratingUI={isGeneratingUI}
                />
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                  <div>
                    <h3 className="text-sm font-bold text-white">No Blueprint Generated Yet</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Convert website analysis into a complete SaaS Product Blueprint.
                    </p>
                  </div>
                  <button
                    onClick={handleBuildBlueprint}
                    disabled={isBuildingBlueprint}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-2xl shadow-lg"
                  >
                    Build Product Blueprint
                  </button>
                </div>
              )}
            </div>

            {/* Middle Pane: Live Preview Sandbox */}
            <div className="lg:col-span-5 h-[680px]">
              <LivePreview
                code={project.uiCode}
                productName={project.blueprint?.productName || project.name}
                isGenerating={isGeneratingUI}
                onRegenerate={handleGenerateUI}
              />
            </div>

            {/* Right Pane: AI Chat Studio Editor */}
            <div className="lg:col-span-3 h-[680px]">
              <ChatEditor
                messages={project.chatHistory || []}
                onSendMessage={handleSendMessage}
                isSending={isRefiningChat}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
