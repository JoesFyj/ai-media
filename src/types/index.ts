export interface HotTopic {
  id: string;
  title: string;
  url: string;
  source: string;
  heat: number;
  category: string;
  timestamp: Date;
  summary?: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  source?: HotTopic;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  platform: 'wechat' | 'zhihu' | 'both';
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface Draft {
  id: string;
  topicId?: string;
  title: string;
  content: string;
  platform: 'wechat' | 'zhihu' | 'both';
  status: 'draft' | 'review' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleItem {
  id: string;
  draftId?: string;
  title: string;
  date: Date;
  platform: 'wechat' | 'zhihu' | 'both';
  status: 'scheduled' | 'published';
}

export interface TrendData {
  date: string;
  heat: number;
  topic?: string;
}

export type TopicSource = 'zhihu' | 'weibo' | 'hackernews' | 'tophub' | 'buzzing' | 'manual';
