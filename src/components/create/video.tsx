'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { VOICE_STYLES, AVATAR_OPTIONS } from '@/lib/ai/video';
import {
  Video, Mic, User, Play, Pause, Download, Share2,
  Loader2, Check, Wand2, Film, Volume2, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

export function VideoCreator() {
  const [activeTab, setActiveTab] = useState('script');
  const [article, setArticle] = useState('');
  const [title, setTitle] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('friendly');
  const [avatar, setAvatar] = useState('ai_anchor_1');

  const [step, setStep] = useState<'input' | 'preview' | 'generating' | 'done'>('input');
  const [script, setScript] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const handleGenerateScript = async () => {
    if (!article.trim()) {
      toast.error('请输入文章内容');
      return;
    }

    setStep('generating');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockScript = `【开场】
大家好，欢迎观看本期内容。今天我们来深入探讨一个备受关注的话题。

【正文】
${article.substring(0, 500)}...

让我们先了解一下背景。这个领域近年来发展迅速，涌现出了许多创新技术和应用。

接下来，我将从几个方面为大家详细分析。

第一，技术的核心原理。第二，实际应用场景。第三，未来发展趋势。

【总结】
以上就是今天的全部内容。如果你觉得有帮助，请点赞、关注，我们下期再见！`;

      setScript(mockScript);
      setStep('preview');
      toast.success('脚本生成成功');
    } catch (error) {
      toast.error('生成失败');
      setStep('input');
    }
  };

  const handleGenerateVideo = async () => {
    setStep('generating');
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      setVideoUrl('https://example.com/video/demo.mp4');
      setStep('done');
      toast.success('视频生成完成');
    } catch (error) {
      toast.error('生成失败');
      setStep('preview');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-8 w-8" />
            AI视频创作
          </h1>
          <p className="text-muted-foreground mt-1">
            将文章转换为AI配音数字人视频
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="script">
            <Mic className="h-4 w-4 mr-2" />
            脚本生成
          </TabsTrigger>
          <TabsTrigger value="settings">
            <User className="h-4 w-4 mr-2" />
            形象设置
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Play className="h-4 w-4 mr-2" />
            预览发布
          </TabsTrigger>
        </TabsList>

        <TabsContent value="script" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">输入文章</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">视频标题</label>
                  <Input
                    placeholder="输入视频标题..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">文章内容</label>
                  <Textarea
                    placeholder="粘贴文章内容或要点..."
                    value={article}
                    onChange={(e) => setArticle(e.target.value)}
                    className="min-h-[300px]"
                  />
                </div>
                <Button className="w-full" onClick={handleGenerateScript} disabled={step === 'generating'}>
                  {step === 'generating' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      生成视频脚本
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>生成的脚本</span>
                  {script && (
                    <Badge variant="outline">
                      {script.length} 字符
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {script ? (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <pre className="whitespace-pre-wrap text-sm">
                        {script}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-muted-foreground">
                      <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>输入文章后，点击"生成视频脚本"</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  语音风格
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {VOICE_STYLES.map((voice) => (
                  <Button
                    key={voice.id}
                    variant={voiceStyle === voice.id ? 'default' : 'outline'}
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setVoiceStyle(voice.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{voice.name}</div>
                      <div className="text-xs opacity-70">{voice.description}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  虚拟形象
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AVATAR_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    variant={avatar === option.id ? 'default' : 'outline'}
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setAvatar(option.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{option.name}</div>
                      </div>
                    </div>
                  </Button>
                ))}
                <p className="text-xs text-muted-foreground mt-2">
                  更多虚拟形象将在后续版本中添加
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">视频预览与发布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                {step === 'done' && videoUrl ? (
                  <video
                    controls
                    className="w-full h-full"
                    src={videoUrl}
                    poster=""
                  />
                ) : (
                  <div className="text-center text-white">
                    <Film className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="opacity-70">
                      {step === 'generating' ? '视频生成中...' : '先生成脚本，再生成视频'}
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleGenerateVideo}
                  disabled={step !== 'preview'}
                >
                  {step === 'generating' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      生成视频
                    </>
                  )}
                </Button>

                {step === 'done' && (
                  <>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      下载
                    </Button>
                    <Button>
                      <Share2 className="h-4 w-4 mr-2" />
                      分享
                    </Button>
                  </>
                )}
              </div>

              {step === 'done' && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-3">分发平台</h4>
                  <div className="flex gap-2 flex-wrap">
                    {['YouTube', 'B站', '抖音', '小红书', '微信视频号'].map((platform) => (
                      <Button key={platform} variant="outline" size="sm">
                        {platform}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
