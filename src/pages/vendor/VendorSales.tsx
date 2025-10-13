import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VendorPage } from "@/components/VendorLayout";

const salesData = {
  overview: {
    totalRevenue: "₹2,45,000",
    totalOrders: 1234,
    averageOrderValue: "₹199",
    conversionRate: "3.2%",
    growth: {
      revenue: "+12.5%",
      orders: "+8.2%",
      customers: "+5.1%"
    }
  },
  monthlyData: [
    { month: "Jan", revenue: 45000, orders: 234, customers: 189 },
    { month: "Feb", revenue: 52000, orders: 267, customers: 203 },
    { month: "Mar", revenue: 48000, orders: 245, customers: 198 },
    { month: "Apr", revenue: 61000, orders: 312, customers: 245 },
    { month: "May", revenue: 58000, orders: 298, customers: 232 },
    { month: "Jun", revenue: 67000, orders: 345, customers: 267 },
  ],
  topProducts: [
    { name: "Wireless Headphones", sales: 245, revenue: "₹24,500", growth: "+15%" },
    { name: "Smart Watch", sales: 189, revenue: "₹18,900", growth: "+8%" },
    { name: "Laptop Stand", sales: 156, revenue: "₹15,600", growth: "+12%" },
    { name: "Bluetooth Speaker", sales: 134, revenue: "₹13,400", growth: "+6%" },
    { name: "Phone Case", sales: 98, revenue: "₹9,800", growth: "+3%" },
  ],
  recentTransactions: [
    { id: "TXN-001", customer: "John Doe", amount: "₹1,250", date: "2024-01-15", status: "Completed" },
    { id: "TXN-002", customer: "Jane Smith", amount: "₹890", date: "2024-01-15", status: "Completed" },
    { id: "TXN-003", customer: "Mike Johnson", amount: "₹2,100", date: "2024-01-14", status: "Completed" },
    { id: "TXN-004", customer: "Sarah Wilson", amount: "₹675", date: "2024-01-14", status: "Completed" },
    { id: "TXN-005", customer: "Tom Brown", amount: "₹1,450", date: "2024-01-13", status: "Pending" },
  ]
};

export default function VendorSales() {
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <VendorPage title="Sales Analytics">
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="bg-white p-6 border-b">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Sales Analytics</h2>
                <p className="text-gray-600">Track your sales performance and business insights</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="p-2 bg-gray-100 rounded-full">
              <DollarSign className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.overview.totalRevenue}</div>
            <p className="text-xs text-gray-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {salesData.overview.growth.revenue} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="p-2 bg-gray-100 rounded-full">
              <ShoppingCart className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.overview.totalOrders}</div>
            <p className="text-xs text-gray-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {salesData.overview.growth.orders} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <div className="p-2 bg-gray-100 rounded-full">
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.overview.averageOrderValue}</div>
            <p className="text-xs text-gray-500">
              Per transaction
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <div className="p-2 bg-gray-100 rounded-full">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.overview.conversionRate}</div>
            <p className="text-xs text-gray-500">
              Visitors to customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Revenue chart</p>
                    <p className="text-sm text-muted-foreground">Monthly trend visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Orders chart</p>
                    <p className="text-sm text-muted-foreground">Order volume over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.monthlyData.map((data) => (
                    <TableRow key={data.month}>
                      <TableCell className="font-medium">{data.month}</TableCell>
                      <TableCell>₹{data.revenue.toLocaleString()}</TableCell>
                      <TableCell>{data.orders}</TableCell>
                      <TableCell>{data.customers}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-green-600">
                          +{Math.floor(Math.random() * 20 + 5)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.revenue}</p>
                      <p className={`text-sm ${product.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {product.growth}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.customer}</TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.status === 'Completed' ? 'default' : 'secondary'}
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </VendorPage>
  );
}