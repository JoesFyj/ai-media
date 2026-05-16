'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TrendingUp, FileText, Calendar, Home, BookOpen, PenTool, Video, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/hot-topics', label: '热点追踪', icon: TrendingUp },
  { href: '/topics', label: '选题策划', icon: BookOpen },
  { href: '/create', label: 'AI写作', icon: PenTool, highlight: true },
  { href: '/video', label: 'AI视频', icon: Video },
  { href: '/drafts', label: '草稿箱', icon: FileText },
  { href: '/schedule', label: '发布排期', icon: Calendar },
  { href: '/analytics', label: '数据分析', icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2 mr-8">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AI</span>
          </div>
          <span className="font-bold hidden sm:inline-block">内容创作运营系统</span>
        </div>
        <div className="flex gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted',
                pathname === item.href ? 'bg-muted text-foreground' : 'text-muted-foreground',
                item.highlight && 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
