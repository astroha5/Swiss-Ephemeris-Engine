class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  startTimer(key) {
    this.metrics[key] = {
      startTime: Date.now(),
      endTime: null,
      duration: null
    };
  }

  endTimer(key) {
    if (this.metrics[key]) {
      this.metrics[key].endTime = Date.now();
      this.metrics[key].duration = this.metrics[key].endTime - this.metrics[key].startTime;
      
      console.log(`⏱️ ${key} completed in ${this.metrics[key].duration}ms`);
      return this.metrics[key].duration;
    }
    return null;
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageTime(key) {
    const allMetrics = Object.values(this.metrics).filter(m => m.key === key && m.duration !== null);
    if (allMetrics.length === 0) return null;
    
    const total = allMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / allMetrics.length;
  }

  clear() {
    this.metrics = {};
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
