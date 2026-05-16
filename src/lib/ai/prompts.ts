// AI文章生成相关配置和工具

export interface ArticleOutline {
  title: string;
  sections: {
    heading: string;
    points: string[];
  }[];
}

export interface GeneratedArticle {
  title: string;
  outline: ArticleOutline;
  content: string;
  metadata: {
    wordCount: number;
    readingTime: string;
    keywords: string[];
    platform: 'wechat' | 'zhihu' | 'both';
  };
}

// 自媒体爆款文章提示词
export const WRITING_PROMPTS = {
  outline: `你是一个拥有百万粉丝的AI科普自媒体博主。请根据以下选题，生成一篇能引发讨论的爆款文章大纲。

选题：{topic}
目标平台：{platform}

请按以下JSON格式返回文章大纲：
{{
  "title": "文章标题（要有争议性、能引发讨论）",
  "sections": [
    {{
      "heading": "章节标题（要有爆点）",
      "points": ["能引发共鸣或争议的要点"]
    }}
  ]
}}

大纲要求：
- 5-6个章节，层层递进
- 每个章节要有"钩子"，让人想看下去
- 适当设置对立观点，引发思考
- 结尾要有"彩蛋"或行动号召`,

  article: `你是一个拥有百万粉丝的AI科普自媒体博主，以"杠精"风格著称。

请根据以下大纲，写一篇能引发争论的公众号文章：

选题：{topic}
大纲：{outline}
目标平台：{platform}

写作风格：
- 敢说敢怼，不怕得罪人
- 要有"我就是要反驳你"的劲头
- 金句频出，让人忍不住截图转发
- 深挖别人没看到的角度
- 数据说话，但不说废话

文章结构：
1. 开头要炸 - 直接抛出争议性观点，让人想骂你
2. 层层剥洋葱 - 用反问、对照、讲故事的方式展开
3. 给结论 - 要有态度，不能和稀泥
4. 留彩蛋 - 留个钩子，让人想评论区battle

字数要求：{wordCount}字左右

写法禁忌：
- 不要"首先...其次...最后"这种流水账
- 不要堆砌专业术语装高深
- 不要一碗水端平，写成安全的中立文章

记住：自媒体文章最大的成功是让人看完想骂你，或者看完想转发打脸你！`,

  title: `为以下文章生成5个爆炸性标题：

文章主题：{topic}
文章内容摘要：{summary}

要求：
- 标题党风格，但不做标题欺诈
- 要有冲击力，能引发好奇心
- 可以用数字、对比、反问
- 让人一看就想点进去看看到底是不是这样

返回5个标题，用换行分隔`,

  twitter: `将以下文章核心观点改写成一条引发讨论的推文：
- 120字以内
- 抛出争议性观点
- 带1-2个话题标签
- 结尾甩个问题让评论区炸

文章内容：{content}`,

  xiaohongshu: `将以下文章改写成小红书爆款笔记：

文章内容：{content}

要求：
- 开头用"我研究了X天得出一个反直觉的结论"这种套路
- 多用"真的"、"谁懂啊"、"但是"这种语气词
- 结尾问"你们觉得呢？"引发评论
- 可以适当"怼"一下评论区可能会出现的人
- 控制在500字左右，要精悍有力
- emoji要克制但精准`
};

// 自媒体爆款风格
export const WRITING_STYLES = [
  { id: 'confrontational', name: '怼人流', description: '敢说敢怼，引发讨论，专治各种不服', icon: '🔥' },
  { id: 'insider', name: '内幕流', description: '揭秘行业真相，"其实XX是这样的"', icon: '🔍' },
  { id: 'counter', name: '反常识流', description: '颠覆认知，"你们都错了"', icon: '🤯' },
  { id: 'story', name: '故事流', description: '用案例讲故事，看完当爽文', icon: '📖' }
];

// 平台配置
export const PLATFORM_CONFIG = {
  wechat: {
    name: '微信公众号',
    maxTitleLength: 64,
    maxContentLength: 20000,
    features: ['留言互动', '赞赏功能', '付费内容'],
    contentStyle: '敢怼、有态度、能引发转发'
  },
  zhihu: {
    name: '知乎',
    maxTitleLength: 100,
    maxContentLength: 50000,
    features: ['问答形式', '专业讨论', '专栏'],
    contentStyle: '专业但接地气，有数据支撑'
  },
  xiaohongshu: {
    name: '小红书',
    maxTitleLength: 20,
    maxContentLength: 1000,
    features: ['种草笔记', '生活方式', '短内容'],
    contentStyle: '接地气、有共鸣、能引发评论'
  },
  bilibili: {
    name: 'B站',
    maxTitleLength: 50,
    maxContentLength: 5000,
    features: ['视频脚本', '互动社区'],
    contentStyle: '年轻化、有梗、能引发弹幕'
  },
  youtube: {
    name: 'YouTube',
    maxTitleLength: 100,
    maxContentLength: 10000,
    features: ['视频脚本', '多语言'],
    contentStyle: '吸引眼球、有冲击力'
  }
};

// 标题库（用于生成有爆点的标题）
export const TITLE_TEMPLATES = [
  "为什么说{topic}是个笑话？",
  "被夸上天的{topic}，其实根本没用",
  "扒一扒{topic}背后的真相",
  "别再被{topic}忽悠了",
  "我把{topic}研究透了，说点得罪人的话",
  "{topic}的三大谎言，你信了几个？",
  "凭什么{topic}能火？我不服",
  "看完这篇，你还敢吹{topic}吗？"
];

// 金句模板
export const GOLDEN_SENTENCES = [
  "所以问题来了：{content}",
  "说到底，{content}",
  "一句话总结：{content}",
  "划重点：{content}",
  "但最让我想不通的是：{content}",
  "反直觉的是，{content}"
];
