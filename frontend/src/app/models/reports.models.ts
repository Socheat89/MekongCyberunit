export interface DailyMetricDto {
  date: string;
  amount: number;
  count: number;
}

export interface TopProductDto {
  productId: number;
  sku: string;
  name: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface DashboardSummaryDto {
  totalSales: number;
  totalPurchases: number;
  totalStockValue: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
  outOfStockCount: number;
  todayInCount: number;
  todayOutCount: number;
  salesChartData: DailyMetricDto[];
  purchaseChartData: DailyMetricDto[];
  topSellingProducts: TopProductDto[];
}

export interface CategoryValuationDto {
  categoryName: string;
  itemCount: number;
  totalQuantity: number;
  totalCostValue: number;
}

export interface InventoryValuationDto {
  totalItems: number;
  totalQuantity: number;
  totalValuationCost: number;
  totalValuationRetail: number;
  potentialProfit: number;
  byCategory: CategoryValuationDto[];
}

export interface SupplierPurchaseSummaryDto {
  supplierId: number;
  supplierName: string;
  orderCount: number;
  totalPurchased: number;
}

export interface PurchaseReportDto {
  totalPurchases: number;
  totalOrders: number;
  receivedOrders: number;
  pendingOrders: number;
  bySupplier: SupplierPurchaseSummaryDto[];
}
