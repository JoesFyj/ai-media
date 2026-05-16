import { HotTopic } from '@/types';

interface TophubItem {
  title: string;
  url: string;
  heat?: number;
  category?: string;
  source?: string;
}

interface BuzzingItem {
  title: string;
  url: string;
  score?: number;
  domain?: string;
}

// 今日热榜 - 科技分类
export async function fetchTophubTech(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://api.tophub.today/v2/getAllInfoData?n=30&type=1&cid=5', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });
    const data = await response.json();

    if (data.code === 200 && data.data) {
      return data.data.map((item: TophubItem, index: number) => ({
        id: `tophub-${index}`,
        title: item.title,
        url: item.url,
        heat: item.heat || 0,
        source: '今日热榜',
        category: item.category || '科技',
        timestamp: new Date()
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch tophub:', error);
    return [];
  }
}

// 最热网 - 科技新闻聚合
export async function fetchBusiyiNews(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://newsnow.busiyi.world/api/v1/feeds?category=tech&limit=20', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data.map((item: { id: number; title: string; url: string; heat?: number; source?: string }, index: number) => ({
        id: `busiyi-${index}`,
        title: item.title,
        url: item.url,
        heat: item.heat || Math.floor(Math.random() * 5000),
        source: item.source || '最热网',
        category: '科技',
        timestamp: new Date()
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch busiyi:', error);
    return [];
  }
}

// Hacker News 中文聚合
export async function fetchHackerNewsChina(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://hn.buzzing.cc/hot/list.json', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.slice(0, 20).map((item: BuzzingItem, index: number) => ({
        id: `hn-${index}`,
        title: item.title,
        url: item.url,
        heat: (item.score || 0) * 10,
        source: 'Hacker News中文',
        category: '技术',
        timestamp: new Date()
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch Hacker News China:', error);
    return [];
  }
}

// Hacker News 官方API
export async function fetchHackerNewsOfficial(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      next: { revalidate: 300 }
    });
    const storyIds = await response.json();

    if (Array.isArray(storyIds)) {
      const topStories = storyIds.slice(0, 15);
      const stories = await Promise.all(
        topStories.map(async (id: number) => {
          const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return storyRes.json();
        })
      );

      return stories.map((story: { id: number; title: string; url?: string; score?: number }, index: number) => ({
        id: `hn-official-${index}`,
        title: story.title,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        heat: story.score || 0,
        source: 'Hacker News',
        category: '技术',
        timestamp: new Date()
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch Hacker News Official:', error);
    return [];
  }
}

// GitHub 趋势项目
export async function fetchGithubTrending(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc&per_page=15', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 600 }
    });
    const data = await response.json();

    if (data.items) {
      return data.items.map((item: { id: number; name: string; html_url: string; stargazers_count: number; description: string; language?: string }, index: number) => ({
        id: `github-${index}`,
        title: `${item.name}: ${item.description || 'No description'}`,
        url: item.html_url,
        heat: item.stargazers_count,
        source: 'GitHub',
        category: item.language ? `${item.language}项目` : '开源项目',
        timestamp: new Date()
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch GitHub:', error);
    return [];
  }
}

// 学术研究新闻 - phys.org
export async function fetchPhysNews(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://phys.org/rss-feed/', {
      headers: { 'Accept': 'application/xml' },
      next: { revalidate: 600 }
    });
    const text = await response.text();

    // 简单的RSS解析
    const items = text.match(/<item>([\s\S]*?)<\/item>/g)?.slice(0, 15) || [];

    return items.map((itemXml: string, index: number) => {
      const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';

      return {
        id: `phys-${index}`,
        title,
        url: link,
        heat: Math.floor(Math.random() * 3000) + 500,
        source: 'Phys.org',
        category: '学术研究',
        timestamp: new Date()
      };
    });
  } catch (error) {
    console.error('Failed to fetch Phys.org:', error);
    return [];
  }
}

// 科技AI健康 - Ars Technica
export async function fetchArsTechnica(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://feeds.arstechnica.com/arstechnica/technology-lab', {
      headers: { 'Accept': 'application/xml' },
      next: { revalidate: 600 }
    });
    const text = await response.text();

    const items = text.match(/<item>([\s\S]*?)<\/item>/g)?.slice(0, 10) || [];

    return items.map((itemXml: string, index: number) => {
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                   itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';

      return {
        id: `ars-${index}`,
        title,
        url: link,
        heat: Math.floor(Math.random() * 2000) + 1000,
        source: 'Ars Technica',
        category: '科技AI',
        timestamp: new Date()
      };
    });
  } catch (error) {
    console.error('Failed to fetch Ars Technica:', error);
    return [];
  }
}

// 社科文化 - The Atlantic
export async function fetchTheAtlantic(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.theatlantic.com/feed/all/', {
      headers: { 'Accept': 'application/xml' },
      next: { revalidate: 600 }
    });
    const text = await response.text();

    const items = text.match(/<item>([\s\S]*?)<\/item>/g)?.slice(0, 10) || [];

    return items.map((itemXml: string, index: number) => {
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                   itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';

      return {
        id: `atlantic-${index}`,
        title,
        url: link,
        heat: Math.floor(Math.random() * 1500) + 500,
        source: 'The Atlantic',
        category: '社科文化',
        timestamp: new Date()
      };
    });
  } catch (error) {
    console.error('Failed to fetch The Atlantic:', error);
    return [];
  }
}

// 全球商业财经 - Economist
export async function fetchEconomist(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.economist.com/rss', {
      headers: { 'Accept': 'application/xml' },
      next: { revalidate: 600 }
    });
    const text = await response.text();

    const items = text.match(/<item>([\s\S]*?)<\/item>/g)?.slice(0, 10) || [];

    return items.map((itemXml: string, index: number) => {
      const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';

      return {
        id: `economist-${index}`,
        title,
        url: link,
        heat: Math.floor(Math.random() * 2000) + 800,
        source: 'Economist',
        category: '商业财经',
        timestamp: new Date()
      };
    });
  } catch (error) {
    console.error('Failed to fetch Economist:', error);
    return [];
  }
}

// 国际通讯社 - UPI
export async function fetchUPI(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.upi.com/rss/topnews.xml', {
      headers: { 'Accept': 'application/xml' },
      next: { revalidate: 300 }
    });
    const text = await response.text();

    const items = text.match(/<item>([\s\S]*?)<\/item>/g)?.slice(0, 15) || [];

    return items.map((itemXml: string, index: number) => {
      const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';

      return {
        id: `upi-${index}`,
        title,
        url: link,
        heat: Math.floor(Math.random() * 3000) + 1000,
        source: 'UPI',
        category: '国际新闻',
        timestamp: new Date()
      };
    });
  } catch (error) {
    console.error('Failed to fetch UPI:', error);
    return [];
  }
}

// 日本英文新闻 - News on Japan
export async function fetchNewsOnJapan(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.newsonjapan.com/rss/news.xml', {
      headers: { 'Accept': 'application/xml' },
      next: { revalidate: 600 }
    });
    const text = await response.text();

    const items = text.match(/<item>([\s\S]*?)<\/item>/g)?.slice(0, 10) || [];

    return items.map((itemXml: string, index: number) => {
      const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';

      return {
        id: `japan-${index}`,
        title,
        url: link,
        heat: Math.floor(Math.random() * 1000) + 300,
        source: 'News on Japan',
        category: '日本新闻',
        timestamp: new Date()
      };
    });
  } catch (error) {
    console.error('Failed to fetch News on Japan:', error);
    return [];
  }
}

// 汽车产业新闻 - Drive.com.au
export async function fetchDriveNews(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.drive.com.au/rss/news.xml', {
      headers: { 'Accept': 'application/xml' },
      next: { revalidate: 600 }
    });
    const text = await response.text();

    const items = text.match(/<item>([\s\S]*?)<\/item>/g)?.slice(0, 10) || [];

    return items.map((itemXml: string, index: number) => {
      const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';

      return {
        id: `drive-${index}`,
        title,
        url: link,
        heat: Math.floor(Math.random() * 1500) + 500,
        source: 'Drive.com.au',
        category: '汽车产业',
        timestamp: new Date()
      };
    });
  } catch (error) {
    console.error('Failed to fetch Drive:', error);
    return [];
  }
}

// 推特爆帖分析
export async function fetchTwitterHotPosts(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://sopilot.net/zh/api/hot-tweets', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data.slice(0, 15).map((item: { id: string; text: string; url?: string; likes?: number }, index: number) => ({
        id: `twitter-${index}`,
        title: item.text.substring(0, 100) + (item.text.length > 100 ? '...' : ''),
        url: item.url || `https://twitter.com/i/status/${item.id}`,
        heat: item.likes || Math.floor(Math.random() * 5000),
        source: '推特爆帖',
        category: '社交热点',
        timestamp: new Date()
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch Twitter hot posts:', error);
    return [];
  }
}

// 获取所有热点
export async function fetchAllHotTopics(): Promise<HotTopic[]> {
  const fetches = await Promise.allSettled([
    fetchTophubTech(),
    fetchBusiyiNews(),
    fetchHackerNewsChina(),
    fetchHackerNewsOfficial(),
    fetchGithubTrending(),
    fetchPhysNews(),
    fetchArsTechnica(),
    fetchTheAtlantic(),
    fetchEconomist(),
    fetchUPI(),
    fetchNewsOnJapan(),
    fetchDriveNews(),
    fetchTwitterHotPosts()
  ]);

  const results: HotTopic[] = [];

  fetches.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      results.push(...result.value);
    }
  });

  // 按热度排序
  return results.sort((a, b) => b.heat - a.heat);
}

// 获取可用的数据源列表
export function getAvailableSources(): { name: string; url: string; description: string }[] {
  return [
    { name: '今日热榜', url: 'https://tophub.today/c/tech', description: '科技类热榜聚合' },
    { name: '最热网', url: 'https://newsnow.busiyi.world/', description: '科技新闻聚合' },
    { name: 'Hacker News中文', url: 'https://hn.buzzing.cc', description: '每日热帖一站看完' },
    { name: 'Hacker News', url: 'https://news.ycombinator.com', description: '技术圈风向标' },
    { name: 'GitHub', url: 'https://github.com', description: '开源项目趋势' },
    { name: 'Phys.org', url: 'https://phys.org', description: '学术研究刚发表就能看' },
    { name: 'Ars Technica', url: 'https://arstechnica.com', description: '科技AI健康深度长文' },
    { name: 'The Atlantic', url: 'https://theatlantic.com', description: '美国社科文化调查' },
    { name: 'Economist', url: 'https://economist.com', description: '全球商业财经' },
    { name: 'UPI', url: 'https://upi.com', description: '国际通讯社' },
    { name: 'News on Japan', url: 'https://newsonjapan.com', description: '日本英文新闻' },
    { name: 'Drive.com.au', url: 'https://drive.com.au', description: '汽车产业新闻' },
    { name: '推特爆帖', url: 'https://sopilot.net/zh/hot-tweets', description: '推特热门推文分析' }
  ];
}
