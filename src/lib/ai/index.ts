import { ArticleOutline, GeneratedArticle, WRITING_PROMPTS } from './prompts';

interface AIConfig {
  provider: 'openai' | 'anthropic' | 'zhipu' | 'minimax' | 'deepseek';
  apiKey?: string;
  baseUrl?: string;
}

// 获取AI配置（可从环境变量或设置中获取）
function getAIConfig(): AIConfig {
  return {
    provider: (process.env.AI_PROVIDER as AIConfig['provider']) || 'deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || ''
  };
}

// 通用的AI调用函数
async function callAI(prompt: string, config?: Partial<AIConfig>): Promise<string> {
  const cfg = { ...getAIConfig(), ...config };

  try {
    let response;

    if (cfg.provider === 'minimax') {
      response = await fetch(`${cfg.baseUrl || 'https://api.minimaxi.chat'}/v1/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey || process.env.MINIMAX_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'abab6.5s-chat',
          messages: [{ role: 'user', content: prompt }]
        })
      });
    } else if (cfg.provider === 'deepseek') {
      // DeepSeek API
      response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey || process.env.DEEPSEEK_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }]
        })
      });
    } else if (cfg.provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey || process.env.OPENAI_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        })
      });
    } else if (cfg.provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.apiKey || process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-7-20250514',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        })
      });
    } else {
      // Zhipu AI
      response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey || process.env.ZHIPU_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: prompt }]
        })
      });
    }

    const data = await response.json();

    if (cfg.provider === 'anthropic') {
      return data.content?.[0]?.text || '';
    }
    return data.choices?.[0]?.message?.content || data.response || '';
  } catch (error) {
    console.error('AI API call failed:', error);
    throw new Error('AI服务调用失败');
  }
}

// 生成文章大纲
export async function generateOutline(
  topic: string,
  platform: 'wechat' | 'zhihu' | 'both' = 'both',
  style: string = '通俗易懂'
): Promise<ArticleOutline> {
  const prompt = WRITING_PROMPTS.outline
    .replace('{topic}', topic)
    .replace('{platform}', platform === 'both' ? '微信公众号和知乎' : platform === 'wechat' ? '微信公众号' : '知乎')
    .replace('{style}', style);

  try {
    const result = await callAI(prompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || topic,
        sections: parsed.sections || []
      };
    }

    // 如果无法解析JSON，返回默认结构
    return {
      title: topic,
      sections: [
        { heading: '背景介绍', points: ['行业背景', '发展历程', '现状分析'] },
        { heading: '核心概念', points: ['基本原理', '关键技术', '应用场景'] },
        { heading: '深度解析', points: ['优势分析', '挑战与限制', '解决方案'] },
        { heading: '未来趋势', points: ['技术发展方向', '市场前景', '建议与展望'] }
      ]
    };
  } catch (error) {
    console.error('Failed to generate outline:', error);
    throw error;
  }
}

// 生成完整文章
export async function generateArticle(
  topic: string,
  outline: ArticleOutline,
  platform: 'wechat' | 'zhihu' | 'both' = 'both',
  style: string = '通俗易懂',
  sources: string[] = []
): Promise<GeneratedArticle> {
  const outlineStr = JSON.stringify(outline, null, 2);
  const prompt = WRITING_PROMPTS.article
    .replace('{topic}', topic)
    .replace('{outline}', outlineStr)
    .replace('{platform}', platform === 'both' ? '微信公众号和知乎' : platform === 'wechat' ? '微信公众号' : '知乎')
    .replace('{style}', style)
    .replace('{sources}', sources.length > 0 ? sources.join('\n') : '无特定参考')
    .replace('{wordCount}', platform === 'wechat' ? '2000-3000' : '3000-5000');

  try {
    const content = await callAI(prompt);
    const wordCount = content.length;
    const readingTime = Math.ceil(wordCount / 500) + '分钟';

    // 提取关键词
    const keywords = extractKeywords(content);

    return {
      title: outline.title,
      outline,
      content,
      metadata: {
        wordCount,
        readingTime,
        keywords,
        platform
      }
    };
  } catch (error) {
    console.error('Failed to generate article:', error);
    throw error;
  }
}

// 生成标题
export async function generateTitles(
  topic: string,
  summary: string
): Promise<string[]> {
  const prompt = WRITING_PROMPTS.title
    .replace('{topic}', topic)
    .replace('{summary}', summary.substring(0, 500));

  try {
    const result = await callAI(prompt);
    const titles = result
      .split('\n')
      .map((t: string) => t.replace(/^\d+[\.\)、]?\s*/, '').trim())
      .filter((t: string) => t.length > 0)
      .slice(0, 5);

    return titles;
  } catch (error) {
    console.error('Failed to generate titles:', error);
    return [topic];
  }
}

// 生成小红书内容
export async function generateXiaohongshuContent(
  article: string
): Promise<string> {
  const prompt = WRITING_PROMPTS.xiaohongshu.replace('{content}', article.substring(0, 2000));

  try {
    return await callAI(prompt);
  } catch (error) {
    console.error('Failed to generate xiaohongshu content:', error);
    throw error;
  }
}

// 生成Twitter/X推文
export async function generateTwitterContent(
  article: string
): Promise<string> {
  const prompt = WRITING_PROMPTS.twitter.replace('{content}', article.substring(0, 1000));

  try {
    return await callAI(prompt);
  } catch (error) {
    console.error('Failed to generate twitter content:', error);
    throw error;
  }
}

// 辅助函数：提取关键词
function extractKeywords(content: string): string[] {
  const commonWords = ['的', '是', '在', '和', '了', '我们', '这个', '以及', '对于', '通过'];
  const words = content
    .replace(/[^一-龥a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !commonWords.includes(w));

  const frequency: Record<string, number> = {};
  words.forEach(w => {
    frequency[w] = (frequency[w] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// 检查AI配置
export function checkAIConfig(): { configured: boolean; provider: string } {
  const config = getAIConfig();
  const hasApiKey = !!(
    config.apiKey ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.MINIMAX_API_KEY ||
    process.env.OPENAI_API_KEY
  );

  return {
    configured: hasApiKey,
    provider: config.provider
  };
}
