import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorPage } from "@/components/VendorLayout";

const orders = [
  { id: "ORD-001", customer: "John Doe", product: "Wireless Headphones", quantity: 2, amount: "₹4,998", status: "Pending", date: "2024-01-15", address: "123 Main St, City" },
  { id: "ORD-002", customer: "Jane Smith", product: "Smart Watch", quantity: 1, amount: "₹12,999", status: "Processing", date: "2024-01-14", address: "456 Oak Ave, City" },
  { id: "ORD-003", customer: "Mike Johnson", product: "Laptop Stand", quantity: 3, amount: "₹2,997", status: "Shipped", date: "2024-01-13", address: "789 Pine Rd, City" },
  { id: "ORD-004", customer: "Sarah Wilson", product: "Bluetooth Speaker", quantity: 1, amount: "₹3,499", status: "Delivered", date: "2024-01-12", address: "321 Elm St, City" },
];

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
};

export default function VendorPlaceOrder() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Tools");

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <VendorPage title="Tools">
      <div className="min-h-screen bg-gray-50 p-3 pt-1 pb-16">
        {/* Header */}
        <div className="bg-white p-4 border-b mb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Plus className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Business Tools</h1>
                <p className="text-sm text-gray-600">Manage your products, orders, and business operations</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Create New Order</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Fill in the details below to create a new order for your customer.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="customer" className="text-sm font-medium">Customer Name</Label>
                      <Input id="customer" placeholder="Enter customer name" className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product" className="text-sm font-medium">Product</Label>
                      <Select>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="headphones">Wireless Headphones</SelectItem>
                          <SelectItem value="watch">Smart Watch</SelectItem>
                          <SelectItem value="stand">Laptop Stand</SelectItem>
                          <SelectItem value="speaker">Bluetooth Speaker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
                      <Input id="quantity" type="number" placeholder="1" className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
                      <Input id="amount" placeholder="₹0.00" className="h-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">Delivery Address</Label>
                    <Textarea id="address" placeholder="Enter delivery address" className="h-20" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea id="notes" placeholder="Any special instructions..." className="h-16" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={() => setIsCreateDialogOpen(false)}>Create Order</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Business Function Card */}
        <Card className="mb-4 border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Plus className="h-4 w-4 text-gray-700" />
              </div>
              <div>
                <span className="text-gray-900 font-bold text-sm">Business Functions</span>
                <p className="text-xs text-gray-600 font-normal mt-0.5">Manage your core business operations</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2">
              <div
                className="group text-center cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-all duration-150 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200"
                onClick={() => navigate('/vendor/add-products')}
              >
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-2 mx-auto w-12 h-12 flex items-center justify-center mb-1 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-150">
                  <span className="text-lg">📦</span>
                </div>
                <p className="text-xs text-gray-800 font-semibold mb-0.5 leading-tight">Add Products</p>
                <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full text-[10px]">New</Badge>
              </div>

              <div
                className="group text-center cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-all duration-150 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200"
                onClick={() => navigate('/vendor/products')}
              >
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-2 mx-auto w-12 h-12 flex items-center justify-center mb-1 group-hover:from-green-200 group-hover:to-green-300 transition-all duration-150">
                  <span className="text-lg">📦</span>
                </div>
                <p className="text-xs text-gray-800 font-semibold mb-0.5 leading-tight">Products</p>
                <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full text-[10px]">New</Badge>
              </div>

              <div
                className="group text-center cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-all duration-150 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200"
                onClick={() => navigate('/vendor/orders')}
              >
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-2 mx-auto w-12 h-12 flex items-center justify-center mb-1 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-150">
                  <span className="text-lg">📋</span>
                </div>
                <p className="text-xs text-gray-800 font-semibold mb-0.5 leading-tight">Orders</p>
              </div>

              <div
                className="group text-center cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-all duration-150 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200"
                onClick={() => navigate('/vendor/return-orders')}
              >
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg p-2 mx-auto w-12 h-12 flex items-center justify-center mb-1 group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-150">
                  <span className="text-lg">↺</span>
                </div>
                <p className="text-xs text-gray-800 font-semibold mb-0.5 leading-tight">Return Order</p>
              </div>

              <div
                className="group text-center cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-all duration-150 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200"
                onClick={() => navigate('/vendor/reviews')}
              >
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-2 mx-auto w-12 h-12 flex items-center justify-center mb-1 group-hover:from-yellow-200 group-hover:to-yellow-300 transition-all duration-150">
                  <span className="text-lg">⭐</span>
                </div>
                <p className="text-xs text-gray-800 font-semibold mb-0.5 leading-tight">Manage Reviews</p>
              </div>

              <div
                className="group text-center cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-all duration-150 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200"
                onClick={() => navigate('/vendor/income')}
              >
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg p-2 mx-auto w-12 h-12 flex items-center justify-center mb-1 group-hover:from-emerald-200 group-hover:to-emerald-300 transition-all duration-150">
                  <span className="text-lg">💰</span>
                </div>
                <p className="text-xs text-gray-800 font-semibold mb-0.5 leading-tight">My Income</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Upgrading Card */}
        <Card className="mb-4 rounded-lg border border-gray-200">
          <CardHeader className="bg-gray-50 p-3 border-b border-gray-200">
            <CardTitle className="text-base font-semibold text-gray-900">Business Upgrading</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-lg p-2 flex-shrink-0">
                <span className="text-lg">📈</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">Business Advisor</p>
                <p className="text-xs text-gray-500">Get expert guidance</p>
              </div>
              <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">New</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-4 rounded-lg border border-gray-200">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                  <Filter className="mr-2 h-3 w-3" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table - Desktop */}
        <Card className="hidden md:block mb-4 rounded-lg border border-gray-200">
          <CardHeader className="p-4">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Order ID</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">Qty</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.slice(0, 3).map((order) => (
                    <TableRow key={order.id} className="h-12">
                      <TableCell className="text-sm font-medium">{order.id}</TableCell>
                      <TableCell className="text-sm">{order.customer}</TableCell>
                      <TableCell className="text-sm">{order.product}</TableCell>
                      <TableCell className="text-sm">{order.quantity}</TableCell>
                      <TableCell className="text-sm">{order.amount}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[order.status as keyof typeof statusColors]} text-xs px-2 py-1`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{order.date}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-xs">
                              <Edit className="mr-2 h-3 w-3" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs">View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 text-xs">
                              <Trash2 className="mr-2 h-3 w-3" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Orders Cards - Mobile */}
        <div className="md:hidden space-y-3">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Orders</h3>
          {filteredOrders.slice(0, 2).map((order) => (
            <Card key={order.id} className="p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{order.id}</p>
                  <p className="text-xs text-gray-600">{order.customer}</p>
                </div>
                <Badge className={`${statusColors[order.status as keyof typeof statusColors]} text-xs px-2 py-1`}>
                  {order.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{order.product}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Qty:</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-orange-600">{order.amount}</span>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-gray-300">
                      <MoreHorizontal className="h-3 w-3 mr-1" /> Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-xs">
                      <Edit className="mr-2 h-3 w-3" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">View Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 text-xs">
                      <Trash2 className="mr-2 h-3 w-3" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Stats */}
        <div className="grid gap-3 md:grid-cols-4 mb-4">
          <Card className="rounded-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
              <CardTitle className="text-xs font-medium text-gray-900">Total Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-gray-900">{orders.length}</div>
              <p className="text-xs text-gray-600">+2 from yesterday</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
              <CardTitle className="text-xs font-medium text-gray-900">Pending</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-gray-900">{orders.filter(o => o.status === 'Pending').length}</div>
              <p className="text-xs text-gray-600">Requires attention</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
              <CardTitle className="text-xs font-medium text-gray-900">Processing</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-gray-900">{orders.filter(o => o.status === 'Processing').length}</div>
              <p className="text-xs text-gray-600">In progress</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
              <CardTitle className="text-xs font-medium text-gray-900">Completed</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-gray-900">{orders.filter(o => o.status === 'Delivered').length}</div>
              <p className="text-xs text-gray-600">Successfully delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 md:hidden flex justify-around items-center p-3 shadow-md">
          <button
            onClick={() => setActiveTab("Home")}
            className={`flex flex-col items-center text-gray-500 ${activeTab === "Home" ? "text-orange-500" : ""}`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("Tools")}
            className={`flex flex-col items-center text-gray-500 ${activeTab === "Tools" ? "text-orange-500" : ""}`}
          >
            <span className="text-xl">🛠️</span>
            <span className="text-xs font-medium">Tools</span>
          </button>
          <button
            onClick={() => setActiveTab("Messages")}
            className={`flex flex-col items-center text-gray-500 ${activeTab === "Messages" ? "text-orange-500" : ""}`}
          >
            <span className="text-xl">💬</span>
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button
            onClick={() => setActiveTab("Me")}
            className={`flex flex-col items-center text-gray-500 ${activeTab === "Me" ? "text-orange-500" : ""}`}
          >
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">Me</span>
          </button>
        </div>
      </div>
    </VendorPage>
  );
}