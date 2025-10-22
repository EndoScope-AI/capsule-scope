import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search } from "lucide-react";
import { toast } from "sonner";
import { Analysis, SeverityLevel } from "@/lib/types";
import { SeverityBadge } from "@/components/SeverityBadge";

const Results = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesSearch = 
      analysis.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.condition?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = 
      severityFilter === "all" || 
      analysis.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analysis Results</h1>
        <p className="text-muted-foreground mt-1">Browse and search all completed analyses</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename, patient ID, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="mild">Mild</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="severe">Severe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAnalyses.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || severityFilter !== "all" 
                ? "No results match your filters"
                : "No analyses found. Upload your first file to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnalyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/analysis/${analysis.id}`)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  {analysis.severity && <SeverityBadge severity={analysis.severity} />}
                </div>
                
                <div>
                  <h3 className="font-medium truncate">{analysis.file_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {analysis.patient_id || 'No patient ID'}
                  </p>
                </div>

                {analysis.condition && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {analysis.condition}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  {analysis.confidence && (
                    <span className="text-muted-foreground">
                      {analysis.confidence.toFixed(1)}% confidence
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Results;
