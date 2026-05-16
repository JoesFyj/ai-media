'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStore } from '@/lib/store';
import { ScheduleItem } from '@/types';
import { Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

export function ScheduleCalendar() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    platform: 'wechat' as 'wechat' | 'zhihu' | 'both'
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(s => isSameDay(new Date(s.date), date));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.title.trim() || !selectedDate) return;

    addSchedule({
      title: newSchedule.title,
      date: selectedDate,
      platform: newSchedule.platform,
      status: 'scheduled'
    });

    setNewSchedule({ title: '', platform: 'wechat' });
    setIsDialogOpen(false);
    toast.success('已添加到排期');
  };

  const handlePublish = (scheduleId: string) => {
    updateSchedule(scheduleId, { status: 'published' });
    toast.success('已标记为发布');
  };

  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;
  const publishedCount = schedules.filter(s => s.status === 'published').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">发布排期</h1>
          <p className="text-muted-foreground mt-1">
            规划内容发布时间，保持更新节奏
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{scheduledCount}</Badge>
            <span className="text-sm text-muted-foreground">待发布</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{publishedCount}</Badge>
            <span className="text-sm text-muted-foreground">已完成</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentMonth, 'yyyy年 MMMM', { locale: zhCN })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border">
              {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
              {days.map((day) => {
                const daySchedules = getSchedulesForDay(day);
                const isPast = isBefore(day, new Date()) && !isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] p-1 bg-background border-b border-r ${
                      isPast ? 'opacity-50' : ''
                    }`}
                  >
                    <div className={`text-sm p-1 ${isToday(day) ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {daySchedules.slice(0, 2).map((schedule) => (
                        <div
                          key={schedule.id}
                          className={`text-xs p-1 rounded truncate ${
                            schedule.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {schedule.title}
                        </div>
                      ))}
                      {daySchedules.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{daySchedules.length - 2} 更多
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加发布计划
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Popover>
              <PopoverTrigger render={<Button variant="outline" className="w-full justify-start"><CalendarIcon className="h-4 w-4 mr-2" />{selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '选择日期'}</Button>} />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => {
                    setSelectedDate(date || null);
                    setIsDialogOpen(true);
                  }}
                  disabled={(date) => isBefore(date, new Date()) && !isToday(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedDate && format(selectedDate, 'yyyy年MM月dd日')} 发布计划
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">内容标题</label>
                    <Input
                      placeholder="输入发布内容标题..."
                      value={newSchedule.title}
                      onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">发布平台</label>
                    <div className="flex gap-2">
                      {(['wechat', 'zhihu', 'both'] as const).map(p => (
                        <Button
                          key={p}
                          type="button"
                          variant={newSchedule.platform === p ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewSchedule({ ...newSchedule, platform: p })}
                        >
                          {p === 'wechat' ? '微信' : p === 'zhihu' ? '知乎' : '双平台'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full">添加到排期</Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">近期计划</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {schedules
                  .filter(s => s.status === 'scheduled')
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 10)
                  .map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-2 rounded border text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(schedule.date), 'MM/dd')}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {schedule.platform === 'wechat' ? '微信' : schedule.platform === 'zhihu' ? '知乎' : '双平台'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(schedule.id)}
                            className="h-6 text-xs"
                          >
                            完成
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSchedule(schedule.id)}
                            className="h-6 w-6 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-1">{schedule.title}</p>
                    </div>
                  ))}
                {schedules.filter(s => s.status === 'scheduled').length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">暂无待发布计划</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
