import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Star, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const ServiceHighlightCard = ({ popularService, profitableService, formatPrice }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Highlight Layanan</CardTitle>
                <CardDescription>
                    Layanan paling populer dan paling menguntungkan.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {popularService ? (
                    <div>
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <h3 className="text-sm font-medium text-muted-foreground">Paling Populer</h3>
                        </div>
                        <p className="text-lg font-semibold">{popularService.name}</p>
                        <p className="text-xs text-muted-foreground">{popularService.orders_count} pesanan</p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Data populer tidak tersedia.</p>
                )}
                
                <Separator />

                {profitableService ? (
                    <div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-medium text-muted-foreground">Paling Menguntungkan</h3>
                        </div>
                        <p className="text-lg font-semibold">{profitableService.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(profitableService.revenue)} pendapatan</p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Data keuntungan tidak tersedia.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default ServiceHighlightCard;
