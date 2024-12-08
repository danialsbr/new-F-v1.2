import { Order, ScanStatus, TransferType } from './types';
import { logger } from './logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    logger.error('API Error', {
      status: response.status,
      url: response.url,
      error: error.error || 'Unknown error',
    });
    throw new ApiError(response.status, error.error || 'Unknown error');
  }
  return response.json();
}

export const api = {
  async checkEndpoint(url: string) {
    const startTime = performance.now();
    try {
      const response = await fetch(`${API_URL}${url}`);
      const endTime = performance.now();
      logger.info('API Check', {
        url,
        status: response.status,
        responseTime: Math.round(endTime - startTime),
      });
      return handleResponse(response);
    } catch (error) {
      logger.error('API Check Failed', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  // Orders
  async getOrders(page = 1, size = 10) {
    logger.info('Fetching orders', { page, size });
    const response = await fetch(
      `${API_URL}/api/orders?page=${page}&size=${size}`
    );
    const data = await handleResponse<{
      page: number;
      size: number;
      total_pages: number;
      orders: Order[];
    }>(response);
    logger.info('Orders fetched', {
      totalOrders: data.orders.length,
      totalPages: data.total_pages,
    });
    return data;
  },

  async getOrder(orderId: string) {
    logger.info('Fetching order', { orderId });
    const response = await fetch(`${API_URL}/api/orders/${orderId}`);
    const data = await handleResponse<{ order_id: string; details: Order }>(response);
    logger.info('Order fetched', { orderId, status: data.details.status });
    return data;
  },

  // SKUs
  async getRemainingSkus(orderId: string) {
    logger.info('Fetching remaining SKUs', { orderId });
    const response = await fetch(
      `${API_URL}/api/orders/${orderId}/remaining-skus`
    );
    const data = await handleResponse<{
      order_id: string;
      remaining_skus: Array<{
        sku: string;
        title: string;
        quantity_requested: number;
        quantity_scanned: number;
      }>;
    }>(response);
    logger.info('Remaining SKUs fetched', {
      orderId,
      remainingCount: data.remaining_skus.length,
    });
    return data;
  },

  async getScannedHistory(orderId: string) {
    logger.info('Fetching scan history', { orderId });
    const response = await fetch(
      `${API_URL}/api/orders/${orderId}/scanned-history`
    );
    const data = await handleResponse<{
      order_id: string;
      scanned_skus: Array<{
        sku: string;
        timestamp: string | null;
        status: string;
      }>;
    }>(response);
    logger.info('Scan history fetched', {
      orderId,
      scannedCount: data.scanned_skus.length,
    });
    return data;
  },

  async scanSku(orderId: string, sku: string, status: ScanStatus) {
    logger.info('Scanning SKU', { orderId, sku, status });
    const response = await fetch(`${API_URL}/api/orders/${orderId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, status }),
    });
    const data = await handleResponse<{
      message: string;
      updated_sku: {
        sku: string;
        quantity_scanned: number;
        status: string;
        scan_timestamp: string;
      };
    }>(response);
    logger.info('SKU scanned', {
      orderId,
      sku,
      status: data.updated_sku.status,
    });
    return data;
  },

  // Transfer
  async updateTransfer(orderId: string, transferType: TransferType) {
    logger.info('Updating transfer', { orderId, transferType });
    const response = await fetch(`${API_URL}/api/orders/${orderId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transfer_type: transferType }),
    });
    const data = await handleResponse<{ message: string; order_id: string }>(response);
    logger.info('Transfer updated', { orderId, transferType });
    return data;
  },

  async getTransferOptions() {
    logger.info('Fetching transfer options');
    const response = await fetch(`${API_URL}/api/transfer-options`);
    const data = await handleResponse<{ options: TransferType[] }>(response);
    logger.info('Transfer options fetched', { options: data.options });
    return data;
  },

  // File Operations
  async uploadFile(file: File) {
    logger.info('Uploading file', { filename: file.name, size: file.size });
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await handleResponse<{ message: string; file_path: string }>(response);
    logger.info('File uploaded', { filename: file.name, path: data.file_path });
    return data;
  },

  async downloadFile() {
    logger.info('Downloading file');
    const response = await fetch(`${API_URL}/api/download`);
    if (!response.ok) {
      logger.error('Download failed', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new ApiError(response.status, 'Failed to download file');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    logger.info('File downloaded successfully');
  },

  // Summary
  async getOrdersSummary() {
    logger.info('Fetching orders summary');
    const response = await fetch(`${API_URL}/api/orders/summary`);
    const data = await handleResponse<{
      total_orders: number;
      fulfilled_orders: number;
      pending_orders: number;
      scanned_items: number;
      total_items: number;
    }>(response);
    logger.info('Orders summary fetched', data);
    return data;
  },
};