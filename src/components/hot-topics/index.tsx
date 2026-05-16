'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { formatHeat, getHeatLevel } from '@/lib/utils/ai-filter';
import { TrendingUp, RefreshCw, ExternalLink, Search, Loader2, Check, Wand2, ArrowRight, Globe, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HotTopic } from '@/types';
import { toast } from 'sonner';

const ENGLISH_SOURCES = [
  { name: 'Hacker News', category: '技术' },
  { name: 'Reddit Tech', category: '科技' },
  { name: 'Reddit AI', category: 'AI' },
  { name: 'BBC Tech', category: '科技' },
  { name: 'The Verge', category: '科技' },
  { name: 'Ars Technica', category: '科技深度' },
  { name: 'MIT Tech Review', category: 'AI科技' },
  { name: 'Wired', category: '科技文化' },
  { name: 'VentureBeat AI', category: 'AI' },
  { name: 'TechCrunch', category: '创业投资' },
  { name: 'Engadget', category: '数码' },
];

const CHINESE_SOURCES = [
  { name: '36氪', category: '科技商业' },
  { name: '虎嗅', category: '科技商业' },
  { name: '机器之心', category: 'AI人工智能' },
  { name: '量子位', category: 'AI人工智能' },
  { name: '钛媒体', category: '科技商业' },
  { name: '极客公园', category: '科技商业' },
  { name: '爱范儿', category: '科技数码' },
  { name: '品玩', category: '科技数码' },
  { name: '澎湃新闻', category: '综合新闻' },
  { name: '雷锋网', category: '科技商业' },
];

interface GeneratedTopic {
  title: string;
  angle: string;
  description: string;
}

export function HotTopicsList() {
  const router = useRouter();
  const { addTopic } = useStore();

  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [sourceStats, setSourceStats] = useState<Record<string, number>>({});
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);

  // AI 生成选题相关状态
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [selectedGeneratedTopic, setSelectedGeneratedTopic] = useState<GeneratedTopic | null>(null);

  const loadTopics = useCallback(async (kw: string, src: string, cat: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (kw) params.set('keyword', kw);
      if (src !== 'all') params.set('source', src);
      if (cat !== '全部') params.set('category', cat);

      const response = await fetch(`/api/hot-topics?${params}`);
      const result = await response.json();

      if (result.success) {
        setHotTopics(result.data);
        setSourceStats(result.sources || {});
        setCategoryStats(result.categories || {});
        setTotal(result.total);
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
      toast.error('加载热点失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics(keyword, selectedSource, selectedCategory);
  }, [keyword, selectedSource, selectedCategory, loadTopics]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTopics(keyword, selectedSource, selectedCategory);
  };

  const toggleTopicSelection = (topicId: string) => {
    const newSet = new Set(selectedTopics);
    if (newSet.has(topicId)) {
      newSet.delete(topicId);
    } else {
      newSet.add(topicId);
    }
    setSelectedTopics(newSet);
  };

  const getHeatBadge = (heat: number) => {
    const level = getHeatLevel(heat);
    const variants: Record<string, string> = {
      hot: 'bg-red-500 text-white',
      warm: 'bg-orange-500 text-white',
      normal: 'bg-blue-500 text-white'
    };
    return <Badge className={variants[level]}>{level === 'hot' ? '爆' : level === 'warm' ? '热' : '新'}</Badge>;
  };

  // 调用 AI 生成爆款选题
  const handleGenerateTopics = async () => {
    if (selectedTopics.size === 0) {
      toast.error('请先选择热点话题');
      return;
    }

    setIsGeneratingTopics(true);
    setGeneratedTopics([]);
    setShowTopicDialog(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
      if (!apiKey) {
        toast.error('请先配置 DeepSeek API 密钥');
        setShowTopicDialog(false);
        return;
      }

      const selectedHotTopics = hotTopics.filter(t => selectedTopics.has(t.id));
      const topicsText = selectedHotTopics.map((t, i) =>
        `${i + 1}. ${t.title}${t.summary ? '\n   摘要: ' + t.summary : ''}`
      ).join('\n\n');

      const prompt = `你是一个拥有百万粉丝的AI科普自媒体博主，专门生产爆款选题。

基于以下热点话题，生成 2-5 个适合写公众号的爆款选题角度。

热点话题：
${topicsText}

要求：
1. 每个选题要有明确的争议性或爆点，能引发讨论
2. 选题角度要独特，与众不同
3. 每个选题包含：标题、切入角度、核心观点
4. 格式：每个选题用 | 分隔标题、角度、描述

请生成 JSON 格式：
{
  "topics": [
    {"title": "选题标题（要有冲击力）", "angle": "切入角度（如：怼人流/内幕流/反常识流）", "description": "核心观点简述"}
  ]
}`;

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

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // 解析 JSON
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setGeneratedTopics(parsed.topics || []);
      } else {
        // Fallback - 生成默认选题
        setGeneratedTopics([
          { title: '怼一怼：' + selectedHotTopics[0]?.title, angle: '怼人流', description: '用对抗性角度写一篇引发讨论的文章' },
          { title: '深扒：' + selectedHotTopics[0]?.title, angle: '内幕流', description: '揭秘背后的真相' },
          { title: '反常识：' + selectedHotTopics[0]?.title, angle: '反常识流', description: '颠覆认知的角度' }
        ]);
      }
    } catch (error) {
      toast.error('生成选题失败');
      setShowTopicDialog(false);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  // 选择选题后跳转到写作页面
  const handleSelectTopic = (topic: GeneratedTopic) => {
    // 将选题添加到 store
    addTopic({
      title: topic.title,
      description: topic.description,
      priority: 'high',
      platform: 'both',
      status: 'pending'
    });

    // 跳转到写作页面，携带选题参数
    const encodedTopic = encodeURIComponent(topic.title);
    const encodedAngle = encodeURIComponent(topic.angle);
    const encodedDesc = encodeURIComponent(topic.description);
    router.push(`/create?topic=${encodedTopic}&angle=${encodedAngle}&desc=${encodedDesc}`);
  };

  const allSources = [...ENGLISH_SOURCES, ...CHINESE_SOURCES];
  const categories = ['全部', ...new Set(Object.keys(categoryStats))];

  return (
    <div className="space-y-6">
      {/* 顶部搜索区 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            热点追踪
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="输入关键词搜索，如：AI、大模型、ChatGPT..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              搜索
            </Button>
            <Button type="button" variant="outline" onClick={() => loadTopics('', 'all', selectedCategory)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>

          {/* 分类筛选 */}
          <div className="flex gap-2 flex-wrap mt-4">
            {categories.slice(0, 8).map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} {cat !== '全部' && categoryStats[cat] ? `(${categoryStats[cat]})` : ''}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            onClick={handleGenerateTopics}
            disabled={selectedTopics.size === 0 || isGeneratingTopics}
          >
            {isGeneratingTopics ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI生成选题中...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                生成 {selectedTopics.size > 0 ? `${selectedTopics.size}个` : ''} 爆款选题
              </>
            )}
          </Button>
          {selectedTopics.size > 0 && (
            <span className="text-sm text-muted-foreground">
              已选择 {selectedTopics.size} 个热点
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>{total} 条热点</span>
        </div>
      </div>

      {/* 热点列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              热点话题
              <Badge variant="outline">{total} 条</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {hotTopics.map((topic) => (
                <div
                  key={topic.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedTopics.has(topic.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleTopicSelection(topic.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedTopics.has(topic.id)
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedTopics.has(topic.id) && <Check className="h-3 w-3" />}
                    </div>
                    {getHeatBadge(topic.heat)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={topic.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-primary line-clamp-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {topic.title}
                    </a>
                    {topic.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {topic.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {topic.source}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {topic.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatHeat(topic.heat)}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <a href={topic.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}

              {hotTopics.length === 0 && !isLoading && (
                <div className="text-center py-20">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-4 text-muted-foreground">
                    {keyword ? '没有找到相关热点' : '点击搜索按钮加载热点'}
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-20">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">加载中...</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* AI 生成的选题弹窗 */}
      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              AI 生成的爆款选题
            </DialogTitle>
          </DialogHeader>

          {isGeneratingTopics ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">AI 正在分析热点，生成爆款选题...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedTopics.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">未能生成选题，请重试</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    从以下 {generatedTopics.length} 个选题中选择一个，点击后将自动跳转到写作页面
                  </p>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {generatedTopics.map((topic, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 ${
                          selectedGeneratedTopic === topic ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedGeneratedTopic(topic)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">{topic.angle}</Badge>
                            <h3 className="font-semibold text-lg">{topic.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTopic(topic);
                            }}
                          >
                            去写作
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 数据源说明 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="font-medium">英文数据源</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ENGLISH_SOURCES.map(source => (
                <Badge key={source.name} variant="outline" className="text-xs">
                  {source.name}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Zap className="h-4 w-4" />
              <span className="font-medium">中文数据源</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CHINESE_SOURCES.map(source => (
                <Badge key={source.name} variant="outline" className="text-xs">
                  {source.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
