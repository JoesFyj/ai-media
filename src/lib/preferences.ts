// 用户偏好学习模块
// 记录用户行为，学习用户风格，逐渐固化

export interface UserPreference {
  // 基本统计
  totalArticles: number;
  totalSections: number;
  totalEdits: number;

  // 标题偏好
  titleStyles: {
    controversial: number;      // 争议性标题
    question: number;          // 疑问句标题
    numberList: number;        // 数字列表标题
    shocking: number;          // 震惊体标题
    neutral: number;           // 中性标题
  };

  // 章节偏好
  sectionPreferences: {
    avgSectionCount: number;    // 平均章节数
    sectionsWith3Points: number; // 3个观点的章节数
    sectionsWith2Points: number; // 2个观点的章节数
  };

  // 写作风格偏好
  writingStyle: {
    confrontational: number;  // 怼人流
    insider: number;           // 内幕流
    counterIntuitive: number; // 反常识流
    story: number;            // 故事流
  };

  // 内容特征
  contentFeatures: {
    avgWordsPerSection: number;  // 平均每段字数
    usesEmoji: number;           // 使用emoji
    usesBold: number;             // 使用粗体
    hasCallToAction: number;      // 有行动号召
    hasRhetoricalQuestion: number; // 有反问句
  };

  // 常用词汇（从修改中提取）
  preferredWords: string[];

  // 用户修改模式
  editPatterns: {
    addedPoints: number;      // 添加的观点数
    removedPoints: number;   // 删除的观点数
    modifiedHeadings: number; // 修改的章节标题数
    modifiedContent: number;  // 修改的内容次数
    keptOriginalContent: number; // 保留AI生成内容的次数
  };

  // 学习进度
  learningProgress: 'initial' | 'learning' | 'adapted' | 'mastered';
  lastUpdated: Date;

  // 观察到的偏好（从行为中提取）
  observedPreferences: {
    prefersShortSections: boolean;
    prefersDataDriven: boolean;
    prefersStorytelling: boolean;
    prefersConfrontational: boolean;
    prefersConclusionCTA: boolean;
    tone: 'aggressive' | 'moderate' | 'gentle';
    depth: 'shallow' | 'medium' | 'deep';
  };
}

export interface EditRecord {
  id: string;
  timestamp: Date;
  type: 'outline' | 'heading' | 'point' | 'content' | 'style';
  original: string;
  modified: string;
  context?: string; // 所属章节/位置
}

export interface LearningSession {
  topicId: string;
  startedAt: Date;
  edits: EditRecord[];
  finalChoices: {
    title: string;
    sections: { heading: string; points: string[]; content: string }[];
    style: string;
  };
}

// 默认偏好
export const defaultPreference: UserPreference = {
  totalArticles: 0,
  totalSections: 0,
  totalEdits: 0,
  titleStyles: {
    controversial: 0,
    question: 0,
    numberList: 0,
    shocking: 0,
    neutral: 0
  },
  sectionPreferences: {
    avgSectionCount: 5,
    sectionsWith3Points: 0,
    sectionsWith2Points: 0
  },
  writingStyle: {
    confrontational: 0,
    insider: 0,
    counterIntuitive: 0,
    story: 0
  },
  contentFeatures: {
    avgWordsPerSection: 300,
    usesEmoji: 0,
    usesBold: 0,
    hasCallToAction: 0,
    hasRhetoricalQuestion: 0
  },
  preferredWords: [],
  editPatterns: {
    addedPoints: 0,
    removedPoints: 0,
    modifiedHeadings: 0,
    modifiedContent: 0,
    keptOriginalContent: 0
  },
  learningProgress: 'initial',
  lastUpdated: new Date(),
  observedPreferences: {
    prefersShortSections: false,
    prefersDataDriven: false,
    prefersStorytelling: false,
    prefersConfrontational: false,
    prefersConclusionCTA: true,
    tone: 'moderate',
    depth: 'medium'
  }
};

// 分类标题风格
export function classifyTitle(title: string): keyof UserPreference['titleStyles'] {
  if (title.includes('？') || title.includes('?')) return 'question';
  if (/^\d+/.test(title)) return 'numberList';
  if (/震惊|炸裂|颠覆|凭什么|不服|笑话|骗/.test(title)) return 'shocking';
  if (/怼|不服|凭什么|我不服|真相|内幕|扒一扒/.test(title)) return 'controversial';
  return 'neutral';
}

// 从修改中提取用户偏好
export function analyzePreferences(edits: EditRecord[], preference: UserPreference): UserPreference {
  const updated = { ...preference };

  updated.totalEdits += edits.length;

  // 分析修改模式
  edits.forEach(edit => {
    switch (edit.type) {
      case 'heading':
        updated.editPatterns.modifiedHeadings++;
        break;
      case 'point':
        if (edit.modified.length > edit.original.length) {
          updated.editPatterns.addedPoints++;
        } else if (edit.modified.length < edit.original.length) {
          updated.editPatterns.removedPoints++;
        }
        break;
      case 'content':
        updated.editPatterns.modifiedContent++;
        break;
    }
  });

  // 分析观察到的偏好
  const contentEdits = edits.filter(e => e.type === 'content');
  const pointEdits = edits.filter(e => e.type === 'point');

  // 如果用户经常修改内容但不大幅删减，说明用户喜欢精炼内容
  if (contentEdits.length > 3) {
    updated.observedPreferences.prefersShortSections = true;
  }

  // 如果添加了很多观点，说明用户喜欢详尽
  if (updated.editPatterns.addedPoints > updated.editPatterns.removedPoints * 2) {
    updated.observedPreferences.depth = 'deep';
  }

  // 从内容中提取常用词汇
  const allContent = edits
    .filter(e => e.type === 'content')
    .map(e => e.modified)
    .join(' ');

  const words = extractKeyWords(allContent);
  updated.preferredWords = [...new Set([...updated.preferredWords, ...words])].slice(0, 50);

  updated.lastUpdated = new Date();

  return updated;
}

// 提取关键词
function extractKeyWords(text: string): string[] {
  const patterns = [
    /[但是|所以|其实|说到底|最让我|反直觉|一句话|划重点]/g,
    /[怼|不服|凭什么|内幕|扒一扒|真相]/g,
    /[但是|因此|然而]/g
  ];

  const words: string[] = [];
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      words.push(...matches);
    }
  });

  return words;
}

// 判断学习进度
export function determineLearningProgress(preference: UserPreference): UserPreference['learningProgress'] {
  const { totalArticles, totalEdits, editPatterns } = preference;

  if (totalArticles >= 5 && totalEdits >= 20) {
    return 'mastered';
  } else if (totalArticles >= 3 && totalEdits >= 10) {
    return 'adapted';
  } else if (totalArticles >= 1 || totalEdits >= 3) {
    return 'learning';
  }
  return 'initial';
}

// 生成应用偏好的提示词
export function buildPreferencePrompt(preference: UserPreference): string {
  let prompt = '\n\n【写作风格】（像朋友聊天，不要端着）：\n';

  // 口语化
  prompt += '- 口语化，像跟你哥们儿吹牛\n';
  prompt += '- 用"我寻思"、"咋"、"ber"、"好好好"这种\n';
  prompt += '- 不要"首先其次最后"，太像写论文了\n';

  // 自嘲调侃
  prompt += '- 自嘲+调侃，把自己也别放过\n';
  prompt += '- 把自己也写进去，"跟我还是同行..."\n';

  // 有情绪
  prompt += '- 有情绪但有起伏，惊讶"ber！！！"、无奈"好好好"\n';

  // 生活化
  prompt += '- 生活化举例，用场景说话，不要干巴巴讲道理\n';
  prompt += '- 用"配龙虾"、"吃饭"、"隔壁老王"这种具体场景\n';

  // 刘震云味道
  prompt += '- 小人物折射大道理，幽默中带讽刺\n';
  prompt += '- 对话要有烟火气，像真人在说话\n';
  prompt += '- 反常识但不刻意，出人意料又在情理之中\n';

  // 禁止
  prompt += '- 禁止太像论文的写法\n';
  prompt += '- 禁止堆砌式段落，要松，有呼吸感\n';

  // 如果有学习数据，添加个性化偏好
  if (preference.learningProgress !== 'initial') {
    prompt += '\n【作者风格偏好】：\n';

    if (preference.observedPreferences.tone === 'aggressive') {
      prompt += '- 语气犀利，敢怼\n';
    } else if (preference.observedPreferences.tone === 'gentle') {
      prompt += '- 语气温和，以理服人\n';
    }

    if (preference.observedPreferences.depth === 'deep') {
      prompt += '- 内容详尽，深入分析\n';
    } else if (preference.observedPreferences.depth === 'shallow') {
      prompt += '- 内容简洁，一针见血\n';
    }

    if (preference.editPatterns.keptOriginalContent > preference.editPatterns.modifiedContent) {
      prompt += '- 用户倾向于保留AI生成的内容\n';
    }
  }

  return prompt;
}

// 写作铁律提示词（简短版，用于写作提示）
export const WRITING_RULES = `
【写作风格】（像朋友聊天，不要端着）

1. 口语化，像跟你哥们儿吹牛
   - 用"我寻思"、"咋"、"ber"、"好好好"这种
   - 不要"首先其次最后"，太像写论文了
   - 一句话能说完就别扯两句

2. 自嘲 + 调侃，自己也别放过
   - 把自己也写进去，"跟我还是同行..."
   - 调侃要善意，不是阴阳怪气
   - 朋友式吐槽，大家都轻松

3. 有情绪，但不要过
   - 惊讶"ber！！！"、无奈"好好好"、调侃"凭啥啊"
   - 不要一直高潮，情绪要有起伏
   - 结尾可以温和收，也可以来个回马枪

4. 生活化举例，不要干巴巴讲道理
   - 用"配龙虾"、"吃饭"、"隔壁老王"这种
   - 场景要具体，有画面感
   - 举例子要精准，不要凑数

5. 可以反问，但要像朋友的反问
   - "凭啥用你啊"、"你不说我还真没想到"
   - 不是质问，是"咱就是说"
   - 读者不会觉得被审问

6. 层层递进，像剥洋葱
   - 开头直接扔结论，"我被创飞了"
   - 一点点往里扒，每层都有新东西
   - 让读者"哦原来是这样"

7. 刘震云的味道
   - 小人物折射大道理
   - 幽默中带讽刺，笑着递刀子
   - 对话要有烟火气，像真人在说话
   - 反常识但不刻意，出人意料又在情理之中
   - 留白，让读者自己品

8. 结构要松，不要紧
   - 自然分段，不要硬凑
   - 一个观点一段，不要堆砌
   - 段落之间要有呼吸感
`;
