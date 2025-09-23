import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, ListChecks, Sigma, Sparkles, Terminal, TrendingUp } from "lucide-react";

const ListItem = ({ icon, text }) => (
    <li className="flex items-start gap-3"><div className="flex-shrink-0 text-primary">{icon}</div><span>{text}</span></li>
);

// Komponen untuk tampilan loading state (kerangka)
const AnalysisSkeleton = () => (
    <div className="space-y-6">
        <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
        </div>
        <div className="border-t pt-6">
            <Skeleton className="h-6 w-40 mb-3" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    </div>
);


export default function AIAnalytics() {
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateAnalysis = async () => {
        setIsLoading(true);
        setAnalysis(null);
        setError(null);

        try {
            // Memanggil endpoint API baru menggunakan fetch
            const response = await fetch(route('ai.analytics.generate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'An unknown error occurred.');
            }

            const data = await response.json();
            setAnalysis(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head title="AI Analytics" />
            <div className="p-4 sm:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Sigma className="h-6 w-6" />
                                <div>
                                    <CardTitle>AI Customer Analytics</CardTitle>
                                    <CardDescription>Click the button to generate AI-powered insights from your customer data.</CardDescription>
                                </div>
                            </div>
                            <Button onClick={handleGenerateAnalysis} disabled={isLoading}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {isLoading ? 'Analyzing...' : 'Generate Analysis'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4 min-h-[300px]">
                        {isLoading && <AnalysisSkeleton />}
                        
                        {error && (
                            <Alert variant="destructive">
                                <Terminal className="h-4 w-4" />
                                <AlertTitle>Analysis Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {analysis && !isLoading && (
                            <>
                                <div>
                                    <h3 className="mb-2 text-lg font-semibold flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Summary</h3>
                                    <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
                                </div>
                                <div className="border-t pt-6">
                                    <h3 className="mb-3 text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Key Trends</h3>
                                    <ul className="space-y-2 text-muted-foreground">
                                        {analysis.trends?.map((trend, index) => <ListItem key={index} icon={<span className="font-bold">#</span>} text={trend} />)}
                                    </ul>
                                </div>
                                <div className="border-t pt-6">
                                    <h3 className="mb-3 text-lg font-semibold flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />Recommendations</h3>
                                    <ul className="space-y-2 text-muted-foreground">
                                        {analysis.recommendations?.map((rec, index) => <ListItem key={index} icon={<span className="font-bold">✓</span>} text={rec} />)}
                                    </ul>
                                </div>
                            </>
                        )}

                        {!isLoading && !error && !analysis && (
                            <div className="flex flex-col items-center justify-center text-center h-full pt-10">
                                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-muted-foreground">Your analysis will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AIAnalytics.layout = (page) => <AuthenticatedLayout children={page} />;