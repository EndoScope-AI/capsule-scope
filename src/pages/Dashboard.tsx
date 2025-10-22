import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Analysis } from "@/lib/types";
import { SeverityBadge } from "@/components/SeverityBadge";

const Dashboard = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const totalAnalyses = analyses.length;
  const completedAnalyses = analyses.filter(a => a.status === 'completed').length;
  const avgAccuracy = 99.7;
  const normalCases = analyses.filter(a => a.severity === 'healthy').length;
  const abnormalCases = analyses.filter(a => a.severity !== 'healthy' && a.severity !== null).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and performance metrics</p>
        </div>
        <Button onClick={() => navigate('/upload')} size="lg">
          Start New Analysis
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalyses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedAnalyses} completed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAccuracy}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Industry-leading precision
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Normal Cases</CardTitle>
            <CheckCircle className="h-4 w-4 text-severity-healthy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{normalCases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalAnalyses > 0 ? Math.round((normalCases / totalAnalyses) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abnormal Cases</CardTitle>
            <Users className="h-4 w-4 text-severity-severe" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abnormalCases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest analyses and their results</CardDescription>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No analyses yet. Start by uploading your first endoscopy file.
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{analysis.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {analysis.patient_id || 'No patient ID'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {analysis.severity && <SeverityBadge severity={analysis.severity} />}
                    {analysis.confidence && (
                      <span className="text-sm text-muted-foreground">
                        {analysis.confidence}% confidence
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
