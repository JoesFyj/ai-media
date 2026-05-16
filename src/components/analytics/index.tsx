'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, TrendingDown, Eye, Heart, MessageCircle,
  Share2, Users, BarChart3, RefreshCw, ExternalLink
} from 'lucide-react';

interface PlatformStats {
  platform: string;
  icon: string;
  followers: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  change: number;
}

const mockPlatformStats: PlatformStats[] = [
  {
    platform: '微信公众号',
    icon: '💚',
    followers: 12500,
    views: 45000,
    likes: 2300,
    comments: 156,
    shares: 890,
    change: 12.5
  },
  {
    platform: '知乎',
    icon: '❓',
    followers: 8200,
    views: 68000,
    likes: 4500,
    comments: 342,
    shares: 1200,
    change: 8.3
  },
  {
    platform: 'B站',
    icon: '📺',
    followers: 15600,
    views: 125000,
    likes: 8900,
    comments: 567,
    shares: 2100,
    change: -2.1
  },
  {
    platform: '小红书',
    icon: '📕',
    followers: 9800,
    views: 34000,
    likes: 5600,
    comments: 234,
    shares: 780,
    change: 18.7
  },
  {
    platform: 'YouTube',
    icon: '▶️',
    followers: 4500,
    views: 28000,
    likes: 3200,
    comments: 189,
    shares: 450,
    change: 5.2
  }
];

const recentArticles = [
  { title: '一文读懂大语言模型：LLM的原理与应用', platform: '微信公众号', views: 12500, likes: 890, date: '2024-01-15' },
  { title: 'AI Agents: 下一个技术前沿', platform: '知乎', views: 23000, likes: 1200, date: '2024-01-14' },
  { title: 'ChatGPT背后的大脑：Transformer详解', platform: 'B站', views: 45000, likes: 3200, date: '2024-01-13' },
  { title: '普通人如何使用AI提升效率', platform: '小红书', views: 8900, likes: 1200, date: '2024-01-12' }
];

export function Analytics() {
  const totalFollowers = mockPlatformStats.reduce((sum, p) => sum + p.followers, 0);
  const totalViews = mockPlatformStats.reduce((sum, p) => sum + p.views, 0);
  const avgChange = mockPlatformStats.reduce((sum, p) => sum + p.change, 0) / mockPlatformStats.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            数据分析
          </h1>
          <p className="text-muted-foreground mt-1">
            追踪内容表现，优化运营策略
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 概览卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总粉丝数</p>
                <p className="text-2xl font-bold">{totalFollowers.toLocaleString()}</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总阅读量</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总获赞数</p>
                <p className="text-2xl font-bold">24,700</p>
              </div>
              <Heart className="h-10 w-10 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">周增长率</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  {avgChange.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="platforms">平台明细</TabsTrigger>
          <TabsTrigger value="content">内容表现</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">各平台数据</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPlatformStats.map((platform) => (
                    <div key={platform.platform} className="flex items-center gap-4">
                      <span className="text-2xl">{platform.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{platform.platform}</span>
                          <div className="flex items-center gap-1 text-sm">
                            {platform.change >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={platform.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {platform.change >= 0 ? '+' : ''}{platform.change}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(platform.views / 150000) * 100}%` }}
                          />
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{platform.views.toLocaleString()} 阅读</span>
                          <span>{platform.followers.toLocaleString()} 粉丝</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">近期热门内容</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {recentArticles.map((article, index) => (
                      <div key={index} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-1">{article.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{article.platform}</Badge>
                              <span>{article.date}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{article.views.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">阅读</p>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {article.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            评论
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            分享
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockPlatformStats.map((platform) => (
              <Card key={platform.platform}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{platform.icon}</span>
                    {platform.platform}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">粉丝数</p>
                      <p className="text-xl font-bold">{platform.followers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">阅读量</p>
                      <p className="text-xl font-bold">{platform.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">获赞</p>
                      <p className="text-xl font-bold">{platform.likes.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">评论</p>
                      <p className="text-xl font-bold">{platform.comments}</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1 ${platform.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {platform.change >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-medium">{platform.change >= 0 ? '+' : ''}{platform.change}%</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      查看详情
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">内容表现排行</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentArticles.map((article, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Badge variant={index === 0 ? 'default' : 'outline'} className="text-lg w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-medium">{article.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">{article.platform}</Badge>
                        <span>{article.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{article.views.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">阅读</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{article.likes.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">点赞</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
