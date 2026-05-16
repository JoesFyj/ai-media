'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/lib/store';
import { WRITING_STYLES } from '@/lib/ai/prompts';
import { buildPreferencePrompt, classifyTitle, WRITING_RULES } from '@/lib/preferences';
import {
  Sparkles, FileText, Wand2, Copy, Check, ChevronRight, ChevronLeft,
  Lightbulb, PenTool, BookOpen, MessageSquare, Trash2, Edit3, Save, Loader2,
  Plus, Minus, ArrowRight, CheckCircle2, Circle, Brain, Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface ArticleSection {
  heading: string;
  points: string[];
  content: string;
  status: 'pending' | 'writing' | 'editing' | 'completed';
  originalHeading?: string;
  originalPoints?: string[];
  originalContent?: string;
}

 // 调用DeepSeek API
async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('请先配置DeepSeek API密钥');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API调用失败: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 微信文章格式化函数 - 适配微信公众号编辑器
function formatForWeChat(title: string, content: string, readingTime: string): string {
  const lines: string[] = [];

  // 标题 - 居中显示
  lines.push(`<h2 style="text-align: center;">${title}</h2>`);
  lines.push('<p></p>'); // 空行

  // 元信息
  lines.push(`<p style="text-align: center; color: #999; font-size: 14px;">约${readingTime}阅读</p>`);
  lines.push('<hr/>'); // 分割线
  lines.push('<p></p>'); // 空行

  // 处理正文内容
  // 先按双换行分割成段落
  const paragraphs = content.split(/\n\n+/);

  paragraphs.forEach(p => {
    const trimmed = p.trim();
    if (!trimmed) return;

    // 判断是否是章节标题（以 一、二、三... 或 【 开头）
    const isHeading = /^[一二三四五六七八九十]、/.test(trimmed) || /^\[.+?\]$/.test(trimmed);

    if (isHeading) {
      // 章节标题：居中 + 加粗
      lines.push(`<h3 style="text-align: center;">${trimmed}</h3>`);
      lines.push('<p></p>');
    } else {
      // 正文段落：首行缩进 + 行高
      lines.push(`<p style="text-indent: 2em; line-height: 1.8;">${trimmed}</p>`);
    }
  });

  // 结尾分割线
  lines.push('<p></p>');
  lines.push('<hr/>');
  lines.push('<p></p>');

  // 结束语
  lines.push(`<p style="text-align: center; color: #999; font-size: 14px;">- END -</p>`);

  return lines.join('\n');
}

function CreateWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    addDraft, addTopic,
    userPreferences, recordEdit, finalizeLearning,
    clearCurrentSessionEdits
  } = useStore();

  // 从 URL 获取选题参数
  const initialTopic = searchParams.get('topic') ? decodeURIComponent(searchParams.get('topic')!) : '';
  const initialDesc = searchParams.get('desc') ? decodeURIComponent(searchParams.get('desc')!) : '';
  const topicId = searchParams.get('topicId') || '';

  const [topic, setTopic] = useState(initialTopic);
  const [desc, setDesc] = useState(initialDesc);
  const [platform, setPlatform] = useState<'wechat' | 'zhihu' | 'both'>('both');
  const [style, setStyle] = useState('怼人流');
  const [error, setError] = useState<string | null>(null);

  // 流程状态：topic -> outline -> writing -> content
  const [step, setStep] = useState<'topic' | 'outline' | 'writing' | 'content'>('topic');
  const [isGenerating, setIsGenerating] = useState(false);

  // 大纲状态
  const [sections, setSections] = useState<ArticleSection[]>([]);
  const [editingOutline, setEditingOutline] = useState(false);
  const [outlineTitle, setOutlineTitle] = useState('');
  const [originalOutlineTitle, setOriginalOutlineTitle] = useState('');

  // 当前写作状态
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isWritingSection, setIsWritingSection] = useState(false);

  // 最终文章
  const [finalArticle, setFinalArticle] = useState<{
    title: string;
    content: string;
    wordCount: number;
    readingTime: string;
  } | null>(null);
  const [titles, setTitles] = useState<string[]>([]);

  // 学习进度提示
  const [showPreferenceTip, setShowPreferenceTip] = useState(false);

  // 显示学习进度提示
  useEffect(() => {
    if (userPreferences.totalArticles > 0 && userPreferences.learningProgress !== 'initial') {
      setShowPreferenceTip(true);
      const timer = setTimeout(() => setShowPreferenceTip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [userPreferences.totalArticles, userPreferences.learningProgress]);

  // 生成大纲
  const handleGenerateOutline = async () => {
    if (!topic.trim()) {
      toast.error('请输入选题');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      // 构建偏好提示词
      const preferenceHint = buildPreferencePrompt(userPreferences);

      const prompt = `你是一个拥有百万粉丝的AI科普自媒体博主。请根据以下选题，生成一篇能引发讨论的爆款文章大纲。

选题：${topic}
${desc ? `核心观点：${desc}` : ''}
切入角度：${style}
${preferenceHint}

请按以下JSON格式返回文章大纲：
{
  "title": "文章标题（要有争议性、能引发讨论）",
  "sections": [
    {
      "heading": "章节标题（要有爆点）",
      "points": ["观点1", "观点2", "观点3"]
    }
  ]
}

大纲要求：
- 5个章节，层层递进
- 每个章节2-3个观点，观点要精炼、有冲击力
- 每个章节要有"钩子"，让人想看下去
- 适当设置对立观点，引发思考
- 结尾要有"彩蛋"或行动号召`;

      const result = await callDeepSeek(prompt);

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const newSections: ArticleSection[] = (parsed.sections || []).map((s: { heading: string; points: string[] }) => ({
          heading: s.heading,
          points: s.points.slice(0, 3),
          content: '',
          status: 'pending' as const,
          originalHeading: s.heading,
          originalPoints: s.points.slice(0, 3)
        }));
        setSections(newSections);
        setOutlineTitle(parsed.title || topic);
        setOriginalOutlineTitle(parsed.title || topic);
      } else {
        // 默认大纲
        setOutlineTitle(topic);
        setOriginalOutlineTitle(topic);
        setSections([
          { heading: '一、先说个反常识的结论', points: ['抛出争议性观点', '让人想反驳你', '引发好奇心'], content: '', status: 'pending' },
          { heading: '二、扒一扒背后的真相', points: ['深度分析', '数据支撑', '案例佐证'], content: '', status: 'pending' },
          { heading: '三、我就是要怼的几个点', points: ['怼行业痛点', '怼常见误区', '怼权威说法'], content: '', status: 'pending' },
          { heading: '四、但是...（转折来了）', points: ['给出一个反转让文章更立体', '展现辩证思维'], content: '', status: 'pending' },
          { heading: '五、最后说点得罪人的话', points: ['给结论', '留个彩蛋', '引发讨论'], content: '', status: 'pending' }
        ]);
      }

      setStep('outline');
      toast.success('大纲生成成功，请检查和修改');
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 更新大纲标题 - 记录修改
  const updateOutlineTitle = (newTitle: string) => {
    if (newTitle !== outlineTitle && outlineTitle) {
      recordEdit({
        type: 'outline',
        original: outlineTitle,
        modified: newTitle,
        context: 'title'
      });
    }
    setOutlineTitle(newTitle);
  };

  // 更新章节标题 - 记录修改
  const updateSectionHeading = (index: number, newHeading: string) => {
    const section = sections[index];
    if (section && newHeading !== section.heading && section.originalHeading) {
      recordEdit({
        type: 'heading',
        original: section.heading,
        modified: newHeading,
        context: `section-${index}`
      });
    }
    setSections(prev => prev.map((s, i) => i === index ? { ...s, heading: newHeading } : s));
  };

  // 更新观点 - 记录修改
  const updateSectionPoint = (sectionIndex: number, pointIndex: number, newPoint: string) => {
    const section = sections[sectionIndex];
    if (section && newPoint !== section.points[pointIndex]) {
      recordEdit({
        type: 'point',
        original: section.points[pointIndex],
        modified: newPoint,
        context: `section-${sectionIndex}-point-${pointIndex}`
      });
    }
    setSections(prev => prev.map((s, i) => {
      if (i === sectionIndex) {
        const newPoints = [...s.points];
        newPoints[pointIndex] = newPoint;
        return { ...s, points: newPoints };
      }
      return s;
    }));
  };

  // 添加观点 - 记录修改
  const addSectionPoint = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (section && section.points.length < 3) {
      recordEdit({
        type: 'point',
        original: '',
        modified: '新观点',
        context: `section-${sectionIndex}-new-point`
      });
    }
    setSections(prev => prev.map((s, i) => {
      if (i === sectionIndex && s.points.length < 3) {
        return { ...s, points: [...s.points, '新观点'] };
      }
      return s;
    }));
  };

  // 删除观点 - 记录修改
  const removeSectionPoint = (sectionIndex: number, pointIndex: number) => {
    const section = sections[sectionIndex];
    if (section && section.points.length > 1) {
      recordEdit({
        type: 'point',
        original: section.points[pointIndex],
        modified: '',
        context: `section-${sectionIndex}-removed-point`
      });
    }
    setSections(prev => prev.map((s, i) => {
      if (i === sectionIndex && s.points.length > 1) {
        return { ...s, points: s.points.filter((_, pi) => pi !== pointIndex) };
      }
      return s;
    }));
  };

  // 添加章节
  const addSection = () => {
    recordEdit({
      type: 'outline',
      original: '',
      modified: '新章节',
      context: 'new-section'
    });
    setSections(prev => [...prev, {
      heading: `第${prev.length + 1}章`,
      points: ['观点1', '观点2'],
      content: '',
      status: 'pending',
      originalHeading: `第${prev.length + 1}章`,
      originalPoints: ['观点1', '观点2']
    }]);
  };

  // 删除章节
  const removeSection = (index: number) => {
    if (sections.length > 1) {
      const section = sections[index];
      recordEdit({
        type: 'outline',
        original: section.heading,
        modified: '',
        context: `removed-section-${index}`
      });
      setSections(prev => prev.filter((_, i) => i !== index));
    }
  };

  // 开始逐段写作
  const handleStartWriting = () => {
    if (sections.length === 0) {
      toast.error('请先生成大纲');
      return;
    }
    setCurrentSectionIndex(0);
    setSections(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'writing' as const } : s));
    setStep('writing');
  };

  // AI 写一段 - 应用用户偏好
  const handleWriteSection = async () => {
    if (currentSectionIndex >= sections.length) return;

    const currentSection = sections[currentSectionIndex];
    const previousContent = sections
      .filter((s, i) => i < currentSectionIndex && s.status === 'completed')
      .map(s => `${s.heading}\n${s.content}`)
      .join('\n\n');

    setIsWritingSection(true);
    try {
      // 构建偏好提示词
      const preferenceHint = buildPreferencePrompt(userPreferences);

      const prompt = `你是一个拥有百万粉丝的AI科普自媒体博主。

${WRITING_RULES}
${preferenceHint}

请根据以下大纲，写一个章节的内容。

选题：${topic}
章节标题：${currentSection.heading}
章节观点：
${currentSection.points.map((p, i) => `${i + 1}. ${p}`).join('\n')}

${previousContent ? `前文内容：\n${previousContent}\n\n请衔接前文，写出这个章节的内容。` : ''}

写作要求：
- 禁止反问句！！！
- 层层递进，像剥洋葱，让读者欲罢不能
- 每句话都有信息量，不废话，不重复
- 开头直接抛出观点或结论，让读者快速知道讲什么
- 像看小说一样，一层层往里面扒
- ${style === '怼人流' ? '敢说敢怼，不怕得罪人' : '要有深度，展现专业性'}
- 200-500字，观点精炼

请直接输出章节内容，不需要标题。`;

      const content = await callDeepSeek(prompt);

      setSections(prev => prev.map((s, i) =>
        i === currentSectionIndex ? {
          ...s,
          content,
          status: 'editing' as const,
          originalContent: content
        } : s
      ));

      toast.success(`第 ${currentSectionIndex + 1} 章初稿完成，请检查和修改`);
    } catch (err) {
      toast.error('生成失败，请重试');
    } finally {
      setIsWritingSection(false);
    }
  };

  // 用户修改内容 - 记录修改
  const updateSectionContent = (index: number, content: string) => {
    const section = sections[index];
    if (section && content !== section.content && section.originalContent) {
      // 只有在AI生成后才记录用户修改
      recordEdit({
        type: 'content',
        original: section.content,
        modified: content,
        context: `section-${index}`
      });
    }
    setSections(prev => prev.map((s, i) => i === index ? { ...s, content } : s));
  };

  // 确认本段，进入下一段
  const handleConfirmSection = () => {
    const currentSection = sections[currentSectionIndex];
    if (!currentSection.content.trim()) {
      toast.error('请先生成内容或输入内容');
      return;
    }

    // 检查用户是否修改了内容
    if (currentSection.originalContent && currentSection.content !== currentSection.originalContent) {
      // 用户修改了内容
      recordEdit({
        type: 'content',
        original: currentSection.originalContent,
        modified: currentSection.content,
        context: `section-${currentSectionIndex}-confirmed`
      });
    }

    // 标记当前段落完成，进入下一段
    const nextIndex = currentSectionIndex + 1;

    if (nextIndex >= sections.length) {
      // 所有段落完成，生成最终文章
      setSections(prev => prev.map((s, i) =>
        i === currentSectionIndex ? { ...s, status: 'completed' as const } : s
      ));
      handleFinalizeArticle();
    } else {
      setSections(prev => prev.map((s, i) =>
        i === currentSectionIndex ? { ...s, status: 'completed' as const } :
        i === nextIndex ? { ...s, status: 'writing' as const } : s
      ));
      setCurrentSectionIndex(nextIndex);
      toast.success(`第 ${currentSectionIndex + 1} 章已确认，开始第 ${nextIndex + 1} 章`);
    }
  };

  // 重新生成当前段落
  const handleRegenerateSection = () => {
    setSections(prev => prev.map((s, i) =>
      i === currentSectionIndex ? { ...s, status: 'writing' as const } : s
    ));
  };

  // 生成最终文章
  const handleFinalizeArticle = () => {
    const fullContent = sections.map(s => `${s.heading}\n\n${s.content}`).join('\n\n');
    const wordCount = fullContent.length;
    const readingTime = Math.ceil(wordCount / 400) + '分钟';

    setFinalArticle({
      title: outlineTitle || topic,
      content: fullContent,
      wordCount,
      readingTime
    });

    // 记录标题修改
    if (outlineTitle !== originalOutlineTitle) {
      recordEdit({
        type: 'outline',
        original: originalOutlineTitle,
        modified: outlineTitle,
        context: 'final-title'
      });
    }

    // 生成标题建议
    handleGenerateTitles(fullContent);

    // 完成学习
    finalizeLearning();

    setStep('content');
    toast.success('文章完成！');
  };

  // 生成标题建议
  const handleGenerateTitles = async (content: string) => {
    try {
      const preferenceHint = buildPreferencePrompt(userPreferences);

      const prompt = `为以下文章生成5个爆炸性标题：

文章主题：${topic}
文章内容摘要：${content.substring(0, 500)}
${preferenceHint}

要求：
- 标题党风格，但不做标题欺诈
- 要有冲击力，能引发好奇心
- 可以用数字、对比，反问
- 让人一看就想点进去看看到底是不是这样

返回5个标题，用换行分隔`;

      const result = await callDeepSeek(prompt);
      const generatedTitles = result
        .split('\n')
        .map((t: string) => t.replace(/^\d+[\.\)、]?\s*/, '').trim())
        .filter((t: string) => t.length > 0 && t.length < 50)
        .slice(0, 5);

      setTitles(generatedTitles);
    } catch {
      setTitles([outlineTitle || topic]);
    }
  };

  // 保存草稿
  const handleSaveDraft = () => {
    if (!finalArticle) return;

    addDraft({
      title: finalArticle.title,
      content: finalArticle.content,
      platform,
      status: 'draft'
    });

    if (topicId) {
      addTopic({
        title: topic,
        description: desc,
        priority: 'high',
        platform,
        status: 'in-progress'
      });
    }

    toast.success('已保存到草稿箱');
  };

  // 复制内容
  const handleCopyContent = (formatted: boolean = false) => {
    if (!finalArticle) return;

    let content = finalArticle.content;
    if (formatted) {
      content = formatForWeChat(finalArticle.title, finalArticle.content, finalArticle.readingTime);
    }

    navigator.clipboard.writeText(content);
    toast.success(formatted ? '已复制带格式的微信文章' : '已复制到剪贴板');
  };

  // 重新开始
  const handleReset = () => {
    clearCurrentSessionEdits();
    setStep('topic');
    setSections([]);
    setFinalArticle(null);
    setTitles([]);
    setCurrentSectionIndex(0);
    setError(null);
    setEditingOutline(false);
  };

  // 学习进度显示
  const getProgressBadge = () => {
    const progress = userPreferences.learningProgress;
    const progressLabels = {
      initial: { label: '初次使用', color: 'bg-gray-100 text-gray-600' },
      learning: { label: '学习中', color: 'bg-blue-100 text-blue-600' },
      adapted: { label: '已适配', color: 'bg-green-100 text-green-600' },
      mastered: { label: '已掌握', color: 'bg-purple-100 text-purple-600' }
    };
    return progressLabels[progress];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI爆款写作</h1>
          <p className="text-muted-foreground mt-1">
            人机协作，一段一段写出爆款文章
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* 学习进度指示器 */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getProgressBadge().color}`}>
            <Brain className="h-4 w-4" />
            <span>{getProgressBadge().label}</span>
            {userPreferences.totalArticles > 0 && (
              <span className="text-xs opacity-70">
                ({userPreferences.totalArticles}篇文章)
              </span>
            )}
          </div>
          {step !== 'topic' && (
            <Button variant="outline" onClick={handleReset}>
              <Trash2 className="h-4 w-4 mr-2" />
              重新开始
            </Button>
          )}
        </div>
      </div>

      {/* 学习进度提示 */}
      {showPreferenceTip && (
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">
                AI正在学习你的风格...
              </p>
              <p className="text-sm text-purple-700 mt-1">
                {userPreferences.learningProgress === 'learning' && (
                  <>已记录 {userPreferences.totalEdits} 次修改，AI正在适应你的写作习惯</>
                )}
                {userPreferences.learningProgress === 'adapted' && (
                  <>AI已经了解你的基本风格，继续写作会越来越精准</>
                )}
                {userPreferences.learningProgress === 'mastered' && (
                  <>AI已经掌握你的风格，会按照你的思路写作</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          <p className="font-medium">生成失败</p>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-sm mt-2">提示：请确保已在 .env.local 中配置 NEXT_PUBLIC_DEEPSEEK_API_KEY</p>
        </div>
      )}

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2">
        <StepIndicator active={step === 'topic'} completed={step !== 'topic'} icon={Lightbulb} label="选题" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator active={step === 'outline'} completed={step === 'writing' || step === 'content'} icon={FileText} label="大纲" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator active={step === 'writing'} completed={step === 'content'} icon={PenTool} label="写作" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator active={step === 'content'} completed={false} icon={CheckCircle2} label="完成" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：设置区域 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {step === 'topic' ? '确认选题' : step === 'outline' ? '修改大纲' : step === 'writing' ? '当前章节' : '设置'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 选题输入 */}
            <div>
              <label className="text-sm font-medium mb-2 block">选题（要够炸！）</label>
              <Textarea
                placeholder="比如：为什么说AI Agent是个笑话？"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[80px]"
                disabled={step !== 'topic'}
              />
            </div>

            {desc && (
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground mb-1">核心观点</p>
                <p className="text-sm">{desc}</p>
              </div>
            )}

            {/* 发布平台 */}
            <div>
              <label className="text-sm font-medium mb-2 block">发布平台</label>
              <div className="flex gap-2 flex-wrap">
                {(['wechat', 'zhihu', 'both'] as const).map(p => (
                  <Button
                    key={p}
                    variant={platform === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlatform(p)}
                    disabled={step === 'writing' || step === 'content'}
                  >
                    {p === 'wechat' ? '微信' : p === 'zhihu' ? '知乎' : '双平台'}
                  </Button>
                ))}
              </div>
            </div>

            {/* 写作风格 */}
            <div>
              <label className="text-sm font-medium mb-2 block">写作风格</label>
              <div className="space-y-2">
                {WRITING_STYLES.map(s => (
                  <Button
                    key={s.id}
                    variant={style === s.name ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start h-auto py-2"
                    onClick={() => setStyle(s.name)}
                    disabled={step !== 'topic'}
                  >
                    <span className="mr-2">{s.icon}</span>
                    <div className="text-left">
                      <div>{s.name}</div>
                      <div className="text-xs opacity-70">{s.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* 操作按钮 */}
            {step === 'topic' && (
              <Button
                className="w-full"
                onClick={handleGenerateOutline}
                disabled={isGenerating || !topic.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI正在生成大纲...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    生成大纲
                  </>
                )}
              </Button>
            )}

            {step === 'outline' && (
              <Button
                className="w-full"
                onClick={handleStartWriting}
                disabled={sections.length === 0}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                开始逐段写作
              </Button>
            )}

            {step === 'writing' && (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-primary/10 text-sm">
                  <p className="font-medium">第 {currentSectionIndex + 1} / {sections.length} 章</p>
                  <p className="text-muted-foreground text-xs mt-1">{sections[currentSectionIndex]?.heading}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleWriteSection}
                  disabled={isWritingSection}
                >
                  {isWritingSection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      AI写作中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      AI写这一段
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleConfirmSection}
                  disabled={!sections[currentSectionIndex]?.content.trim()}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  确认这一段，下一段
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧：内容区域 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {step === 'topic' && <Lightbulb className="h-4 w-4" />}
                {step === 'outline' && <FileText className="h-4 w-4" />}
                {step === 'writing' && <PenTool className="h-4 w-4" />}
                {step === 'content' && <CheckCircle2 className="h-4 w-4" />}
                {step === 'topic' ? '待生成大纲' : step === 'outline' ? '大纲预览与编辑' : step === 'writing' ? '逐段写作' : '成稿'}
              </CardTitle>
              {step === 'outline' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingOutline(!editingOutline)}
                >
                  {editingOutline ? (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      完成编辑
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-1" />
                      编辑大纲
                    </>
                  )}
                </Button>
              )}
              {finalArticle && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopyContent(false)}>
                    <Copy className="h-4 w-4 mr-2" />
                    复制原文
                  </Button>
                  <Button variant="default" size="sm" onClick={() => handleCopyContent(true)}>
                    <Copy className="h-4 w-4 mr-2" />
                    复制微信格式
                  </Button>
                  <Button size="sm" onClick={handleSaveDraft}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    保存草稿
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {/* 选题步骤 */}
              {step === 'topic' && (
                <div className="text-center py-20 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>确认选题后，AI 将生成大纲</p>
                  <p className="text-sm mt-2">大纲每章2-3个观点，可以修改</p>
                </div>
              )}

              {/* 大纲步骤 */}
              {step === 'outline' && (
                <div className="space-y-6">
                  {/* 文章标题 */}
                  <div className="p-4 rounded-lg bg-primary/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">文章标题</label>
                      {editingOutline && (
                        <Input
                          value={outlineTitle}
                          onChange={(e) => updateOutlineTitle(e.target.value)}
                          className="flex-1 ml-4"
                        />
                      )}
                    </div>
                    {!editingOutline && <h3 className="font-semibold text-lg">{outlineTitle}</h3>}
                    <p className="text-sm text-muted-foreground mt-1">
                      {sections.length}个章节 · 每个章节{editingOutline ? '2-3' : sections[0]?.points.length || 2}个观点
                    </p>
                  </div>

                  {/* 章节列表 */}
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          {editingOutline ? (
                            <Input
                              value={section.heading}
                              onChange={(e) => updateSectionHeading(index, e.target.value)}
                              className="flex-1 font-medium"
                            />
                          ) : (
                            <h4 className="font-medium flex-1">{section.heading}</h4>
                          )}
                          {editingOutline && sections.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSection(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* 观点列表 */}
                        <div className="space-y-2 ml-8">
                          {section.points.map((point, pIndex) => (
                            <div key={pIndex} className="flex items-center gap-2">
                              <span className="text-primary">•</span>
                              {editingOutline ? (
                                <>
                                  <Input
                                    value={point}
                                    onChange={(e) => updateSectionPoint(index, pIndex, e.target.value)}
                                    className="flex-1 text-sm"
                                  />
                                  {section.points.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSectionPoint(index, pIndex)}
                                      className="text-destructive"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground flex-1">{point}</span>
                              )}
                            </div>
                          ))}
                          {editingOutline && section.points.length < 3 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addSectionPoint(index)}
                              className="text-primary"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              添加观点
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {editingOutline && (
                    <Button variant="outline" onClick={addSection}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加章节
                    </Button>
                  )}
                </div>
              )}

              {/* 写作步骤 */}
              {step === 'writing' && (
                <div className="space-y-6">
                  {/* 章节进度 */}
                  <div className="flex gap-2 flex-wrap">
                    {sections.map((section, index) => (
                      <Badge
                        key={index}
                        variant={
                          section.status === 'completed' ? 'default' :
                          section.status === 'writing' ? 'secondary' :
                          section.status === 'editing' ? 'outline' : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          if (section.status === 'completed') {
                            setCurrentSectionIndex(index);
                          }
                        }}
                      >
                        {section.status === 'completed' && <Check className="h-3 w-3 mr-1" />}
                        {section.status === 'writing' && <Circle className="h-3 w-3 mr-1" />}
                        第{index + 1}章
                      </Badge>
                    ))}
                  </div>

                  {/* 当前章节 */}
                  {sections[currentSectionIndex] && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-primary/10">
                        <h3 className="font-semibold">{sections[currentSectionIndex].heading}</h3>
                        <div className="flex gap-2 flex-wrap mt-2">
                          {sections[currentSectionIndex].points.map((p, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* 内容编辑 */}
                      <Textarea
                        value={sections[currentSectionIndex].content}
                        onChange={(e) => updateSectionContent(currentSectionIndex, e.target.value)}
                        placeholder="AI 生成的内容会出现在这里，你可以修改..."
                        className="min-h-[300px]"
                      />

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleRegenerateSection}
                          disabled={isWritingSection}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          重新生成
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (currentSectionIndex > 0) {
                              setCurrentSectionIndex(prev => prev - 1);
                            }
                          }}
                          disabled={currentSectionIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          上一段
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleConfirmSection}
                          disabled={!sections[currentSectionIndex]?.content.trim()}
                        >
                          确认并下一段
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 完成步骤 */}
              {step === 'content' && finalArticle && (
                <div className="space-y-6">
                  {/* 标题建议 */}
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      爆款标题（点击复制）
                    </h3>
                    <div className="space-y-2">
                      {titles.map((t, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                          <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                          <span className="flex-1 text-sm font-medium">{t}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              navigator.clipboard.writeText(t);
                              toast.success('已复制');
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 文章内容 */}
                  <div className="p-6 rounded-lg border bg-background">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                      {finalArticle.content}
                    </pre>
                  </div>

                  {/* 元信息 */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{finalArticle.wordCount.toLocaleString()} 字</span>
                    <span>·</span>
                    <span>约 {finalArticle.readingTime}阅读</span>
                    <Badge variant="secondary">
                      {platform === 'wechat' ? '微信' : platform === 'zhihu' ? '知乎' : '双平台'}
                    </Badge>
                  </div>

                  {/* 使用提示 */}
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <strong>使用方法：</strong>
                    </p>
                    <ul className="text-sm text-green-700 dark:text-green-400 mt-2 space-y-1">
                      <li>• <strong>复制原文</strong>：纯文本，可直接粘贴到任何编辑器</li>
                      <li>• <strong>复制微信格式</strong>：带 HTML 格式，粘贴到微信公众号后台源码模式</li>
                    </ul>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-3">
                      提示：微信公众号后台 → 右上角··· → 源码 → 粘贴
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CreateWorkspace() {
  return (
    <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
      <CreateWorkspaceContent />
    </Suspense>
  );
}

function StepIndicator({
  active,
  completed,
  icon: Icon,
  label
}: {
  active: boolean;
  completed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
      active ? 'bg-primary text-primary-foreground' :
      completed ? 'bg-green-100 text-green-700' :
      'bg-muted text-muted-foreground'
    }`}>
      {completed ? (
        <Check className="h-4 w-4" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
