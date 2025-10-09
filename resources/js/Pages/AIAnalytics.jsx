import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Lightbulb,
    ListChecks,
    Sigma,
    Sparkles,
    Terminal,
    TrendingUp,
} from "lucide-react";
import axios from "axios";

const ListItem = ({ icon, text }) => (
    <li className="flex items-start gap-3">
        <div className="flex-shrink-0 text-primary pt-1">{icon}</div>
        <span>{text}</span>
    </li>
);

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
            const response = await axios.post(route("ai.analytics.generate"));
            setAnalysis(response.data);
        } catch (err) {
            const errorMessage =
                err.response?.data?.error ||
                err.message ||
                "An unknown error occurred.";
            setError(errorMessage);
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Sigma className="h-8 w-8 text-primary" />
                                <div>
                                    <CardTitle>AI Upselling & Conversion Analysis</CardTitle>
                                    <CardDescription>
                                        Generate AI-powered insights on guest behavior and service conversion rates.
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                onClick={handleGenerateAnalysis}
                                disabled={isLoading}
                                className="w-full sm:w-auto"
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                {isLoading ? "Analyzing..." : "Generate Analysis"}
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
                                    <h3 className="mb-2 text-lg font-semibold flex items-center gap-2">
                                        <ListChecks className="h-5 w-5 text-primary" />
                                        Executive Summary
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {analysis.summary}
                                    </p>
                                </div>
                                <div className="border-t pt-6">
                                    <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Key Conversion Trends
                                    </h3>
                                    <ul className="space-y-3 text-muted-foreground">
                                        {analysis.trends?.map((trend, index) => (
                                            <ListItem key={index} icon={"#"} text={trend} />
                                        ))}
                                    </ul>
                                </div>
                                <div className="border-t pt-6">
                                    <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-primary" />
                                        Actionable Recommendations
                                    </h3>
                                    <ul className="space-y-3 text-muted-foreground">
                                        {analysis.recommendations?.map((rec, index) => (
                                            <ListItem key={index} icon={"✓"} text={rec} />
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        {!isLoading && !error && !analysis && (
                            <div className="flex flex-col items-center justify-center text-center h-full pt-10">
                                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-muted-foreground">
                                    Your upselling analysis will appear here.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AIAnalytics.layout = (page) => <AuthenticatedLayout children={page} />;