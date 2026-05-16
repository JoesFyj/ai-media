'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { Topic } from '@/types';
import { Plus, Trash2, Sparkles, Loader2, Edit2, Check, BookOpen, Wand2, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface SuggestedTopic {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export function TopicsList() {
  const router = useRouter();
  const { topics, addTopic, updateTopic, deleteTopic } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<SuggestedTopic[]>([]);
  const [newTopics, setNewTopics] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    platform: 'both' as 'wechat' | 'zhihu' | 'both'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopics.title.trim()) return;

    addTopic({
      title: newTopics.title,
      description: newTopics.description,
      priority: newTopics.priority,
      platform: newTopics.platform,
      status: 'pending'
    });

    setNewTopics({ title: '', description: '', priority: 'medium', platform: 'both' });
    setIsDialogOpen(false);
    toast.success('选题已添加');
  };

  // 根据选中的热点自动生成选题
  const handleGenerateSuggestions = async () => {
    if (!selectedTopic || !selectedTopic.description) {
      toast.error('请先选择一个有描述的选题');
      return;
    }

    setIsGenerating(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
      if (!apiKey) {
        toast.error('请配置DeepSeek API密钥');
        setIsGenerating(false);
        return;
      }

      const prompt = `根据以下热点话题，生成3-5个适合写公众号文章的选题角度。

热点标题：${selectedTopic.title}
热点描述：${selectedTopic.description}

要求：
1. 每个选题要有明确的争议性或爆点
2. 选题角度要独特，能引发讨论
3. 格式：标题 | 简要描述 | 优先级(高/中/低)

请以JSON格式返回：
{
  "suggestions": [
    {"title": "选题1", "description": "描述", "priority": "high"},
    ...
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

      // 解析JSON
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setSuggestedTopics(parsed.suggestions || []);
      } else {
        // fallback
        setSuggestedTopics([
          { title: `怼一怼：${selectedTopic.title}`, description: '用对抗性角度写一篇', priority: 'high' },
          { title: `深扒：${selectedTopic.title}`, description: '揭秘背后的真相', priority: 'high' },
          { title: `反常识：${selectedTopic.title}`, description: '颠覆认知的角度', priority: 'medium' }
        ]);
      }
    } catch (error) {
      toast.error('生成选题失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 将建议的选题添加到选题库并跳转到写作
  const handleAddAndWrite = (suggestion: SuggestedTopic) => {
    addTopic({
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      platform: 'both',
      status: 'pending'
    });
    // 立即跳转到写作页面
    const encodedTopic = encodeURIComponent(suggestion.title);
    const encodedDesc = encodeURIComponent(suggestion.description);
    router.push(`/create?topic=${encodedTopic}&desc=${encodedDesc}`);
  };

  // 将建议的选题添加到选题库
  const handleAddSuggested = (suggestion: SuggestedTopic) => {
    addTopic({
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      platform: 'both',
      status: 'pending'
    });
    toast.success(`"${suggestion.title}" 已添加`);
  };

  // 将所有建议添加为选题
  const handleAddAll = () => {
    suggestedTopics.forEach(s => {
      addTopic({
        title: s.title,
        description: s.description,
        priority: s.priority,
        platform: 'both',
        status: 'pending'
      });
    });
    toast.success(`已添加 ${suggestedTopics.length} 个选题`);
    setSuggestedTopics([]);
    setSelectedTopic(null);
  };

  const filteredTopics = topics.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedTopics = [...filteredTopics].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const getStatusBadge = (status: Topic['status']) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500 text-white',
      'in-progress': 'bg-blue-500 text-white',
      completed: 'bg-green-500 text-white'
    };
    const labels: Record<string, string> = {
      pending: '待写',
      'in-progress': '写作中',
      completed: '已完成'
    };
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  // 跳转到写作页面，携带选题数据
  const handleGoToWrite = (topic: Topic) => {
    const encodedTopic = encodeURIComponent(topic.title);
    const encodedDesc = encodeURIComponent(topic.description || '');
    router.push(`/create?topic=${encodedTopic}&desc=${encodedDesc}&topicId=${topic.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">选题策划</h1>
          <p className="text-muted-foreground mt-1">
            {topics.length} 个选题 · {topics.filter(t => t.priority === 'high').length} 个高优先级
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建选题
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新选题</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">标题</label>
                <Input
                  placeholder="输入选题标题..."
                  value={newTopics.title}
                  onChange={(e) => setNewTopics({ ...newTopics, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">描述</label>
                <Textarea
                  placeholder="选题背景、核心观点..."
                  value={newTopics.description}
                  onChange={(e) => setNewTopics({ ...newTopics, description: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">优先级</label>
                  <div className="flex gap-2">
                    {(['high', 'medium', 'low'] as const).map(p => (
                      <Button
                        key={p}
                        type="button"
                        variant={newTopics.priority === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewTopics({ ...newTopics, priority: p })}
                      >
                        {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full">创建选题</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-2">
        {(['all', 'pending', 'in-progress', 'completed'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '全部' : f === 'pending' ? '待写' : f === 'in-progress' ? '写作中' : '已完成'}
          </Button>
        ))}
      </div>

      {/* 选题列表 */}
      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {sortedTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={topic.priority === 'high' ? 'destructive' : topic.priority === 'medium' ? 'secondary' : 'outline'}>
                          {topic.priority === 'high' ? '高优' : topic.priority === 'medium' ? '中优' : '低优'}
                        </Badge>
                        {getStatusBadge(topic.status)}
                        <Badge variant="outline" className="text-xs">
                          {topic.platform === 'wechat' ? '微信' : topic.platform === 'zhihu' ? '知乎' : '双平台'}
                        </Badge>
                      </div>
                      <h3 className="font-medium mt-2">{topic.title}</h3>
                      {topic.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {topic.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTopic(topic);
                            setSuggestedTopics([]);
                          }}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI生成选题
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleGoToWrite(topic)}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          去写作
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const nextStatus: Record<string, Topic['status']> = {
                              pending: 'in-progress',
                              'in-progress': 'completed',
                              completed: 'pending'
                            };
                            updateTopic(topic.id, { status: nextStatus[topic.status] });
                          }}
                        >
                          {topic.status === 'completed' ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTopic(topic.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sortedTopics.length === 0 && (
                <div className="text-center py-20">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-4 text-muted-foreground">暂无选题</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    从热点追踪页面添加，或点击上方"新建选题"
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* AI生成选题弹窗 */}
      <Dialog open={!!selectedTopic} onOpenChange={() => { setSelectedTopic(null); setSuggestedTopics([]); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI选题助手
            </DialogTitle>
          </DialogHeader>

          {selectedTopic && (
            <div className="space-y-4">
              {/* 原始选题 */}
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">基于这个热点：</p>
                <p className="font-medium">{selectedTopic.title}</p>
                {selectedTopic.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedTopic.description}</p>
                )}
              </div>

              {/* 生成按钮 */}
              <Button
                className="w-full"
                onClick={handleGenerateSuggestions}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI正在生成选题...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    生成3-5个爆款选题
                  </>
                )}
              </Button>

              {/* 生成的选题列表 */}
              {suggestedTopics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">生成的选题：</p>
                    <Button size="sm" onClick={handleAddAll}>
                      <Plus className="h-4 w-4 mr-1" />
                      全部添加
                    </Button>
                  </div>
                  {suggestedTopics.map((s, index) => (
                    <div key={index} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={s.priority === 'high' ? 'destructive' : s.priority === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                              {s.priority === 'high' ? '高优' : s.priority === 'medium' ? '中优' : '低优'}
                            </Badge>
                          </div>
                          <p className="font-medium">{s.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleAddSuggested(s)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleAddAndWrite(s)}>
                            <ArrowRight className="h-4 w-4 mr-1" />
                            写作
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 使用提示 */}
              <p className="text-xs text-muted-foreground text-center">
                点击选题旁边的 + 按钮添加到选题库，或"全部添加"一键添加所有
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
