import { NextResponse } from 'next/server';

interface HotTopic {
  id: string;
  title: string;
  url: string;
  source: string;
  heat: number;
  category: string;
  timestamp: string;
  summary?: string;
}

// RSS解析函数
function parseRSS(text: string, source: string, category: string): HotTopic[] {
  const items = text.match(/<item>([\s\S]*?)<\/item>/g)?.slice(0, 30) || [];

  return items.map((itemXml: string, index: number) => {
    const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] || '';

    return {
      id: `${source.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      title: title.trim(),
      url: link.trim(),
      heat: Math.floor(Math.random() * 5000) + 1000,
      source,
      category,
      timestamp: new Date().toISOString(),
      summary: descMatch.replace(/<[^>]+>/g, '').substring(0, 100)
    };
  }).filter(item => item.title && item.title.length > 5);
}

// ============ 英文数据源 ============

// Hacker News API
async function fetchHackerNews(): Promise<HotTopic[]> {
  try {
    // 获取 Top Stories IDs
    const idsResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { next: { revalidate: 300 } });
    const ids: number[] = await idsResponse.json();
    const topIds = ids.slice(0, 30);

    // 获取前30个故事的详情
    const stories = await Promise.all(
      topIds.map(async (id) => {
        try {
          const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { next: { revalidate: 300 } });
          return await response.json();
        } catch {
          return null;
        }
      })
    );

    return stories
      .filter((s): s is NonNullable<typeof s> => s !== null && s.title)
      .map((story, index) => ({
        id: `hn-${story.id}`,
        title: story.title,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        heat: (30 - index) * 100 + (story.score || 0),
        source: 'Hacker News',
        category: '技术',
        timestamp: new Date(story.time * 1000).toISOString(),
        summary: story.text ? story.text.substring(0, 100) : `${story.score || 0} points · ${story.descendants || 0} comments`
      }));
  } catch (error) {
    console.error('Hacker News failed:', error);
    return [];
  }
}

// Reddit r/technology 热帖
async function fetchRedditTech(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.reddit.com/r/technology/hot.json?limit=25', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 }
    });
    const data = await response.json();
    const posts = data.data?.children || [];

    return posts.map((post: any, index: number) => ({
      id: `reddit-${post.data.id}`,
      title: post.data.title,
      url: post.data.url || `https://reddit.com${post.data.permalink}`,
      heat: (25 - index) * 100 + (post.data.score || 0),
      source: 'Reddit Tech',
      category: '科技',
      timestamp: new Date(post.data.created_utc * 1000).toISOString(),
      summary: `${post.data.score || 0} upvotes · ${post.data.num_comments || 0} comments`
    })).filter((p: HotTopic) => p.title && !p.title.includes('[removed]'));
  } catch (error) {
    console.error('Reddit failed:', error);
    return [];
  }
}

// Reddit r/artificial 热帖 (AI)
async function fetchRedditAI(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.reddit.com/r/artificial/hot.json?limit=25', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 }
    });
    const data = await response.json();
    const posts = data.data?.children || [];

    return posts.map((post: any, index: number) => ({
      id: `reddit-ai-${post.data.id}`,
      title: post.data.title,
      url: post.data.url || `https://reddit.com${post.data.permalink}`,
      heat: (25 - index) * 100 + (post.data.score || 0),
      source: 'Reddit AI',
      category: 'AI',
      timestamp: new Date(post.data.created_utc * 1000).toISOString(),
      summary: `${post.data.score || 0} upvotes · ${post.data.num_comments || 0} comments`
    })).filter((p: HotTopic) => p.title && !p.title.includes('[removed]'));
  } catch (error) {
    console.error('Reddit AI failed:', error);
    return [];
  }
}

// BBC Tech RSS
async function fetchBBCTech(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://feeds.bbci.co.uk/news/technology/rss.xml', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, 'BBC Tech', '科技');
  } catch (error) {
    console.error('BBC Tech failed:', error);
    return [];
  }
}

// The Verge RSS
async function fetchTheVerge(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.theverge.com/rss/index.xml', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, 'The Verge', '科技');
  } catch (error) {
    console.error('The Verge failed:', error);
    return [];
  }
}

// Ars Technica RSS
async function fetchArsTechnica(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://feeds.arstechnica.com/arstechnica/technology-lab', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, 'Ars Technica', '科技深度');
  } catch (error) {
    console.error('Ars Technica failed:', error);
    return [];
  }
}

// MIT Tech Review RSS
async function fetchMITTechReview(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.technologyreview.com/feed/', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, 'MIT Tech Review', 'AI科技');
  } catch (error) {
    console.error('MIT Tech Review failed:', error);
    return [];
  }
}

// Wired RSS
async function fetchWired(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.wired.com/feed/rss', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, 'Wired', '科技文化');
  } catch (error) {
    console.error('Wired failed:', error);
    return [];
  }
}

// VentureBeat AI RSS
async function fetchVentureBeat(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://venturebeat.com/ai/feed/', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, 'VentureBeat AI', 'AI');
  } catch (error) {
    console.error('VentureBeat failed:', error);
    return [];
  }
}

// TechCrunch RSS
async function fetchTechCrunch(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://techcrunch.com/feed/', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, 'TechCrunch', '创业投资');
  } catch (error) {
    console.error('TechCrunch failed:', error);
    return [];
  }
}

// Engadget RSS
async function fetchEngadget(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.engadget.com/rss.xml', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, 'Engadget', '数码');
  } catch (error) {
    console.error('Engadget failed:', error);
    return [];
  }
}

// ============ 中文数据源 ============

// 36氪 RSS
async function fetch36kr(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://36kr.com/feed', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '36氪', '科技商业');
  } catch (error) {
    console.error('36kr failed:', error);
    return [];
  }
}

// 虎嗅 RSS
async function fetchHuxiu(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.huxiu.com/rss/0.xml', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '虎嗅', '科技商业');
  } catch (error) {
    console.error('Huxiu failed:', error);
    return [];
  }
}

// 机器之心 RSS
async function fetchJiqizhixin(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.jiqizhixin.com/rss', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '机器之心', 'AI人工智能');
  } catch (error) {
    console.error('Jiqizhixin failed:', error);
    return [];
  }
}

// 量子位 RSS
async function fetchQubit(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.qbitai.com/feed', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '量子位', 'AI人工智能');
  } catch (error) {
    console.error('QubitAI failed:', error);
    return [];
  }
}

// 钛媒体 RSS
async function fetchTmtPost(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.tmtpost.com/rss', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '钛媒体', '科技商业');
  } catch (error) {
    console.error('TMTPost failed:', error);
    return [];
  }
}

// 极客公园 RSS
async function fetchGeekPark(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.geekpark.net/rss', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '极客公园', '科技商业');
  } catch (error) {
    console.error('GeekPark failed:', error);
    return [];
  }
}

// 爱范儿 RSS
async function fetchIfanr(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.ifanr.com/feed', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '爱范儿', '科技数码');
  } catch (error) {
    console.error('Ifanr failed:', error);
    return [];
  }
}

// 品玩 RSS
async function fetchPingWest(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.pingwest.com/rss', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '品玩', '科技数码');
  } catch (error) {
    console.error('PingWest failed:', error);
    return [];
  }
}

// 澎湃新闻 RSS
async function fetchThePaper(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.thepaper.cn/rss', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '澎湃新闻', '综合新闻');
  } catch (error) {
    console.error('ThePaper failed:', error);
    return [];
  }
}

// 雷锋网 RSS
async function fetchLeiphone(): Promise<HotTopic[]> {
  try {
    const response = await fetch('https://www.leiphone.com/feed', { next: { revalidate: 300 } });
    const text = await response.text();
    return parseRSS(text, '雷锋网', '科技商业');
  } catch (error) {
    console.error('Leiphone failed:', error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const source = searchParams.get('source') || 'all';
  const category = searchParams.get('category') || 'all';

  try {
    // 定义数据源分组
    const englishSources = [
      fetchHackerNews(),
      fetchRedditTech(),
      fetchRedditAI(),
      fetchBBCTech(),
      fetchTheVerge(),
      fetchArsTechnica(),
      fetchMITTechReview(),
      fetchWired(),
      fetchVentureBeat(),
      fetchTechCrunch(),
      fetchEngadget()
    ];

    const chineseSources = [
      fetch36kr(),
      fetchHuxiu(),
      fetchJiqizhixin(),
      fetchQubit(),
      fetchTmtPost(),
      fetchGeekPark(),
      fetchIfanr(),
      fetchPingWest(),
      fetchThePaper(),
      fetchLeiphone()
    ];

    // 并行获取所有数据源
    const allSourcePromises = [...englishSources, ...chineseSources];
    const results = await Promise.allSettled(allSourcePromises);

    const topics: HotTopic[] = [];

    // 收集成功的结果
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        topics.push(...result.value);
      }
    });

    // 按关键词过滤
    let filtered = topics;
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = topics.filter(item =>
        item.title.toLowerCase().includes(kw) ||
        (item.summary && item.summary.toLowerCase().includes(kw))
      );
    }

    // 按来源过滤
    if (source !== 'all') {
      filtered = filtered.filter(item => item.source === source);
    }

    // 按分类过滤
    if (category !== 'all') {
      filtered = filtered.filter(item =>
        item.category.toLowerCase().includes(category.toLowerCase()) ||
        item.source.toLowerCase().includes(category.toLowerCase())
      );
    }

    // 按热度排序
    filtered.sort((a, b) => b.heat - a.heat);

    // 统计各来源数量
    const sourceStats: Record<string, number> = {};
    topics.forEach(item => {
      sourceStats[item.source] = (sourceStats[item.source] || 0) + 1;
    });

    // 统计各分类数量
    const categoryStats: Record<string, number> = {};
    topics.forEach(item => {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
      allTotal: topics.length,
      sources: sourceStats,
      categories: categoryStats
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: '获取热点失败',
      data: []
    }, { status: 500 });
  }
}
