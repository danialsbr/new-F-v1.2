type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private createEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.persistLogs();
    console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.data || '');
  }

  private persistLogs() {
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

  loadLogs() {
    try {
      const savedLogs = localStorage.getItem('app_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.persistLogs();
  }

  info(message: string, data?: unknown) {
    const entry = this.createEntry('info', message, data);
    this.addLog(entry);
  }

  warn(message: string, data?: unknown) {
    const entry = this.createEntry('warn', message, data);
    this.addLog(entry);
  }

  error(message: string, data?: unknown) {
    const entry = this.createEntry('error', message, data);
    this.addLog(entry);
  }
}

export const logger = new Logger();