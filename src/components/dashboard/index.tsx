'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { TrendingUp, FileText, Calendar, Clock, PenTool, Video, BarChart3, ArrowRight, Sparkles, Users, Eye, Heart } from 'lucide-react';

export function Dashboard() {
  const { hotTopics, topics, drafts, schedules } = useStore();

  const stats = [
    {
      title: '热点话题',
      value: hotTopics.length,
      icon: TrendingUp,
      description: '当前追踪的热点',
      color: 'text-red-500',
      href: '/hot-topics'
    },
    {
      title: '选题库',
      value: topics.length,
      icon: FileText,
      description: '待写选题数量',
      color: 'text-blue-500',
      href: '/topics'
    },
    {
      title: '草稿箱',
      value: drafts.filter(d => d.status === 'draft').length,
      icon: FileText,
      description: '未发布草稿',
      color: 'text-yellow-500',
      href: '/drafts'
    },
    {
      title: '待发布',
      value: schedules.filter(s => s.status === 'scheduled').length,
      icon: Calendar,
      description: '计划发布数量',
      color: 'text-green-500',
      href: '/schedule'
    }
  ];

  const workflowSteps = [
    { icon: TrendingUp, label: '热点追踪', href: '/hot-topics', color: 'bg-red-500' },
    { icon: FileText, label: '选题策划', href: '/topics', color: 'bg-blue-500' },
    { icon: PenTool, label: 'AI写作', href: '/create', color: 'bg-purple-500' },
    { icon: Video, label: 'AI视频', href: '/video', color: 'bg-pink-500' },
    { icon: Calendar, label: '发布排期', href: '/schedule', color: 'bg-green-500' },
    { icon: BarChart3, label: '数据分析', href: '/analytics', color: 'bg-orange-500' },
  ];

  const priorityTopics = topics
    .filter(t => t.priority === 'high' && t.status !== 'completed')
    .slice(0, 5);

  const recentDrafts = drafts
    .filter(d => d.status === 'draft')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI科普内容运营平台</h1>
          <p className="text-muted-foreground mt-2">
            从热点发现到内容分发，全流程自动化运营
          </p>
        </div>
        <Link href="/create">
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            开始创作
          </Button>
        </Link>
      </div>

      {/* 工作流指示器 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">内容运营工作流</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {workflowSteps.map((step, index) => (
              <div key={step.label} className="flex items-center">
                <Link href={step.href}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors whitespace-nowrap`}>
                    <div className={`w-2 h-2 rounded-full ${step.color}`} />
                    <step.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                </Link>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              AI写作助手
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              输入选题，AI自动生成大纲和完整文章，支持多平台适配
            </p>
            <Link href="/create">
              <Button className="w-full">
                开始写作
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-pink-500" />
              AI视频生成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              将文章转换为AI配音数字人视频，支持多平台分发
            </p>
            <Link href="/video">
              <Button variant="outline" className="w-full">
                创建视频
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              数据分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">59,600</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">310,000</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">24,700</span>
              </div>
            </div>
            <Link href="/analytics">
              <Button variant="outline" className="w-full">
                查看详情
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Badge variant="destructive">高优先级</Badge>
              选题
            </CardTitle>
            <Link href="/topics">
              <Button variant="ghost" size="sm">
                查看全部
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {priorityTopics.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">暂无高优先级选题</p>
                <Link href="/hot-topics">
                  <Button variant="outline">
                    去热点追踪找灵感
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {priorityTopics.map(topic => (
                  <li key={topic.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Badge variant="outline" className="mt-0.5 shrink-0">
                      {topic.platform === 'wechat' ? '微信' : topic.platform === 'zhihu' ? '知乎' : '双平台'}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{topic.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {topic.description}
                      </p>
                    </div>
                    <Link href="/create">
                      <Button variant="ghost" size="sm" className="shrink-0">
                        写
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              最近草稿
            </CardTitle>
            <Link href="/drafts">
              <Button variant="ghost" size="sm">
                查看全部
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentDrafts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">暂无草稿</p>
                <Link href="/create">
                  <Button variant="outline">
                    开始创作
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentDrafts.map(draft => (
                  <li key={draft.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Badge variant="secondary" className="mt-0.5 shrink-0">
                      {draft.platform === 'wechat' ? '微信' : draft.platform === 'zhihu' ? '知乎' : '双平台'}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{draft.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(draft.updatedAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <Link href="/drafts">
                      <Button variant="ghost" size="sm" className="shrink-0">
                        编辑
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
