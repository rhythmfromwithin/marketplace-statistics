import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { TrendingUp, Package, BarChart3 } from "lucide-react";

export default function SalesEstimator() {
  const [bsr, setBsr] = useState("");
  const [category, setCategory] = useState("");
  const [reviewCount, setReviewCount] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["supportedCategories"],
    queryFn: () => trpc.salesEstimator.getSupportedCategories.query(),
  });

  const estimateMutation = useMutation({
    mutationFn: async (data: any) => {
      return trpc.salesEstimator.estimate.mutate(data);
    },
  });

  const handleEstimate = () => {
    estimateMutation.mutate({
      trackedProductId: 1,
      bsr: bsr ? parseInt(bsr) : undefined,
      category: category || undefined,
      reviewCount: reviewCount ? parseInt(reviewCount) : undefined,
    });
  };

  const result = estimateMutation.data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">销量估算工具</h1>
          <p className="text-muted-foreground">基于 BSR 和评价数估算亚马逊产品销量</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>输入产品数据</CardTitle>
            <CardDescription>输入 BSR、类目和评价数进行估算</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bsr">Best Seller Rank (BSR)</Label>
              <Input
                id="bsr"
                type="number"
                placeholder="例如: 1500"
                value={bsr}
                onChange={(e) => setBsr(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">产品类目</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类目" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviews">评价总数</Label>
              <Input
                id="reviews"
                type="number"
                placeholder="例如: 2500"
                value={reviewCount}
                onChange={(e) => setReviewCount(e.target.value)}
              />
            </div>

            <Button onClick={handleEstimate} className="w-full" disabled={estimateMutation.isPending}>
              {estimateMutation.isPending ? "计算中..." : "估算销量"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                估算结果
              </CardTitle>
              <CardDescription>基于 {result.method} 方法</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">日销量</p>
                  <p className="text-2xl font-bold">{Math.round(result.dailySales)}</p>
                  <p className="text-xs text-muted-foreground">单位/天</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">月销量</p>
                  <p className="text-2xl font-bold">{Math.round(result.monthlySales)}</p>
                  <p className="text-xs text-muted-foreground">单位/月</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">置信度</span>
                  <span className="text-lg font-semibold">{Math.round(result.confidence)}%</span>
                </div>
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              {result.breakdown && (
                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">估算详情</p>
                  {result.breakdown.bsrEstimate && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">BSR 估算: </span>
                      <span className="font-medium">{Math.round(result.breakdown.bsrEstimate.dailySales)} 单/天</span>
                    </div>
                  )}
                  {result.breakdown.reviewEstimate && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">评价估算: </span>
                      <span className="font-medium">{Math.round(result.breakdown.reviewEstimate.monthlySales)} 单/月</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>估算方法说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">BSR 转销量法</p>
            <p className="text-muted-foreground">基于 Best Seller Rank 和产品类目，使用指数衰减模型估算日销量。不同类目有不同的转换系数。</p>
          </div>
          <div>
            <p className="font-medium">评价数推算法</p>
            <p className="text-muted-foreground">基于评价转化率（1-5%）和评价总数，反推总销量和月均销量。</p>
          </div>
          <div>
            <p className="font-medium">综合估算法</p>
            <p className="text-muted-foreground">结合 BSR（60%权重）、评价数（30%权重）和其他信号（10%权重），提供更准确的估算结果。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
