// 视频生成相关配置

export interface VideoScript {
  content: string;
  duration: number;
  voice?: string;
  avatar?: string;
}

export interface VideoProject {
  id: string;
  title: string;
  script: VideoScript;
  status: 'draft' | 'generating' | 'completed' | 'published';
  createdAt: Date;
  videoUrl?: string;
  thumbnailUrl?: string;
}

// 语音风格
export const VOICE_STYLES = [
  { id: 'friendly', name: '亲和力', description: '温暖友好的声音，适合科普' },
  { id: 'professional', name: '专业', description: '沉稳专业的声音，适合深度内容' },
  { id: 'energetic', name: '活力', description: '年轻有活力的声音，适合年轻人' },
  { id: 'calm', name: '平静', description: '平稳舒缓的声音，适合深度阅读' }
];

// 虚拟形象
export const AVATAR_OPTIONS = [
  { id: 'ai_anchor_1', name: 'AI主播小A', thumbnail: '/avatars/anchor1.png' },
  { id: 'ai_anchor_2', name: 'AI主播小B', thumbnail: '/avatars/anchor2.png' },
  { id: 'ai_anchor_3', name: 'AI主播小C', thumbnail: '/avatars/anchor3.png' }
];

// 视频生成提示词
export const VIDEO_PROMPTS = {
  script: `将以下文章内容转换为视频脚本，要求：
- 语言口语化，适合配音
- 每段30-60秒
- 添加过渡语和总结语
- 总时长2-5分钟

文章内容：
{content}

请按以下格式返回：
{{
  "segments": [
    {{
      "content": "片段内容",
      "duration": 45
    }}
  ],
  "totalDuration": 180
}}`,

  title: `为以下视频生成一个吸引人的标题，要求：
- 简洁有力，15-30字
- 引发好奇心
- 适合短视频平台

视频主题：{topic}`
};

// MiniMax视频生成API（示例）
export async function generateVideo(script: VideoScript): Promise<{ videoUrl: string; thumbnail: string }> {
  // 实际项目中调用MiniMax等视频生成API
  const response = await fetch('https://api.minimaxi.chat/v1/video/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MINIMAX_API_KEY || ''}`
    },
    body: JSON.stringify({
      model: 'video-01',
      script: script.content,
      voice: script.voice || 'friendly',
      avatar: script.avatar || 'ai_anchor_1'
    })
  });

  const data = await response.json();
  return {
    videoUrl: data.video_url || '',
    thumbnail: data.thumbnail || ''
  };
}

// 生成视频脚本
export async function generateVideoScript(article: string): Promise<VideoScript> {
  // 实际项目中调用AI生成脚本
  const prompt = VIDEO_PROMPTS.script.replace('{content}', article);

  // 模拟响应
  return {
    content: `大家好，今天我们来聊聊这个话题。

首先，让我们了解一下背景。近年来，这个领域发展非常迅速，引起了广泛关注。

接下来，我会从几个方面为大家详细介绍。第一，是基本原理的理解。第二，是实际应用场景。第三，是未来发展趋势。

让我们先从基本原理开始...（继续配音脚本）`,
    duration: 180
  };
}
