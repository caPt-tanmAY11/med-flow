"use client";

import { useEffect, useState } from 'react';
import {
    FlaskConical, Search, ShoppingCart, Upload, AlertTriangle,
    Clock, CheckCircle, FileText, Download, Trash2, X, Loader2,
    ChevronRight, Heart, AlertCircle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Types
interface LabTest {
    id: string;
    code: string;
    name: string;
    category: string;
    type: string;
    description: string | null;
    price: number;
    discountedPrice: number | null;
    prerequisites: {
        fasting?: boolean;
        fastingHours?: number;
        instructions?: string[];
        warnings?: string[];
    };
    sampleType: string | null;
    turnaroundTime: string;
    isHomeCollection: boolean;
}

interface CartItem {
    id: string;
    LabTest: LabTest;
    createdAt: string;
}

interface ResultField {
    id: string;
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    unit: string | null;
    normalMin: number | null;
    normalMax: number | null;
}

interface OrderTest extends LabTest {
    LabTestResultField: ResultField[];
}

interface Order {
    id: string;
    LabTest: OrderTest;
    status: string;
    barcode: string | null;
    resultedAt: string | null;
    reportUrl: string | null;
    isCritical: boolean;
    resultData: Record<string, string | number> | null;
    isPaid: boolean;
    createdAt: string;
    progress: {
        current: string;
        percentage: number;
        steps: Array<{ name: string; completed: boolean; current: boolean }>;
    };
    canDownloadReport: boolean;
}

export default function LabPatientPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'catalog' | 'cart' | 'orders'>('catalog');
    const [loading, setLoading] = useState(true);
    const [tests, setTests] = useState<LabTest[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedResult, setSelectedResult] = useState<Order | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    // Checkout form state
    const [prescriptionUrl, setPrescriptionUrl] = useState('');
    const [hasAllergies, setHasAllergies] = useState(false);
    const [allergyNotes, setAllergyNotes] = useState('');
    const [hasImplants, setHasImplants] = useState(false);
    const [implantDetails, setImplantDetails] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // Patient ID - in production, get from auth context
    const [patientId, setPatientId] = useState<string>('');
    const [patientName, setPatientName] = useState<string>('');

    // Fetch patient (demo: use first patient from DB)
    const fetchPatient = async () => {
        try {
            const response = await fetch('/api/patients?limit=1');
            const result = await response.json();
            if (result.data && result.data.length > 0) {
                setPatientId(result.data[0].id);
                setPatientName(result.data[0].name);
            }
        } catch (error) {
            console.error('Error fetching patient:', error);
        }
    };

    // Fetch tests
    const fetchTests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory) params.append('category', selectedCategory);
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/lab-tests?${params}`);
            const result = await response.json();
            setTests(result.data || []);
            setCategories(result.categories || []);
        } catch (error) {
            console.error('Error fetching tests:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch cart
    const fetchCart = async () => {
        if (!patientId) return;
        try {
            const response = await fetch(`/api/lab-tests/cart?patientId=${patientId}`);
            const result = await response.json();
            setCart(result.data || []);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    // Fetch orders
    const fetchOrders = async () => {
        if (!patientId) return;
        try {
            const response = await fetch(`/api/lab-tests/orders?patientId=${patientId}`);
            const result = await response.json();
            setOrders(result.data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    useEffect(() => {
        fetchPatient();
        fetchTests();
    }, []);

    useEffect(() => {
        if (patientId) {
            fetchCart();
            fetchOrders();
        }
    }, [patientId]);

    useEffect(() => {
        const timer = setTimeout(() => fetchTests(), 300);
        return () => clearTimeout(timer);
    }, [selectedCategory, searchQuery]);

    // Add to cart
    const addToCart = async (testId: string) => {
        try {
            const response = await fetch('/api/lab-tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId, testId }),
            });

            if (response.ok) {
                toast({ title: 'Added to cart', description: 'Test added to your cart' });
                fetchCart();
            } else {
                const error = await response.json();
                toast({ title: 'Error', description: error.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add to cart', variant: 'destructive' });
        }
    };

    // Remove from cart
    const removeFromCart = async (orderId: string) => {
        try {
            const response = await fetch(`/api/lab-tests/cart?orderId=${orderId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({ title: 'Removed', description: 'Test removed from cart' });
                fetchCart();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to remove from cart', variant: 'destructive' });
        }
    };

    // Checkout
    const handleCheckout = async () => {
        setCheckoutLoading(true);
        try {
            const response = await fetch('/api/lab-tests/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    prescriptionUrl: prescriptionUrl || undefined,
                    hasAllergies,
                    allergyNotes: hasAllergies ? allergyNotes : undefined,
                    hasImplants,
                    implantDetails: hasImplants ? implantDetails : undefined,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                toast({ title: 'Success!', description: result.message });
                setShowCheckout(false);
                setCart([]);
                setPrescriptionUrl('');
                setHasAllergies(false);
                setAllergyNotes('');
                setHasImplants(false);
                setImplantDetails('');
                fetchOrders();
                setActiveTab('orders');
            } else {
                const error = await response.json();
                toast({ title: 'Error', description: error.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Checkout failed', variant: 'destructive' });
        } finally {
            setCheckoutLoading(false);
        }
    };

    // Calculate cart total
    const cartTotal = cart.reduce((sum, item) => sum + (item.LabTest.discountedPrice || item.LabTest.price), 0);
    const cartOriginalTotal = cart.reduce((sum, item) => sum + item.LabTest.price, 0);
    const cartDiscount = cartOriginalTotal - cartTotal;

    // Check if test is in cart
    const isInCart = (testId: string) => cart.some(item => item.LabTest.id === testId);

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <FlaskConical className="w-6 h-6 text-primary" />
                        Lab & Radiology
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Book tests, track results, download reports
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg w-fit">
                {[
                    { id: 'catalog', label: 'Book Tests', icon: FlaskConical },
                    { id: 'cart', label: `Cart (${cart.length})`, icon: ShoppingCart },
                    { id: 'orders', label: 'My Orders', icon: FileText },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'catalog' | 'cart' | 'orders')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                            activeTab === tab.id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Catalog Tab */}
            {activeTab === 'catalog' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Categories Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="floating-card p-4">
                            <h3 className="font-medium mb-3">Categories</h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedCategory('')}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                                        !selectedCategory ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                                    )}
                                >
                                    All Tests
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.name}
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between",
                                            selectedCategory === cat.name ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                                        )}
                                    >
                                        <span>{cat.name}</span>
                                        <span className="text-muted-foreground">{cat.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tests Grid */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tests..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Tests */}
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : tests.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No tests found
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tests.map((test) => (
                                    <div key={test.id} className="floating-card p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                                    test.type === 'RADIOLOGY' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {test.type}
                                                </span>
                                            </div>
                                            {test.isHomeCollection && (
                                                <span className="text-xs text-emerald-600 font-medium">🏠 Home Collection</span>
                                            )}
                                        </div>

                                        <h3 className="font-semibold text-base mb-1">{test.name}</h3>
                                        <p className="text-xs text-muted-foreground mb-2">{test.code}</p>

                                        {test.description && (
                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{test.description}</p>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                            {test.sampleType && <span>Sample: {test.sampleType}</span>}
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {test.turnaroundTime}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div>
                                                {test.discountedPrice ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-primary">₹{test.discountedPrice}</span>
                                                        <span className="text-sm text-muted-foreground line-through">₹{test.price}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-lg font-bold text-primary">₹{test.price}</span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedTest(test)}
                                                >
                                                    <Info className="w-4 h-4" />
                                                </Button>
                                                {isInCart(test.id) ? (
                                                    <Button size="sm" variant="secondary" disabled>
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        In Cart
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" onClick={() => addToCart(test.id)}>
                                                        <ShoppingCart className="w-4 h-4 mr-1" />
                                                        Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cart Tab */}
            {activeTab === 'cart' && (
                <div className="max-w-3xl mx-auto space-y-4">
                    {cart.length === 0 ? (
                        <div className="floating-card p-12 text-center">
                            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                            <p className="text-muted-foreground mb-4">Browse our test catalog and add tests to your cart</p>
                            <Button onClick={() => setActiveTab('catalog')}>Browse Tests</Button>
                        </div>
                    ) : (
                        <>
                            {cart.map((item) => (
                                <div key={item.id} className="floating-card p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium">{item.LabTest.name}</h3>
                                        <p className="text-sm text-muted-foreground">{item.LabTest.code}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-semibold text-primary">
                                            ₹{item.LabTest.discountedPrice || item.LabTest.price}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Cart Summary */}
                            <div className="floating-card p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal ({cart.length} items)</span>
                                    <span>₹{cartOriginalTotal}</span>
                                </div>
                                {cartDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600">
                                        <span>Discount</span>
                                        <span>-₹{cartDiscount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                                    <span>Total</span>
                                    <span className="text-primary">₹{cartTotal}</span>
                                </div>
                                <Button className="w-full" size="lg" onClick={() => setShowCheckout(true)}>
                                    Proceed to Checkout
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="max-w-3xl mx-auto space-y-4">
                    {orders.length === 0 ? (
                        <div className="floating-card p-12 text-center">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                            <p className="text-muted-foreground mb-4">Your test orders will appear here</p>
                            <Button onClick={() => setActiveTab('catalog')}>Book a Test</Button>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="floating-card p-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-medium">{order.LabTest.name}</h3>
                                        <p className="text-sm text-muted-foreground">{order.LabTest.code}</p>
                                        {order.barcode && (
                                            <p className="text-xs font-mono mt-1 bg-muted px-2 py-1 rounded inline-block">
                                                {order.barcode}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {order.isCritical && (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Critical
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Progress */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        {order.progress.steps.map((step, index) => (
                                            <div key={step.name} className="flex-1 flex items-center">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                                                    step.completed
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground"
                                                )}>
                                                    {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                                </div>
                                                {index < order.progress.steps.length - 1 && (
                                                    <div className={cn(
                                                        "flex-1 h-1 mx-2 rounded",
                                                        step.completed ? "bg-primary" : "bg-muted"
                                                    )} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        {order.progress.steps.map((step) => (
                                            <span key={step.name} className={cn(
                                                "text-center flex-1",
                                                step.current ? "text-primary font-medium" : "text-muted-foreground"
                                            )}>
                                                {step.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                {order.status === 'completed' && (
                                    <div className="pt-3 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => setSelectedResult(order)}
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            View Results
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Test Details Modal */}
            {selectedTest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">{selectedTest.name}</h2>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTest(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                    selectedTest.type === 'RADIOLOGY' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {selectedTest.type}
                                </span>
                                <span className="text-sm text-muted-foreground">{selectedTest.code}</span>
                            </div>

                            {selectedTest.description && (
                                <p className="text-sm text-muted-foreground">{selectedTest.description}</p>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {selectedTest.sampleType && (
                                    <div>
                                        <span className="text-muted-foreground">Sample Type:</span>
                                        <span className="ml-2">{selectedTest.sampleType}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-muted-foreground">Turnaround:</span>
                                    <span className="ml-2">{selectedTest.turnaroundTime}</span>
                                </div>
                            </div>

                            {/* Prerequisites */}
                            {selectedTest.prerequisites && (
                                <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                                    <h3 className="font-medium flex items-center gap-2 text-amber-800 dark:text-amber-200">
                                        <AlertCircle className="w-4 h-4" />
                                        Pre-Test Instructions
                                    </h3>
                                    {selectedTest.prerequisites.fasting && (
                                        <p className="text-sm">
                                            ⏰ <strong>Fasting Required:</strong> {selectedTest.prerequisites.fastingHours} hours before the test
                                        </p>
                                    )}
                                    {selectedTest.prerequisites.instructions && selectedTest.prerequisites.instructions.length > 0 && (
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                            {selectedTest.prerequisites.instructions.map((inst, i) => (
                                                <li key={i}>{inst}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {selectedTest.prerequisites.warnings && selectedTest.prerequisites.warnings.length > 0 && (
                                        <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                            {selectedTest.prerequisites.warnings.map((warn, i) => (
                                                <p key={i}>⚠️ {warn}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div>
                                    {selectedTest.discountedPrice ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-primary">₹{selectedTest.discountedPrice}</span>
                                            <span className="text-sm text-muted-foreground line-through">₹{selectedTest.price}</span>
                                        </div>
                                    ) : (
                                        <span className="text-2xl font-bold text-primary">₹{selectedTest.price}</span>
                                    )}
                                </div>
                                {isInCart(selectedTest.id) ? (
                                    <Button variant="secondary" disabled>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        In Cart
                                    </Button>
                                ) : (
                                    <Button onClick={() => { addToCart(selectedTest.id); setSelectedTest(null); }}>
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        Add to Cart
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Complete Your Order</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowCheckout(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {/* Order Summary */}
                            <div className="text-sm space-y-2 p-4 bg-muted/50 rounded-lg">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex justify-between">
                                        <span>{item.LabTest.name}</span>
                                        <span>₹{item.LabTest.discountedPrice || item.LabTest.price}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-semibold pt-2 border-t">
                                    <span>Total</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                            </div>

                            {/* Prescription Upload */}
                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <Upload className="w-4 h-4" />
                                    Prescription (Optional)
                                </Label>
                                <Input
                                    placeholder="Paste prescription URL or upload"
                                    value={prescriptionUrl}
                                    onChange={(e) => setPrescriptionUrl(e.target.value)}
                                />
                            </div>

                            {/* Allergy Information */}
                            <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="allergies"
                                        checked={hasAllergies}
                                        onChange={(e) => setHasAllergies(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="allergies" className="flex items-center gap-2 cursor-pointer">
                                        <Heart className="w-4 h-4 text-red-500" />
                                        I have allergies
                                    </Label>
                                </div>
                                {hasAllergies && (
                                    <Input
                                        placeholder="Please describe your allergies..."
                                        value={allergyNotes}
                                        onChange={(e) => setAllergyNotes(e.target.value)}
                                    />
                                )}
                            </div>

                            {/* Implant Information */}
                            <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="implants"
                                        checked={hasImplants}
                                        onChange={(e) => setHasImplants(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="implants" className="flex items-center gap-2 cursor-pointer">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        I have implants (pacemaker, metal plates, etc.)
                                    </Label>
                                </div>
                                {hasImplants && (
                                    <>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            ⚠️ Important for MRI/CT scans. Please provide details for your safety.
                                        </p>
                                        <Input
                                            placeholder="Type of implant, location, MRI compatibility..."
                                            value={implantDetails}
                                            onChange={(e) => setImplantDetails(e.target.value)}
                                        />
                                    </>
                                )}
                            </div>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleCheckout}
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Confirm Order - ₹{cartTotal}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Result Viewing Modal */}
            {selectedResult && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold">Lab Report</h2>
                                <p className="text-sm text-muted-foreground">{selectedResult.LabTest.name}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Report Header */}
                        <div id="lab-report-content" className="space-y-6">
                            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Test Code:</span>
                                    <span className="font-mono">{selectedResult.LabTest.code}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Patient:</span>
                                    <span>{patientName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Sample ID:</span>
                                    <span className="font-mono">{selectedResult.barcode || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Report Date:</span>
                                    <span>{selectedResult.resultedAt ? new Date(selectedResult.resultedAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                {selectedResult.isCritical && (
                                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-950 rounded text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        CRITICAL VALUE - Please consult your doctor immediately
                                    </div>
                                )}
                            </div>

                            {/* Result Values */}
                            <div>
                                <h3 className="font-medium mb-3">Test Results</h3>
                                {selectedResult.resultData ? (
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="text-left p-3 text-sm font-medium">Parameter</th>
                                                    <th className="text-center p-3 text-sm font-medium">Result</th>
                                                    <th className="text-center p-3 text-sm font-medium">Unit</th>
                                                    <th className="text-center p-3 text-sm font-medium">Normal Range</th>
                                                    <th className="text-center p-3 text-sm font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {(selectedResult.LabTest.LabTestResultField || []).map((field) => {
                                                    const value = selectedResult.resultData?.[field.fieldName];
                                                    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                                                    const isAbnormal = !isNaN(numValue) && field.normalMin !== null && field.normalMax !== null &&
                                                        (numValue < field.normalMin || numValue > field.normalMax);

                                                    return (
                                                        <tr key={field.id} className={isAbnormal ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                                                            <td className="p-3 text-sm font-medium">{field.fieldLabel}</td>
                                                            <td className={cn("p-3 text-sm text-center font-semibold", isAbnormal && "text-red-600")}>
                                                                {value ?? '-'}
                                                            </td>
                                                            <td className="p-3 text-sm text-center text-muted-foreground">{field.unit || '-'}</td>
                                                            <td className="p-3 text-sm text-center text-muted-foreground">
                                                                {field.normalMin !== null && field.normalMax !== null
                                                                    ? `${field.normalMin} - ${field.normalMax}`
                                                                    : '-'}
                                                            </td>
                                                            <td className="p-3 text-sm text-center">
                                                                {isAbnormal ? (
                                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                                                        {numValue < (field.normalMin ?? 0) ? 'LOW' : 'HIGH'}
                                                                    </span>
                                                                ) : value !== undefined ? (
                                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                                                        NORMAL
                                                                    </span>
                                                                ) : null}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground bg-muted/50 rounded-lg">
                                        <p>Results data not available</p>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
                                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Important Notes</p>
                                <ul className="text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                                    <li>Results should be interpreted by a qualified healthcare professional</li>
                                    <li>Normal ranges may vary based on age, gender, and other factors</li>
                                    <li>If you have any concerns, please consult your doctor</li>
                                </ul>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6 pt-4 border-t">
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedResult(null)}>
                                Close
                            </Button>
                            <Button
                                className="flex-1"
                                disabled={downloadingPdf}
                                onClick={async () => {
                                    setDownloadingPdf(true);
                                    try {
                                        // Use browser print to PDF
                                        const printContent = document.getElementById('lab-report-content');
                                        if (printContent) {
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                printWindow.document.write(`
                                                    <html>
                                                        <head>
                                                            <title>Lab Report - ${selectedResult.LabTest.name}</title>
                                                            <style>
                                                                body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                                                                h1 { font-size: 24px; margin-bottom: 10px; }
                                                                h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333; }
                                                                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                                                                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                                                                th { background-color: #f5f5f5; font-weight: 600; }
                                                                .header { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                                                                .header p { margin: 5px 0; }
                                                                .abnormal { background-color: #fef2f2; color: #dc2626; font-weight: bold; }
                                                                .critical { background: #fee2e2; padding: 10px; border-radius: 5px; color: #dc2626; margin: 10px 0; }
                                                                .notes { background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; }
                                                                .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
                                                                .badge-low, .badge-high { background: #fee2e2; color: #dc2626; }
                                                                .badge-normal { background: #dcfce7; color: #16a34a; }
                                                                @media print { body { padding: 0; } }
                                                            </style>
                                                        </head>
                                                        <body>
                                                            <h1>Lab Report</h1>
                                                            <h2>${selectedResult.LabTest.name} (${selectedResult.LabTest.code})</h2>
                                                            
                                                            <div class="header">
                                                                <p><strong>Patient:</strong> ${patientName}</p>
                                                                <p><strong>Sample ID:</strong> ${selectedResult.barcode || 'N/A'}</p>
                                                                <p><strong>Report Date:</strong> ${selectedResult.resultedAt ? new Date(selectedResult.resultedAt).toLocaleDateString() : 'N/A'}</p>
                                                            </div>
                                                            
                                                            ${selectedResult.isCritical ? '<div class="critical">⚠️ CRITICAL VALUE - Please consult your doctor immediately</div>' : ''}
                                                            
                                                            <h2>Test Results</h2>
                                                            <table>
                                                                <thead>
                                                                    <tr>
                                                                        <th>Parameter</th>
                                                                        <th>Result</th>
                                                                        <th>Unit</th>
                                                                        <th>Normal Range</th>
                                                                        <th>Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    ${(selectedResult.LabTest.LabTestResultField || []).map(field => {
                                                    const value = selectedResult.resultData?.[field.fieldName];
                                                    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                                                    const isAbnormal = !isNaN(numValue) && field.normalMin !== null && field.normalMax !== null &&
                                                        (numValue < field.normalMin || numValue > field.normalMax);
                                                    const status = isAbnormal
                                                        ? `<span class="badge badge-${numValue < (field.normalMin ?? 0) ? 'low' : 'high'}">${numValue < (field.normalMin ?? 0) ? 'LOW' : 'HIGH'}</span>`
                                                        : value !== undefined ? '<span class="badge badge-normal">NORMAL</span>' : '';
                                                    return `<tr class="${isAbnormal ? 'abnormal' : ''}">
                                                                            <td>${field.fieldLabel}</td>
                                                                            <td>${value ?? '-'}</td>
                                                                            <td>${field.unit || '-'}</td>
                                                                            <td>${field.normalMin !== null && field.normalMax !== null ? `${field.normalMin} - ${field.normalMax}` : '-'}</td>
                                                                            <td>${status}</td>
                                                                        </tr>`;
                                                }).join('')}
                                                                </tbody>
                                                            </table>
                                                            
                                                            <div class="notes">
                                                                <strong>Important Notes:</strong>
                                                                <ul>
                                                                    <li>Results should be interpreted by a qualified healthcare professional</li>
                                                                    <li>Normal ranges may vary based on age, gender, and other factors</li>
                                                                    <li>If you have any concerns, please consult your doctor</li>
                                                                </ul>
                                                            </div>
                                                            
                                                            <p style="margin-top: 30px; font-size: 12px; color: #666;">
                                                                Generated on ${new Date().toLocaleString()} | MedFlow Healthcare Platform
                                                            </p>
                                                        </body>
                                                    </html>
                                                `);
                                                printWindow.document.close();
                                                printWindow.print();
                                            }
                                        }
                                        toast({ title: 'Success', description: 'PDF opened for download' });
                                    } catch (error) {
                                        toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
                                    } finally {
                                        setDownloadingPdf(false);
                                    }
                                }}
                            >
                                {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
