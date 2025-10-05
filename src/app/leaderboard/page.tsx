
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

type LeaderboardEntry = {
    id: string;
    leaderboardName: string;
    overallRoastLevel: number;
    createdAt: string;
};

export default function LeaderboardPage() {
    const firestore = useFirestore();
    
    const leaderboardQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'leaderboard'), 
            orderBy('overallRoastLevel', 'desc'), 
            limit(20)
        );
    }, [firestore]);

    const { data: leaderboard, isLoading, error } = useCollection<LeaderboardEntry>(leaderboardQuery);

    const getTrophyColor = (rank: number) => {
        if (rank === 0) return 'text-yellow-400';
        if (rank === 1) return 'text-gray-400';
        if (rank === 2) return 'text-yellow-600';
        return 'text-muted-foreground/30';
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-destructive">
                    <p>Error loading leaderboard: {error.message}</p>
                </div>
            );
        }

        if (!leaderboard || leaderboard.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-8">
                    <p>The leaderboard is empty.</p>
                    <p>Be the first to get roasted!</p>
                </div>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] text-center">Rank</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Roast Level</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leaderboard.map((entry, index) => (
                        <TableRow key={entry.id}>
                            <TableCell className="font-medium text-center">
                                <div className="flex justify-center items-center gap-2">
                                   <Trophy className={cn("h-5 w-5", getTrophyColor(index))} /> 
                                   {index + 1}
                                </div>
                            </TableCell>
                            <TableCell className="font-headline">{entry.leaderboardName}</TableCell>
                            <TableCell className="text-right font-bold text-primary text-lg">{entry.overallRoastLevel}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-headline bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                        Most Roasted Hall of Shame
                    </CardTitle>
                    <CardDescription>
                        These brave souls faced the fire and came out (mostly) burnt.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
            <Button asChild variant="link" className="mt-6">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Link>
            </Button>
        </div>
    );
}
