'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppRail from '@/components/AppRail';
import AnalysisView from '@/components/AnalysisView';
import FileDirectoryView from '@/components/FileDirectoryView';
import BlueprintView from '@/components/BlueprintView';
import StageChat from '@/components/StageChat';
import SourceCastDiff from '@/components/SourceCastDiff';
import PlanSkeleton from '@/components/PlanSkeleton';
import { LimelightNav } from '@/components/ui/limelight-nav';
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

  // Generate ONE planned file, retrying with a real 60s cooldown (visible
  // countdown on its category) if Groq rate-limits us.
  const buildOneFile = async (type: string, filePath: string, attempt = 1): Promise<boolean> => {
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ projectId, filePath }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProject((prev) => (prev ? { ...prev, generatedFiles: data.generatedFiles } : null));
        return true;
      }
      if (data.rateLimited && attempt < MAX_ATTEMPTS_PER_CATEGORY) {
        await waitWithCountdown(type, RATE_LIMIT_WAIT_SECONDS);
        return buildOneFile(type, filePath, attempt + 1);
      }
      return false;
    } catch {
      return false;
    }
  };

  // Build a category file-by-file so progress reads "5/10". RESUMABLE — files
  // that already generated successfully are skipped, so a retry only does the
  // ones that are still missing.
  const buildCategory = async (type: string, _label: string): Promise<boolean> => {
    const catFiles = project?.fileDirectory?.files.filter((f) => f.type === type) || [];
    const alreadyDone = new Set(
      (project?.generatedFiles || [])
        .filter((f) => f.content && !f.content.startsWith('// Placeholder generated for'))
        .map((f) => f.path)
    );
    const remaining = catFiles.filter((f) => !alreadyDone.has(f.path));
    let done = catFiles.length - remaining.length;

    setBuildCategories((prev) =>
      prev.map((c) => (c.type === type ? { ...c, status: 'loading', done, total: catFiles.length } : c))
    );

    if (remaining.length === 0) {
      setBuildCategories((prev) => prev.map((c) => (c.type === type ? { ...c, status: 'done', done } : c)));
      return true;
    }

    for (const f of remaining) {
      const ok = await buildOneFile(type, f.path);
      if (!ok) {
        setBuildCategories((prev) => prev.map((c) => (c.type === type ? { ...c, status: 'error', done } : c)));
        return false;
      }
      done += 1;
      setBuildCategories((prev) => prev.map((c) => (c.type === type ? { ...c, status: 'loading', done } : c)));
    }

    setBuildCategories((prev) => prev.map((c) => (c.type === type ? { ...c, status: 'done', done } : c)));
    return true;
  };

  const [isRetryingBuild, setIsRetryingBuild] = useState(false);

  const enterStudio = () => {
    setBuildCategories([]);
    setPipelineStep(5);
    setActiveTab('vscode');
    setIsFullscreen(true);
  };

  // Run a set of categories sequentially. Returns true only if every one
  // succeeded.
  const runCategories = async (cats: { type: string; label: string }[]): Promise<boolean> => {
    let allOk = true;
    for (const cat of cats) {
      const ok = await buildCategory(cat.type, cat.label);
      if (!ok) allOk = false;
    }
    return allOk;
  };

  // File directory is verified -> build. One category at a time, against the
  // EXACT file list the user already reviewed.
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

    const allOk = await runCategories(initial);

    setIsBuildingProduct(false);
    // Only drop into the studio if the whole build succeeded. Otherwise keep
    // BuildProgress up so the user can retry just the failed categories.
    if (allOk) enterStudio();
  };

  // Enter the studio if — after a retry — every category is now done.
  const maybeEnterStudio = () => {
    setBuildCategories((prev) => {
      if (prev.length > 0 && prev.every((c) => c.status === 'done')) setTimeout(enterStudio, 0);
      return prev;
    });
  };

  const handleRetryFailed = async () => {
    if (isRetryingBuild || isBuildingProduct) return;
    const failed = buildCategories.filter((c) => c.status === 'error');
    if (failed.length === 0) return;

    setIsRetryingBuild(true);
    setBuildCategories((prev) => prev.map((c) => (c.status === 'error' ? { ...c, status: 'pending' } : c)));
    await runCategories(failed.map((c) => ({ type: c.type, label: c.label })));
    setIsRetryingBuild(false);
    maybeEnterStudio();
  };

  // Retry a single failed category — regenerates only its still-missing files.
  const handleRetryCategory = async (type: string) => {
    if (isRetryingBuild || isBuildingProduct) return;
    const cat = buildCategories.find((c) => c.type === type);
    if (!cat || cat.status !== 'error') return;

    setIsRetryingBuild(true);
    setBuildCategories((prev) => prev.map((c) => (c.type === type ? { ...c, status: 'pending' } : c)));
    await buildCategory(type, cat.label);
    setIsRetryingBuild(false);
    maybeEnterStudio();
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
          onExport={() => { setIsFullscreen(false); setActiveTab('terminal'); }}
        />
      </div>
    );
  }

  const hasGeneratedCode = Boolean(project.generatedFiles && project.generatedFiles.length > 0);

  const STAGES: { id: typeof activeTab; n: string; label: string; icon: React.ReactElement; enabled: boolean }[] = [
    { id: 'pipeline', n: '01', label: 'Pipeline', icon: <Sparkles />, enabled: true },
    { id: 'analysis', n: '02', label: 'Strategy', icon: <Layers />, enabled: !!project.analysis },
    { id: 'fileDirectory', n: '03', label: 'Blueprint', icon: <FolderTree />, enabled: !!project.analysis },
    { id: 'vscode', n: '04', label: 'Code', icon: <Code />, enabled: hasGeneratedCode },
    { id: 'terminal', n: '05', label: 'Export', icon: <Terminal />, enabled: hasGeneratedCode },
  ];
  const currentStage = STAGES.find((s) => s.id === activeTab) ?? STAGES[0];
  const currentIdx = STAGES.findIndex((s) => s.id === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-ink text-bone md:pl-24 pb-9">
      <AppRail />

      {/* Workspace bar — title row, then the stage nav on its own row so it
          never collides with AppRail's floating top-right controls */}
      <div className="rule-b border-line bg-ink-soft">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-4 pb-3 space-y-3">
          <div className="flex items-center gap-3 min-w-0 pr-28 sm:pr-40">
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

          <div className="overflow-x-auto -mx-1 px-1">
            <LimelightNav
              activeIndex={currentIdx < 0 ? 0 : currentIdx}
              items={STAGES.map((s) => ({
                id: s.id,
                icon: s.icon,
                label: s.label,
                disabled: !s.enabled,
                onClick: () => s.enabled && setActiveTab(s.id),
              }))}
            />
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

      {/* Main Workspace Content — remounts per stage so it re-typesets */}
      <main key={activeTab} className="flex-1 max-w-7xl mx-auto px-5 sm:px-8 py-8 w-full space-y-6 recast-in">
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
          <div className="max-w-7xl mx-auto space-y-4">
            <SourceCastDiff
              compact
              sourceLabel={project.scrapedInfo?.url || 'brief'}
              source={[
                { k: 'title', v: project.scrapedInfo?.title || project.description.slice(0, 60) },
                { k: 'headings', v: `${project.scrapedInfo?.headings?.length ?? 0} scraped` },
                { k: 'reads as', v: project.analysis.summary.slice(0, 90) },
              ]}
              castLabel="strategy"
              cast={[
                { k: 'problem', v: project.analysis.coreProblem.slice(0, 90) },
                { k: 'model', v: project.analysis.businessModel.slice(0, 70) },
                { k: 'features', v: `${project.analysis.keyFeatures.length} key features` },
              ]}
            />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
              <AnalysisView
                analysis={project.analysis}
                scrapedInfo={project.scrapedInfo}
                onBuildProduct={() => setActiveTab('fileDirectory')}
                isBuilding={false}
              />
              <div className="h-[600px] lg:sticky lg:top-20">
                <StageChat
                  stage="strategy"
                  projectId={project.id}
                  initialMessages={project.strategyChatHistory || []}
                  onApplied={(a) => setProject((prev) => (prev ? { ...prev, analysis: a } : null))}
                  onRefresh={refreshProjectSilently}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'fileDirectory' && project.analysis ? (
          <div className="max-w-7xl mx-auto space-y-6">
            {isGeneratingFileDirectory ? (
              <PlanSkeleton />
            ) : !project.fileDirectory ? (
              <div className="panel max-w-xl mx-auto p-8 recast-in">
                <span className="section-num">03 — BLUEPRINT + FILE TREE</span>
                <h3 className="font-display text-lg font-semibold text-bone mt-2">Draw the blueprint</h3>
                <p className="text-[13px] text-steel mt-1.5 leading-relaxed max-w-sm">
                  Recast plans the proposed product and the exact file tree — routes, components,
                  data entities. No code is written yet.
                </p>
                <button
                  onClick={handleGenerateFileDirectory}
                  disabled={isGeneratingFileDirectory}
                  className="mt-5 inline-flex items-center gap-2 bg-molten text-ink px-5 py-2.5 font-mono font-bold text-[10px] uppercase tracking-[0.14em] disabled:opacity-40 transition-opacity"
                >
                  Generate
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.75} />
                </button>
              </div>
            ) : isBuildingProduct || buildCategories.some((c) => c.status === 'error') ? (
              <BuildProgress
                categories={buildCategories}
                building={isBuildingProduct}
                retrying={isRetryingBuild}
                onRetry={handleRetryFailed}
                onRetryCategory={handleRetryCategory}
                onContinue={enterStudio}
              />
            ) : (
              /* One assistant for the whole product plan — blueprint + file tree */
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
                <div className="space-y-6 min-w-0">
                  {/* Primary action, up top */}
                  <div className="panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="section-num">03 — PRODUCT PLAN</span>
                      <p className="text-[12px] text-steel mt-1">
                        Review the blueprint and file tree below. Refine with the assistant, then write the code.
                      </p>
                    </div>
                    <button
                      onClick={handleBuildProduct}
                      disabled={isBuildingProduct}
                      className="group inline-flex items-center gap-2 bg-molten text-ink px-5 py-3 font-mono font-bold text-[11px] uppercase tracking-[0.14em] disabled:opacity-40 transition-opacity shrink-0"
                    >
                      {isBuildingProduct ? 'Building…' : 'Write the code'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.75} />
                    </button>
                  </div>

                  {project.analysis && (
                    <SourceCastDiff
                      compact
                      sourceLabel="strategy"
                      source={[
                        { k: 'users', v: project.analysis.targetUsers.join(', ').slice(0, 70) },
                        { k: 'problem', v: project.analysis.coreProblem.slice(0, 90) },
                      ]}
                      castLabel="product"
                      cast={[
                        { k: 'name', v: project.blueprint?.productName || '—' },
                        { k: 'tagline', v: project.blueprint?.tagline || '—' },
                        { k: 'scope', v: `${project.blueprint?.features.length ?? 0} features · ${project.blueprint?.pages.length ?? 0} pages · ${project.fileDirectory.files.length} files` },
                      ]}
                    />
                  )}
                  {project.blueprint && <BlueprintView blueprint={project.blueprint} />}
                  <FileDirectoryView
                    fileDirectory={project.fileDirectory}
                    onBuildProduct={handleBuildProduct}
                    isBuilding={isBuildingProduct}
                    showBuildButton={false}
                  />
                </div>

                <div className="lg:sticky lg:top-20 h-[560px] lg:h-[calc(100vh-9rem)]">
                  <StageChat
                    stage="product"
                    projectId={project.id}
                    initialMessages={[
                      ...(project.blueprintChatHistory || []),
                      ...(project.fileDirectoryChatHistory || []),
                    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt))}
                    onApplied={(u: { blueprint?: any; fileDirectory?: any }) =>
                      setProject((prev) =>
                        prev
                          ? {
                              ...prev,
                              blueprint: u.blueprint ?? prev.blueprint,
                              fileDirectory: u.fileDirectory ?? prev.fileDirectory,
                            }
                          : null
                      )
                    }
                    onRefresh={refreshProjectSilently}
                  />
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
              onExport={() => setActiveTab('terminal')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
