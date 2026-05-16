import { HotTopic } from '@/types';

const AI_KEYWORDS = [
  'AI', '人工智能', '机器学习', '深度学习', 'LLM', '大模型',
  'ChatGPT', 'GPT', 'Claude', 'Gemini', 'OpenAI', '神经网络',
  'Stable Diffusion', '文生图', 'AIGC', 'AGI', '自动驾驶',
  '智能驾驶', '机器人', 'Copilot', 'TensorFlow', 'PyTorch',
  'Python', '算法', '数据科学', 'AI芯片', 'GPU', '英伟达'
];

export function filterAITopics(topics: HotTopic[]): HotTopic[] {
  return topics.filter(topic => {
    const text = `${topic.title} ${topic.summary || ''} ${topic.category}`.toLowerCase();
    return AI_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
  });
}

export function getHeatLevel(heat: number): 'hot' | 'warm' | 'normal' {
  if (heat >= 10000) return 'hot';
  if (heat >= 1000) return 'warm';
  return 'normal';
}

export function formatHeat(heat: number): string {
  if (heat >= 100000000) return `${(heat / 100000000).toFixed(1)}亿`;
  if (heat >= 10000) return `${(heat / 10000).toFixed(1)}万`;
  return heat.toString();
}
