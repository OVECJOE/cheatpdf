import { Card } from "@/components/ui/card";

export default function ExamPrepTipsCard() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Preparation Tips</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Review the document</p>
                <p className="text-sm text-muted-foreground">Make sure you&apos;re familiar with the content</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Find a quiet space</p>
                <p className="text-sm text-muted-foreground">Minimize distractions for better focus</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Check your internet</p>
                <p className="text-sm text-muted-foreground">Ensure stable connection throughout</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Read carefully</p>
                <p className="text-sm text-muted-foreground">Take time to understand each question</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">5</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Manage your time</p>
                <p className="text-sm text-muted-foreground">Keep track of remaining time</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">6</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Stay focused</p>
                <p className="text-sm text-muted-foreground">Avoid switching tabs or windows</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 