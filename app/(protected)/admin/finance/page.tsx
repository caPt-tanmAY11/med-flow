'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Building2,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    BarChart3,
    PieChart,
    Calendar,
    Download,
    RefreshCw,
    Stethoscope,
    FlaskConical,
    Pill,
    Bed,
    Activity,
    Ambulance,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
    CONSULTATION: <Stethoscope className="h-4 w-4" />,
    LAB: <FlaskConical className="h-4 w-4" />,
    PHARMACY: <Pill className="h-4 w-4" />,
    ROOM: <Bed className="h-4 w-4" />,
    PROCEDURE: <Activity className="h-4 w-4" />,
    EMERGENCY: <Ambulance className="h-4 w-4" />,
    RADIOLOGY: <FileText className="h-4 w-4" />,
    MISC: <Building2 className="h-4 w-4" />,
};

// Category colors for charts
const categoryColors: Record<string, string> = {
    CONSULTATION: '#3b82f6',
    LAB: '#a855f7',
    PHARMACY: '#22c55e',
    ROOM: '#f97316',
    PROCEDURE: '#ef4444',
    EMERGENCY: '#ec4899',
    RADIOLOGY: '#6366f1',
    MISC: '#6b7280',
};

interface RevenueAnalytics {
    totalRevenue: number;
    totalCollected: number;
    outstanding: number;
    revenueByCategory: Record<string, number>;
    revenueByDay: Record<string, number>;
    billCount: number;
    topTariffs?: Array<{
        tariffCode: string;
        description: string;
        category: string;
        revenue: number;
        count: number;
    }>;
    recentPayments?: Array<{
        id: string;
        amount: number;
        paymentMode: string;
        receivedAt: string;
        bill: {
            billNumber: string;
            patient: { name: string; uhid: string };
        };
    }>;
    outstandingBills?: Array<{
        id: string;
        billNumber: string;
        balanceDue: number;
        patient: { name: string; uhid: string };
    }>;
}

export default function AdminFinancePage() {
    const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                detailed: 'true',
            });
            const res = await fetch(`/api/admin/revenue?${params}`);
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getCategoryTotal = (category: string) => {
        return analytics?.revenueByCategory[category] || 0;
    };

    const getTotalRevenue = () => {
        return Object.values(analytics?.revenueByCategory || {}).reduce((a, b) => a + b, 0);
    };

    const getCategoryPercentage = (category: string) => {
        const total = getTotalRevenue();
        if (total === 0) return 0;
        return ((getCategoryTotal(category) / total) * 100).toFixed(1);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Finance Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Hospital revenue analytics and billing overview</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label className="text-sm">From</Label>
                        <Input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-36"
                        />
                        <Label className="text-sm">To</Label>
                        <Input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-36"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchAnalytics}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80">Total Revenue</p>
                                <p className="text-3xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                                <p className="text-xs opacity-70 mt-1 flex items-center">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {analytics?.billCount || 0} bills generated
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                                <IndianRupee className="h-7 w-7" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80">Collected</p>
                                <p className="text-3xl font-bold">{formatCurrency(analytics?.totalCollected || 0)}</p>
                                <p className="text-xs opacity-70 mt-1 flex items-center">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {((analytics?.totalCollected || 0) / (analytics?.totalRevenue || 1) * 100).toFixed(1)}% collection rate
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                                <CreditCard className="h-7 w-7" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80">Outstanding</p>
                                <p className="text-3xl font-bold">{formatCurrency(analytics?.outstanding || 0)}</p>
                                <p className="text-xs opacity-70 mt-1 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending collection
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                                <AlertCircle className="h-7 w-7" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80">Avg Bill Value</p>
                                <p className="text-3xl font-bold">
                                    {formatCurrency((analytics?.totalRevenue || 0) / (analytics?.billCount || 1))}
                                </p>
                                <p className="text-xs opacity-70 mt-1 flex items-center">
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    Per patient
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                                <PieChart className="h-7 w-7" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="category" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="category">Revenue by Category</TabsTrigger>
                    <TabsTrigger value="services">Top Services</TabsTrigger>
                    <TabsTrigger value="pending">Outstanding Bills</TabsTrigger>
                    <TabsTrigger value="payments">Recent Payments</TabsTrigger>
                </TabsList>

                {/* Category Breakdown */}
                <TabsContent value="category">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Department/Category</CardTitle>
                            <CardDescription>Breakdown of income by service category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Visual Bars */}
                                <div className="space-y-4">
                                    {Object.entries(analytics?.revenueByCategory || {})
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([category, amount]) => (
                                            <div key={category} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="p-1.5 rounded"
                                                            style={{ backgroundColor: categoryColors[category] + '20' }}
                                                        >
                                                            {categoryIcons[category] || <Building2 className="h-4 w-4" />}
                                                        </div>
                                                        <span className="font-medium">{category}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-semibold">{formatCurrency(amount)}</span>
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            ({getCategoryPercentage(category)}%)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${getCategoryPercentage(category)}%`,
                                                            backgroundColor: categoryColors[category],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(analytics?.revenueByCategory || {})
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([category, amount]) => (
                                            <Card key={category} className="bg-muted/30">
                                                <CardContent className="pt-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div
                                                            className="p-2 rounded-full"
                                                            style={{ backgroundColor: categoryColors[category] + '20' }}
                                                        >
                                                            {categoryIcons[category] || <Building2 className="h-4 w-4" />}
                                                        </div>
                                                        <span className="text-sm font-medium">{category}</span>
                                                    </div>
                                                    <p className="text-xl font-bold">{formatCurrency(amount)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {getCategoryPercentage(category)}% of total
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Top Services */}
                <TabsContent value="services">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Performing Services</CardTitle>
                            <CardDescription>Services generating the most revenue</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics?.topTariffs?.map((tariff, idx) => (
                                        <TableRow key={tariff.tariffCode}>
                                            <TableCell>
                                                <Badge variant={idx < 3 ? 'default' : 'secondary'}>
                                                    #{idx + 1}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{tariff.description}</p>
                                                    <p className="text-xs text-muted-foreground">{tariff.tariffCode}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" style={{ borderColor: categoryColors[tariff.category] }}>
                                                    {tariff.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{tariff.count}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(tariff.revenue)}</TableCell>
                                        </TableRow>
                                    )) || (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    No service data available
                                                </TableCell>
                                            </TableRow>
                                        )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Outstanding Bills */}
                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-orange-600 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Outstanding Bills
                            </CardTitle>
                            <CardDescription>Bills with pending balance that need follow-up</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bill #</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>UHID</TableHead>
                                        <TableHead className="text-right">Balance Due</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics?.outstandingBills?.map((bill) => (
                                        <TableRow key={bill.id}>
                                            <TableCell className="font-medium">{bill.billNumber}</TableCell>
                                            <TableCell>{bill.patient.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{bill.patient.uhid}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-orange-600">
                                                {formatCurrency(bill.balanceDue)}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline">
                                                    <CreditCard className="h-3 w-3 mr-1" />
                                                    Collect
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) || (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    No outstanding bills
                                                </TableCell>
                                            </TableRow>
                                        )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Recent Payments */}
                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-green-600 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                Recent Payments
                            </CardTitle>
                            <CardDescription>Latest payment transactions received</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bill #</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Mode</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics?.recentPayments?.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">{payment.bill.billNumber}</TableCell>
                                            <TableCell>{payment.bill.patient.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{payment.paymentMode}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(payment.receivedAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                +{formatCurrency(payment.amount)}
                                            </TableCell>
                                        </TableRow>
                                    )) || (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    No recent payments
                                                </TableCell>
                                            </TableRow>
                                        )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
