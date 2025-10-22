import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Analysis } from "@/lib/types";
import { SeverityBadge } from "@/components/SeverityBadge";

const AnalysisView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (id) {
      loadAnalysis();
    }
  }, [id]);

  const loadAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAnalysis(data);

      // If analysis is pending, start processing
      if (data.status === 'pending') {
        processAnalysis(data);
      }
    } catch (error: any) {
      toast.error("Failed to load analysis");
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const processAnalysis = async (analysisData: Analysis) => {
    setProcessing(true);
    
    try {
      // Update status to processing
      await supabase
        .from('analyses')
        .update({ status: 'processing' })
        .eq('id', analysisData.id);

      // Simulate AI processing
      const totalFrames = Math.floor(Math.random() * 5000) + 1000;
      const abnormalFrames = Math.floor(Math.random() * totalFrames * 0.3);
      const severityOptions: Array<'healthy' | 'mild' | 'moderate' | 'severe'> = ['healthy', 'mild', 'moderate', 'severe'];
      const severity = abnormalFrames > totalFrames * 0.2 ? 
        severityOptions[Math.floor(Math.random() * 3) + 1] : 
        'healthy';
      const confidence = 95 + Math.random() * 4.7;

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const conditions = abnormalFrames > 0 ? 
        ['Mucosal inflammation', 'Tissue irregularity'] : 
        [];

      const insights = severity !== 'healthy' ? [
        "Detected mucosal break indicating potential ulcer formation",
        "Tissue irregularity observed in multiple frames",
        "Recommend follow-up examination"
      ] : [
        "Tissue appears healthy with normal mucosal patterns",
        "No abnormalities detected",
        "Routine monitoring recommended"
      ];

      // Update analysis with results
      const { error: updateError } = await supabase
        .from('analyses')
        .update({
          status: 'completed',
          total_frames: totalFrames,
          abnormal_frames: abnormalFrames,
          severity: severity,
          condition: conditions.join(', ') || 'Healthy tissue',
          confidence: confidence,
          ai_insights: insights,
          processing_time_seconds: 18.5,
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisData.id);

      if (updateError) throw updateError;

      toast.success("Analysis completed successfully");
      loadAnalysis(); // Reload to show results
    } catch (error: any) {
      console.error("Processing error:", error);
      toast.error("Analysis processing failed");
      
      await supabase
        .from('analyses')
        .update({ status: 'failed' })
        .eq('id', analysisData.id);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analysis) {
    return <div>Analysis not found</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analysis Results</h1>
          <p className="text-muted-foreground mt-1">{analysis.file_name}</p>
        </div>
      </div>

      {processing && (
        <Card className="shadow-sm border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Processing Analysis...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Analyzing frames {Math.floor((progress / 100) * 1000)} of 1000...
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Analysis Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={analysis.status === 'completed' ? 'default' : 'secondary'}>
                {analysis.status}
              </Badge>
            </div>
            {analysis.severity && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Severity</span>
                <SeverityBadge severity={analysis.severity} />
              </div>
            )}
            {analysis.confidence && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence</span>
                <span className="text-sm font-semibold">{analysis.confidence.toFixed(1)}%</span>
              </div>
            )}
            {analysis.condition && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Detected Condition</span>
                <p className="text-sm text-muted-foreground">{analysis.condition}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Frame Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.total_frames && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Frames</span>
                <span className="text-sm">{analysis.total_frames.toLocaleString()}</span>
              </div>
            )}
            {analysis.abnormal_frames !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Abnormal Frames</span>
                <span className="text-sm">{analysis.abnormal_frames.toLocaleString()}</span>
              </div>
            )}
            {analysis.processing_time_seconds && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing Time</span>
                <span className="text-sm">{analysis.processing_time_seconds.toFixed(1)}s</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analysis.ai_insights && analysis.ai_insights.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.ai_insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {analysis.status === 'completed' && (
        <div className="flex gap-4">
          <Button onClick={() => navigate(`/reports/${analysis.id}`)} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button variant="outline" onClick={() => navigate('/results')} size="lg">
            View All Results
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
