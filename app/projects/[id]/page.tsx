'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppRail from '@/components/AppRail';
import AnalysisView from '@/components/AnalysisView';
import StrategyChat from '@/components/StrategyChat';
import FileDirectoryView from '@/components/FileDirectoryView';
import FileDirectoryChat from '@/components/FileDirectoryChat';
import BlueprintView from '@/components/BlueprintView';
import BlueprintChat from '@/components/BlueprintChat';
import BuildProgress, { BuildCategoryStatus } from '@/components/BuildProgress';
import PipelineStepper from '@/components/PipelineStepper';
import TerminalWidget from '@/components/TerminalWidget';
import VSCodeEditor from '@/components/VSCodeEditor';
import { Project, ChatMessage, ProjectFile } from '@/types';
import { getDefaultFullStackFiles } from '@/lib/groq';
import { getAuthToken } from '@/lib/auth';
import { Layers, Database, Globe, ArrowLeft, Terminal, Sparkles, Play, Code, Lock, FolderTree, ArrowRight } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CATEGORY_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend / API',
  database: 'Database',
  config: 'Config',
};

export default function ProjectStudioPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isGeneratingFileDirectory, setIsGeneratingFileDirectory] = useState(false);
  const [isBuildingProduct, setIsBuildingProduct] = useState(false);
  const [buildCategories, setBuildCategories] = useState<BuildCategoryStatus[]>([]);
  const [isRefiningChat, setIsRefiningChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [pipelineStep, setPipelineStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analysis' | 'fileDirectory' | 'vscode' | 'studio' | 'terminal'>('vscode');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.project) {
        throw new Error(data.error || 'Failed to load project details.');
      }

      const proj: Project = data.project;
      setProject(proj);

      // Auto-progress pipeline stepper based on project state
      if (proj.generatedFiles && proj.generatedFiles.length > 0) {
        setPipelineStep(5);
        setActiveTab('vscode');
      } else if (proj.fileDirectory) {
        setPipelineStep(4);
        setActiveTab('fileDirectory');
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

  // Silent refetch used by the Strategy/File Directory assistants' "refresh"
  // action — updates project data in place without the full-page loading
  // spinner, so it doesn't unmount the chat panels and wipe the conversation.
  const refreshProjectSilently = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success && data.project) {
        setProject(data.project);
      }
    } catch {
      // Non-fatal — the chat already has the latest data in memory from the
      // API response; this just re-syncs from the server.
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Strategy is finalized -> plan the concrete file directory (metadata
  // blueprint + file tree/routes/components/entities). No code yet.
  const handleGenerateFileDirectory = async () => {
    if (!projectId) return;
    setIsGeneratingFileDirectory(true);
    setPipelineStep(3);

    try {
      const res = await fetch('/api/file-directory/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate the file directory.');
      }

      setProject((prev) =>
        prev ? { ...prev, blueprint: data.blueprint, fileDirectory: data.fileDirectory } : null
      );
      setPipelineStep(4);
    } catch (err: any) {
      alert(err?.message || 'Error generating file directory');
    } finally {
      setIsGeneratingFileDirectory(false);
    }
  };

  const RATE_LIMIT_WAIT_SECONDS = 60;
  const MAX_ATTEMPTS_PER_CATEGORY = 3;

  const waitWithCountdown = async (type: string, seconds: number) => {
    for (let s = seconds; s > 0; s--) {
      setBuildCategories((prev) => prev.map((c) => (c.type === type ? { ...c, status: 'rate-limited', retryInSeconds: s } : c)));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  // Builds one category, retrying with a real 60s cooldown (with a visible
  // countdown) if Groq rate-limits us — instead of silently reporting
  // "success" with blank placeholder files.
  const buildCategory = async (
    type: string,
    label: string,
    attempt = 1
  ): Promise<boolean> => {
    setBuildCategories((prev) => prev.map((c) => (c.type === type ? { ...c, status: 'loading' } : c)));
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ projectId, category: type }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProject((prev) => (prev ? { ...prev, generatedFiles: data.generatedFiles } : null));
        setBuildCategories((prev) => prev.map((c) => (c.type === type ? { ...c, status: 'done' } : c)));
        return true;
      }

      if (data.rateLimited && attempt < MAX_ATTEMPTS_PER_CATEGORY) {
        await waitWithCountdown(type, RATE_LIMIT_WAIT_SECONDS);
        return buildCategory(type, label, attempt + 1);
      }

      throw new Error(data.error || `Failed to build ${label}`);
    } catch {
      setBuildCategories((prev) => prev.map((c) => (c.type === type ? { ...c, status: 'error' } : c)));
      return false;
    }
  };

  // File directory is verified -> build. One category at a time, against the
  // EXACT file list the user already reviewed, so progress is real (not
  // simulated) and Build never invents a different file list.
  const handleBuildProduct = async () => {
    if (!project?.fileDirectory || isBuildingProduct) return;

    const types = Array.from(new Set(project.fileDirectory.files.map((f) => f.type)));
    const initial: BuildCategoryStatus[] = types.map((type) => ({
      type,
      label: CATEGORY_LABELS[type] || type,
      fileCount: project.fileDirectory!.files.filter((f) => f.type === type).length,
      status: 'pending',
    }));
    setBuildCategories(initial);
    setIsBuildingProduct(true);

    for (const cat of initial) {
      await buildCategory(cat.type, cat.label);
    }

    setIsBuildingProduct(false);
    setPipelineStep(5);
    setActiveTab('vscode');
    setIsFullscreen(true);
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
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
      <div className="min-h-screen flex flex-col bg-ink text-bone md:pl-24">
        <AppRail />
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-6 h-6 border-2 border-line border-t-molten rounded-full animate-spin"></div>
          <p className="mono-label">loading studio…</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-ink text-bone md:pl-24">
        <AppRail />
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <p className="mono-label !text-molten !tracking-normal !text-[11px]">{error || 'Project not found.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mono-label border border-line hover:border-molten/40 hover:text-bone px-4 py-2 transition-colors"
          >
            ← Console
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

  // Full-screen code view — just the code, no page chrome. Entered
  // automatically once Build finishes, or manually via the maximize toggle.
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-ink p-3 sm:p-4">
        <VSCodeEditor
          files={activeFiles}
          productName={project.blueprint?.productName || project.name}
          chatHistory={project.chatHistory || []}
          onSendMessage={handleSendMessage}
          isSending={isRefiningChat}
          fullscreen
          onToggleFullscreen={() => setIsFullscreen(false)}
        />
      </div>
    );
  }

  const hasGeneratedCode = Boolean(project.generatedFiles && project.generatedFiles.length > 0);

  const STAGES: { id: typeof activeTab; n: string; label: string; enabled: boolean }[] = [
    { id: 'pipeline', n: '01', label: 'Pipeline', enabled: true },
    { id: 'analysis', n: '02', label: 'Strategy', enabled: !!project.analysis },
    { id: 'fileDirectory', n: '03', label: 'Blueprint', enabled: !!project.analysis },
    { id: 'vscode', n: '04', label: 'Code', enabled: hasGeneratedCode },
    { id: 'terminal', n: '05', label: 'Export', enabled: hasGeneratedCode },
  ];
  const currentStage = STAGES.find((s) => s.id === activeTab) ?? STAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-ink text-bone md:pl-24 pb-9">
      <AppRail />

      {/* Workspace bar */}
      <div className="rule-b border-line bg-ink-soft">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-steel hover:text-molten transition-colors shrink-0"
              title="Back to console"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-bone truncate">
                {project.blueprint?.productName || project.name}
              </h1>
              <p className="mono-label !text-[9px] flex items-center gap-1 truncate">
                <span className="w-1 h-1 bg-molten shrink-0" />
                {project.websiteUrl || 'idea-only'}
              </p>
            </div>
          </div>

          {/* Numbered stage nav */}
          <div className="flex items-stretch">
            {STAGES.map((s) => {
              const active = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => s.enabled && setActiveTab(s.id)}
                  disabled={!s.enabled}
                  className={`relative px-3 py-2 flex items-center gap-1.5 transition-colors ${
                    !s.enabled
                      ? 'text-steel/40 cursor-not-allowed'
                      : active
                      ? 'text-bone'
                      : 'text-steel hover:text-bone'
                  }`}
                >
                  {active && <span className="absolute left-0 right-0 -bottom-3 h-[2px] bg-molten" />}
                  <span className={`font-mono text-[9px] ${active ? 'text-molten' : ''}`}>{s.n}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Console strip */}
      <div className="fixed bottom-0 left-0 right-0 md:left-24 z-30 rule-t border-line bg-ink-soft">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-9 flex items-center gap-3 mono-label !text-[9px] overflow-x-auto">
          <span className="text-molten">STAGE {currentStage.n}/05</span>
          <span className="text-steel/40">·</span>
          <span>{currentStage.label.toLowerCase()}</span>
          <span className="text-steel/40">·</span>
          <span>groq / gpt-oss-120b</span>
          <span className="text-steel/40">·</span>
          <span className="truncate">{project.blueprint?.productName || project.name}</span>
        </div>
      </div>

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl mx-auto px-5 sm:px-8 py-8 w-full space-y-6">
        {activeTab === 'pipeline' ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <PipelineStepper
              currentStep={pipelineStep}
              scrapedTitle={project.scrapedInfo?.title}
              scrapedHeadings={project.scrapedInfo?.headings}
              productName={project.blueprint?.productName}
              onContinueToStudio={() => setActiveTab('vscode')}
            />

            {project.analysis && !project.fileDirectory && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setActiveTab('fileDirectory')}
                  className="bg-molten hover:opacity-90 text-ink font-bold text-xs px-6 py-3 rounded-none  inline-flex items-center space-x-2 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Continue to Product File Directory</span>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'analysis' && project.analysis ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
            <AnalysisView
              analysis={project.analysis}
              scrapedInfo={project.scrapedInfo}
              onBuildProduct={() => setActiveTab('fileDirectory')}
              isBuilding={false}
            />
            <div className="h-[600px] lg:sticky lg:top-20">
              <StrategyChat
                projectId={project.id}
                analysis={project.analysis}
                initialMessages={project.strategyChatHistory || []}
                onAnalysisUpdated={(updated) =>
                  setProject((prev) => (prev ? { ...prev, analysis: updated } : null))
                }
                onRefresh={refreshProjectSilently}
              />
            </div>
          </div>
        ) : activeTab === 'fileDirectory' && project.analysis ? (
          <div className="max-w-7xl mx-auto space-y-6">
            {!project.fileDirectory ? (
              <div className="max-w-xl mx-auto text-center py-16 space-y-4 bg-ink-soft border border-line rounded-none ">
                <div className="w-12 h-12 rounded-none bg-molten/10 border border-molten/30 flex items-center justify-center mx-auto text-molten">
                  <FolderTree className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-bone">Plan the Product File Directory</h3>
                  <p className="text-xs text-steel mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Groq will plan the exact file tree, routes, components, and data entities this product
                    needs — no code is written yet.
                  </p>
                </div>
                <button
                  onClick={handleGenerateFileDirectory}
                  disabled={isGeneratingFileDirectory}
                  className="bg-molten hover:opacity-90 text-ink font-bold text-xs px-6 py-3 rounded-none  inline-flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGeneratingFileDirectory ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-ink/40 border-t-ink animate-spin"></div>
                      <span>Planning File Directory...</span>
                    </>
                  ) : (
                    <>
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>Generate File Directory</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </button>
              </div>
            ) : isBuildingProduct ? (
              <BuildProgress categories={buildCategories} />
            ) : (
              <div className="space-y-8">
                {/* Proposed product — edit name / features / navigation / pages /
                    UI direction in plain English before planning the file tree. */}
                {project.blueprint && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-bone flex items-center gap-2">
                        <Layers className="w-4 h-4 text-molten" /> Proposed Product
                      </h3>
                      <p className="text-[11px] text-steel mt-0.5">
                        Modify the concept through chat — &quot;make it premium&quot;, &quot;add a dashboard&quot;,
                        &quot;remove the pricing page&quot;, &quot;make it enterprise-ready&quot;.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
                      <BlueprintView blueprint={project.blueprint} />
                      <div className="h-[600px] lg:sticky lg:top-20">
                        <BlueprintChat
                          projectId={project.id}
                          blueprint={project.blueprint}
                          initialMessages={project.blueprintChatHistory || []}
                          onBlueprintUpdated={(updated) =>
                            setProject((prev) => (prev ? { ...prev, blueprint: updated } : null))
                          }
                          onRefresh={refreshProjectSilently}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-bone flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-molten" /> Proposed File Structure
                    </h3>
                    <p className="text-[11px] text-steel mt-0.5">
                      The exact file tree Build will generate code for. Refine it, then build.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
                    <FileDirectoryView
                      fileDirectory={project.fileDirectory}
                      onBuildProduct={handleBuildProduct}
                      isBuilding={isBuildingProduct}
                    />
                    <div className="h-[600px] lg:sticky lg:top-20">
                      <FileDirectoryChat
                        projectId={project.id}
                        fileDirectory={project.fileDirectory}
                        initialMessages={project.fileDirectoryChatHistory || []}
                        onFileDirectoryUpdated={(updated) =>
                          setProject((prev) => (prev ? { ...prev, fileDirectory: updated } : null))
                        }
                        onRefresh={refreshProjectSilently}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              fullscreen={false}
              onToggleFullscreen={() => setIsFullscreen(true)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
