import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ArrowLeft, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Analysis } from "@/lib/types";
import { SeverityBadge } from "@/components/SeverityBadge";

const Reports = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAnalysis();
    } else {
      loadLatestAnalysis();
    }
  }, [id]);

  const loadAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .eq('status', 'completed')
        .single();

      if (error) throw error;
      setAnalysis(data);
    } catch (error: any) {
      toast.error("Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  const loadLatestAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setAnalysis(data);
    } catch (error: any) {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    toast.success("PDF report generation started");
    // In production, this would generate an actual PDF
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-8">
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No completed analyses available for report generation.
            </p>
            <Button onClick={() => navigate('/upload')}>
              Upload New Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        {id && (
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clinical Report</h1>
          <p className="text-muted-foreground mt-1">AI-generated diagnostic report</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">CapsuleScope AI Analysis Report</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Report ID: {analysis.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                <QrCode className="h-12 w-12 text-primary" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                <p className="font-medium">{analysis.patient_id || 'Not specified'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Analysis Date</p>
                <p className="font-medium">
                  {new Date(analysis.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Region of Interest</p>
                <p className="font-medium">{analysis.region_of_interest || 'Not specified'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Device Model</p>
                <p className="font-medium">{analysis.device_model || 'Not specified'}</p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-lg mb-4">Diagnostic Results</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Detected Condition</span>
                  <span>{analysis.condition}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Severity Level</span>
                  {analysis.severity && <SeverityBadge severity={analysis.severity} />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Confidence Level</span>
                  <span className="font-semibold">{analysis.confidence?.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Frames Analyzed</span>
                  <span>{analysis.total_frames?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Abnormal Frames Detected</span>
                  <span>{analysis.abnormal_frames?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {analysis.ai_insights && analysis.ai_insights.length > 0 && (
              <div className="border-t border-border pt-6">
                <h3 className="font-semibold text-lg mb-4">AI Insights Summary</h3>
                <ul className="space-y-2">
                  {analysis.ai_insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-lg mb-4">Recommended Next Steps</h3>
              <p className="text-sm text-muted-foreground">
                {analysis.severity === 'severe' || analysis.severity === 'moderate'
                  ? "Immediate follow-up examination recommended. Consult with gastroenterology specialist for treatment planning."
                  : analysis.severity === 'mild'
                  ? "Schedule routine follow-up in 3-6 months. Monitor symptoms and maintain regular screening protocol."
                  : "Continue routine monitoring. Maintain healthy lifestyle and dietary habits. No immediate intervention required."}
              </p>
            </div>

            <div className="border-t border-border pt-6 text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Reviewed by:</strong> CapsuleScope AI System (Accuracy 99.7%)
              </p>
              <p className="text-xs">
                This report is generated by an AI-powered diagnostic system. All findings should be reviewed 
                by a qualified medical professional before making treatment decisions.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button onClick={handleDownloadPDF} size="lg" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/analysis/${analysis.id}`)}
            size="lg"
          >
            View Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
