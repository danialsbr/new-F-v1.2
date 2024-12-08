import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface EndpointStatus {
  name: string;
  url: string;
  status: 'success' | 'error' | 'pending';
  responseTime?: number;
  lastChecked?: string;
  error?: string;
}

export function Status() {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'Get Orders', url: '/api/orders', status: 'pending' },
    { name: 'Get Summary', url: '/api/orders/summary', status: 'pending' },
    { name: 'Get Transfer Options', url: '/api/transfer-options', status: 'pending' },
    { name: 'Sample Order', url: '/api/orders/12345', status: 'pending' },
  ]);

  useEffect(() => {
    const checkEndpoint = async (endpoint: EndpointStatus) => {
      const startTime = performance.now();
      try {
        await api.checkEndpoint(endpoint.url);
        const endTime = performance.now();
        return {
          ...endpoint,
          status: 'success' as const,
          responseTime: Math.round(endTime - startTime),
          lastChecked: new Date().toLocaleString(),
        };
      } catch (error) {
        return {
          ...endpoint,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toLocaleString(),
        };
      }
    };

    const checkAllEndpoints = async () => {
      const results = await Promise.all(endpoints.map(checkEndpoint));
      setEndpoints(results);
    };

    checkAllEndpoints();
    const interval = setInterval(checkAllEndpoints, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">API Status</h1>
        <p className="mt-2 text-sm text-gray-700">
          Monitor the health and connectivity of backend services
        </p>
      </header>

      <div className="grid gap-6">
        {endpoints.map((endpoint) => (
          <div
            key={endpoint.url}
            className="bg-white shadow rounded-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {endpoint.status === 'success' && (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
                {endpoint.status === 'error' && (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                {endpoint.status === 'pending' && (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {endpoint.name}
                </h3>
              </div>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  endpoint.status === 'success' && 'bg-green-100 text-green-800',
                  endpoint.status === 'error' && 'bg-red-100 text-red-800',
                  endpoint.status === 'pending' && 'bg-yellow-100 text-yellow-800'
                )}
              >
                {endpoint.status}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Endpoint: {endpoint.url}
              </p>
              {endpoint.responseTime && (
                <p className="text-sm text-gray-500">
                  Response Time: {endpoint.responseTime}ms
                </p>
              )}
              {endpoint.lastChecked && (
                <p className="text-sm text-gray-500">
                  Last Checked: {endpoint.lastChecked}
                </p>
              )}
              {endpoint.error && (
                <p className="text-sm text-red-600">
                  Error: {endpoint.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}