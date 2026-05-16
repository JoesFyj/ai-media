import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Topic, Draft, ScheduleItem, HotTopic } from '@/types';
import {
  UserPreference,
  EditRecord,
  defaultPreference,
  analyzePreferences,
  determineLearningProgress
} from '@/lib/preferences';

interface AppState {
  hotTopics: HotTopic[];
  topics: Topic[];
  drafts: Draft[];
  schedules: ScheduleItem[];
  isLoading: boolean;
  lastUpdated: Date | null;

  // 用户偏好相关
  userPreferences: UserPreference;
  editHistory: EditRecord[];
  currentSessionEdits: EditRecord[];

  // Actions
  setHotTopics: (topics: HotTopic[]) => void;
  addTopic: (topic: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
  addDraft: (draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDraft: (id: string, updates: Partial<Draft>) => void;
  deleteDraft: (id: string) => void;
  addSchedule: (schedule: Omit<ScheduleItem, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;
  setLoading: (loading: boolean) => void;

  // 用户偏好相关 Actions
  recordEdit: (edit: Omit<EditRecord, 'id' | 'timestamp'>) => void;
  clearCurrentSessionEdits: () => void;
  finalizeLearning: () => void;
  resetPreferences: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      hotTopics: [],
      topics: [],
      drafts: [],
      schedules: [],
      isLoading: false,
      lastUpdated: null,

      // 用户偏好初始化
      userPreferences: defaultPreference,
      editHistory: [],
      currentSessionEdits: [],

      setHotTopics: (topics) => set({ hotTopics: topics, lastUpdated: new Date() }),

      addTopic: (topic) => set((state) => ({
        topics: [
          ...state.topics,
          {
            ...topic,
            id: `topic-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      })),

      updateTopic: (id, updates) => set((state) => ({
        topics: state.topics.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
        )
      })),

      deleteTopic: (id) => set((state) => ({
        topics: state.topics.filter((t) => t.id !== id)
      })),

      addDraft: (draft) => set((state) => ({
        drafts: [
          ...state.drafts,
          {
            ...draft,
            id: `draft-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      })),

      updateDraft: (id, updates) => set((state) => ({
        drafts: state.drafts.map((d) =>
          d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
        )
      })),

      deleteDraft: (id) => set((state) => ({
        drafts: state.drafts.filter((d) => d.id !== id)
      })),

      addSchedule: (schedule) => set((state) => ({
        schedules: [
          ...state.schedules,
          {
            ...schedule,
            id: `schedule-${Date.now()}`
          }
        ]
      })),

      updateSchedule: (id, updates) => set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        )
      })),

      deleteSchedule: (id) => set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id)
      })),

      setLoading: (loading) => set({ isLoading: loading }),

      // 记录用户修改
      recordEdit: (edit) => set((state) => {
        const newEdit: EditRecord = {
          ...edit,
          id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };

        return {
          currentSessionEdits: [...state.currentSessionEdits, newEdit],
          editHistory: [...state.editHistory.slice(-100), newEdit] // 保留最近100条
        };
      }),

      // 清除当前会话的编辑记录
      clearCurrentSessionEdits: () => set({ currentSessionEdits: [] }),

      // 完成一篇文章的学习
      finalizeLearning: () => set((state) => {
        const { currentSessionEdits, userPreferences } = state;

        if (currentSessionEdits.length === 0) {
          return state;
        }

        // 分析偏好
        const analyzed = analyzePreferences(currentSessionEdits, userPreferences);
        const sectionsCount = currentSessionEdits.filter(e => e.context?.startsWith('section-')).length;

        // 更新统计
        analyzed.totalArticles += 1;
        analyzed.totalSections += sectionsCount;
        analyzed.totalEdits += currentSessionEdits.length;

        // 确定学习进度
        analyzed.learningProgress = determineLearningProgress(analyzed);

        return {
          userPreferences: analyzed,
          currentSessionEdits: [], // 清除会话记录
          lastUpdated: new Date()
        };
      }),

      // 重置偏好
      resetPreferences: () => set({
        userPreferences: defaultPreference,
        editHistory: [],
        currentSessionEdits: []
      })
    }),
    {
      name: 'ai-media-storage'
    }
  )
);
