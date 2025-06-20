import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentDetailPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5" />
        <div className="relative p-6 sm:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {/* Navigation Skeleton */}
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>

            {/* Document Hero Skeleton */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              {/* Document Info Skeleton */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4 mb-6">
                  <Skeleton className="w-20 h-20 rounded-2xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <Skeleton className="h-8 sm:h-10 lg:h-12 w-3/4" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full mb-4" />
                    
                    {/* Quick Stats Skeleton */}
                    <div className="flex flex-wrap gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Skeleton className="h-12 w-full sm:w-32" />
                  <Skeleton className="h-12 w-full sm:w-32" />
                </div>
              </div>

              {/* Stats Cards Skeleton */}
              <div className="w-full lg:w-80 space-y-4">
                <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div>
                      <Skeleton className="h-8 w-12 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </Card>
                <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div>
                      <Skeleton className="h-8 w-12 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section Skeleton */}
      <div className="p-6 sm:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card className="p-6 border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="w-4 h-4 ml-3" />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6 border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="w-4 h-4 ml-3" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 