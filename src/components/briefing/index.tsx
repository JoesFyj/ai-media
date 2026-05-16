"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function Briefing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">问题分析与解决方案汇报</h1>
          <p className="text-slate-600">给领导的一页式汇报材料</p>
        </div>

        <Tabs defaultValue="problems" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="problems">问题分类</TabsTrigger>
            <TabsTrigger value="analysis">原因分析</TabsTrigger>
            <TabsTrigger value="solutions">解决方案</TabsTrigger>
          </TabsList>

          <TabsContent value="problems" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      第一类
                    </Badge>
                    <span>烧写/方案/附录变更</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-medium text-sm text-slate-800 mb-1">问题 1.1</h4>
                        <div className="text-xs text-slate-600" contentEditable="true">
                          [请在此输入具体问题描述]
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-medium text-sm text-slate-800 mb-1">问题 1.2</h4>
                        <div className="text-xs text-slate-600" contentEditable="true">
                          [请在此输入具体问题描述]
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-medium text-sm text-slate-800 mb-1">问题 1.3</h4>
                        <div className="text-xs text-slate-600" contentEditable="true">
                          [请在此输入具体问题描述]
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      第二类
                    </Badge>
                    <span>程序代码问题</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-medium text-sm text-slate-800 mb-1">问题 2.1</h4>
                        <div className="text-xs text-slate-600" contentEditable="true">
                          [请在此输入具体问题描述]
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-medium text-sm text-slate-800 mb-1">问题 2.2</h4>
                        <div className="text-xs text-slate-600" contentEditable="true">
                          [请在此输入具体问题描述]
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      第三类
                    </Badge>
                    <span>版本测试覆盖率</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-medium text-sm text-slate-800 mb-1">问题 3.1</h4>
                        <div className="text-xs text-slate-600" contentEditable="true">
                          [请在此输入具体问题描述]
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-medium text-sm text-slate-800 mb-1">问题 3.2</h4>
                        <div className="text-xs text-slate-600" contentEditable="true">
                          [请在此输入具体问题描述]
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">问题汇总统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">3</div>
                    <div className="text-sm text-blue-600">变更类问题</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-700">2</div>
                    <div className="text-sm text-amber-600">代码类问题</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700">2</div>
                    <div className="text-sm text-emerald-600">测试覆盖率问题</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>深度原因分析（根因分析）</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700">第一类问题根因</Badge>
                      </h4>
                      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="text-sm text-slate-700 leading-relaxed" contentEditable="true">
                          [请在此输入第一类问题的深度原因分析，结合领域现状进行阐述...]
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-amber-700 flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-700">第二类问题根因</Badge>
                      </h4>
                      <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                        <div className="text-sm text-slate-700 leading-relaxed" contentEditable="true">
                          [请在此输入第二类问题的深度原因分析，结合领域现状进行阐述...]
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-emerald-700 flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700">第三类问题根因</Badge>
                      </h4>
                      <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <div className="text-sm text-slate-700 leading-relaxed" contentEditable="true">
                          [请在此输入第三类问题的深度原因分析，结合领域现状进行阐述...]
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solutions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>针对性解决措施</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          针对变更类问题
                        </Badge>
                      </h4>
                      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="text-sm text-slate-700 leading-relaxed" contentEditable="true">
                          [请在此输入针对第一类问题的具体解决方案和实施措施...]
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-amber-700 flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          针对代码类问题
                        </Badge>
                      </h4>
                      <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                        <div className="text-sm text-slate-700 leading-relaxed" contentEditable="true">
                          [请在此输入针对第二类问题的具体解决方案和实施措施...]
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-emerald-700 flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          针对测试覆盖率问题
                        </Badge>
                      </h4>
                      <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <div className="text-sm text-slate-700 leading-relaxed" contentEditable="true">
                          [请在此输入针对第三类问题的具体解决方案和实施措施...]
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-slate-400 mt-4">
          💡 提示：所有标注为可编辑的区域可直接点击修改内容
        </div>
      </div>
    </div>
  );
}
