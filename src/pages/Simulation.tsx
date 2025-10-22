import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Simulation = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const metrics = {
    totalFrames: 108000,
    abnormalFrames: 847,
    avgAnalysisTime: 0.017,
    accuracy: 99.7,
    commonAbnormalities: [
      { name: "Ulceration", count: 324 },
      { name: "Polyps", count: 213 },
      { name: "Inflammation", count: 189 },
      { name: "Lesions", count: 121 }
    ]
  };

  const detections = [
    { timestamp: "00:12:34", frame: 11234, condition: "Mucosal ulcer", severity: "moderate" },
    { timestamp: "00:45:23", frame: 40523, condition: "Polyp detected", severity: "mild" },
    { timestamp: "01:23:45", frame: 75345, condition: "Inflammation", severity: "mild" },
    { timestamp: "02:11:09", frame: 94869, condition: "Tissue lesion", severity: "severe" }
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Capsule Endoscopy Simulation</h1>
        <p className="text-muted-foreground mt-1">
          Demonstration of AI-powered 3-hour scan analysis (compressed)
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Video Playback</CardTitle>
          <CardDescription>Simulated capsule endoscopy footage with AI detection overlay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>
            <div className="relative z-10 text-center space-y-2">
              <Activity className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Capsule Endoscopy Simulation</p>
              <p className="text-sm text-muted-foreground">
                3-hour scan compressed to 3 minutes
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Progress value={progress} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>00:00:00</span>
              <span>03:00:00 (compressed)</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-12 w-12"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button variant="outline" size="icon">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Analysis Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Frames Analyzed</span>
              <span className="font-semibold">{metrics.totalFrames.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Abnormal Frames</span>
              <span className="font-semibold text-severity-moderate">
                {metrics.abnormalFrames.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg Analysis Time</span>
              <span className="font-semibold">{metrics.avgAnalysisTime}s/frame</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Detection Accuracy</span>
              <span className="font-semibold text-severity-healthy">{metrics.accuracy}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Common Abnormalities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.commonAbnormalities.map((abnormality, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{abnormality.name}</span>
                  <Badge variant="secondary">{abnormality.count} detected</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Detection Timeline</CardTitle>
          <CardDescription>Flagged abnormalities throughout the scan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {detections.map((detection, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm font-mono text-muted-foreground">
                    {detection.timestamp}
                  </div>
                  <div>
                    <p className="font-medium">{detection.condition}</p>
                    <p className="text-sm text-muted-foreground">Frame {detection.frame.toLocaleString()}</p>
                  </div>
                </div>
                <Badge
                  className={
                    detection.severity === 'severe'
                      ? 'bg-severity-severe text-white'
                      : detection.severity === 'moderate'
                      ? 'bg-severity-moderate text-white'
                      : 'bg-severity-mild text-white'
                  }
                >
                  {detection.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button size="lg">
          Export Full Timeline
        </Button>
        <Button variant="outline" size="lg">
          Download Segment
        </Button>
      </div>
    </div>
  );
};

import { Activity } from "lucide-react";
export default Simulation;
