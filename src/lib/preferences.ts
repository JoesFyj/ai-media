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
  let prompt = '\n\n【写作铁律】（必须遵守）：\n';

  // 永远不要反问句
  prompt += '1. 禁止使用反问句！！！读者不是来回答问题的，是来看答案的\n';
  prompt += '2. 层层递进，像剥洋葱，一层层往里面扒，让读者欲罢不能\n';
  prompt += '3. 每句话都要有信息量，不要废话，不要重复\n';
  prompt += '4. 开头就要抛出结论或观点，不要铺垫太久\n';
  prompt += '5. 让读者快速知道文章讲什么，然后层层深入\n';

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
【写作铁律】
1. 禁止反问句！！！读者不是来回答问题的
2. 层层递进，像剥洋葱，让读者欲罢不能
3. 每句话都有信息量，不废话
4. 开头抛出结论，让读者快速知道讲什么
5. 像看小说一样，一层层往里面扒
`;
