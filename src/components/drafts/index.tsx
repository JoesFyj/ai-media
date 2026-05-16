'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { Draft } from '@/types';
import { Plus, Trash2, Edit2, FileText, Send, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export function DraftsList() {
  const { drafts, addDraft, updateDraft, deleteDraft } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [newDraft, setNewDraft] = useState({
    title: '',
    content: '',
    platform: 'wechat' as 'wechat' | 'zhihu' | 'both',
    topicId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDraft.title.trim()) return;

    if (editingDraft) {
      updateDraft(editingDraft.id, {
        title: newDraft.title,
        content: newDraft.content,
        platform: newDraft.platform
      });
    } else {
      addDraft({
        title: newDraft.title,
        content: newDraft.content,
        platform: newDraft.platform,
        status: 'draft',
        topicId: newDraft.topicId || undefined
      });
    }

    setNewDraft({ title: '', content: '', platform: 'wechat', topicId: '' });
    setEditingDraft(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (draft: Draft) => {
    setEditingDraft(draft);
    setNewDraft({
      title: draft.title,
      content: draft.content,
      platform: draft.platform,
      topicId: draft.topicId || ''
    });
    setIsDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const getStatusBadge = (status: Draft['status']) => {
    const variants: Record<string, string> = {
      draft: 'bg-gray-500 text-white',
      review: 'bg-yellow-500 text-white',
      published: 'bg-green-500 text-white'
    };
    const labels: Record<string, string> = {
      draft: '草稿',
      review: '待审核',
      published: '已发布'
    };
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  const draftDrafts = drafts.filter(d => d.status === 'draft');
  const reviewDrafts = drafts.filter(d => d.status === 'review');
  const publishedDrafts = drafts.filter(d => d.status === 'published');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">草稿箱</h1>
          <p className="text-muted-foreground mt-1">
            管理你的文章草稿，准备发布
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />新建草稿</Button>} />
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDraft ? '编辑草稿' : '创建新草稿'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">标题</label>
                  <Input
                    placeholder="输入文章标题..."
                    value={newDraft.title}
                    onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">发布平台</label>
                  <div className="flex gap-2">
                    {(['wechat', 'zhihu'] as const).map(p => (
                      <Button
                        key={p}
                        type="button"
                        variant={newDraft.platform === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewDraft({ ...newDraft, platform: p })}
                      >
                        {p === 'wechat' ? '微信' : '知乎'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">正文内容</label>
                <Textarea
                  placeholder="输入文章内容..."
                  value={newDraft.content}
                  onChange={(e) => setNewDraft({ ...newDraft, content: e.target.value })}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingDraft ? '保存修改' : '保存草稿'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Badge variant="outline">{draftDrafts.length}</Badge>
                待写
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {draftDrafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onEdit={() => handleEdit(draft)}
                    onDelete={() => deleteDraft(draft.id)}
                    onCopy={copyToClipboard}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
                {draftDrafts.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">暂无草稿</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Badge variant="outline">{reviewDrafts.length}</Badge>
                待审核
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {reviewDrafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onEdit={() => handleEdit(draft)}
                    onDelete={() => deleteDraft(draft.id)}
                    onCopy={copyToClipboard}
                    onStatusChange={(status) => updateDraft(draft.id, { status })}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
                {reviewDrafts.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">暂无待审核</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Badge variant="outline">{publishedDrafts.length}</Badge>
                已发布
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {publishedDrafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onEdit={() => handleEdit(draft)}
                    onDelete={() => deleteDraft(draft.id)}
                    onCopy={copyToClipboard}
                    getStatusBadge={getStatusBadge}
                    showActions={false}
                  />
                ))}
                {publishedDrafts.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">暂无已发布</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  onEdit,
  onDelete,
  onCopy,
  onStatusChange,
  getStatusBadge,
  showActions = true
}: {
  draft: Draft;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: (content: string) => void;
  onStatusChange?: (status: Draft['status']) => void;
  getStatusBadge: (status: Draft['status']) => React.ReactElement;
  showActions?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="text-xs">
          {draft.platform === 'wechat' ? '微信' : '知乎'}
        </Badge>
        {getStatusBadge(draft.status)}
      </div>
      <h4 className="font-medium text-sm line-clamp-1">{draft.title}</h4>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {draft.content || '暂无内容'}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        {new Date(draft.updatedAt).toLocaleDateString('zh-CN')}
      </p>
      {showActions && (
        <div className="flex gap-1 mt-2">
          {draft.status === 'draft' && onStatusChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange('review')}
              className="h-7 text-xs"
            >
              提交审核
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7">
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCopy(draft.content)}
            className="h-7 w-7"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
