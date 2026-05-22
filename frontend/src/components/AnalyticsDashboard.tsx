'use client';

import React from 'react';
import styles from './AnalyticsDashboard.module.css';
import { Activity, Server, Zap, ShieldCheck } from 'lucide-react';

export default function AnalyticsDashboard() {
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>System Analytics</h1>
        <p className={styles.subtitle}>Real-time observability and performance metrics</p>
      </header>

      <div className={styles.callout}>
        <ShieldCheck color="#00FF80" size={24} style={{ flexShrink: 0 }} />
        <p className={styles.calloutText}>
          <strong>System Health is Optimal.</strong> All microservices are responding within the <span className={styles.techPhrase}>p99 latency SLA</span> of 50ms. No anomalies detected in the current transaction stream.
        </p>
      </div>

      <div className={styles.horizontalBlock}>
        <h2 className={styles.sectionTitle}>Key Performance Indicators</h2>
        <div className={styles.metricsGrid}>
          <div className={`${styles.glassPanel} ${styles.metricCard}`}>
            <span className={styles.metricLabel}>Active Connections</span>
            <span className={`${styles.metricValue} ${styles.metricValueNeon}`}>14,205</span>
          </div>
          <div className={`${styles.glassPanel} ${styles.metricCard}`}>
            <span className={styles.metricLabel}>Throughput</span>
            <span className={styles.metricValue}>
              3.2 <span style={{ fontSize: '16px', color: '#94A3B8' }}>GB/s</span>
            </span>
          </div>
          <div className={`${styles.glassPanel} ${styles.metricCard}`}>
            <span className={styles.metricLabel}>Error Rate</span>
            <span className={`${styles.metricValue} ${styles.metricValuePurple}`}>0.04%</span>
          </div>
          <div className={`${styles.glassPanel} ${styles.metricCard}`}>
            <span className={styles.metricLabel}>Avg Latency</span>
            <span className={styles.metricValue}>24ms</span>
          </div>
        </div>
      </div>

      <div className={styles.horizontalBlock}>
        <h2 className={styles.sectionTitle}>Active Microservices</h2>
        <div className={styles.glassPanel}>
          <div className={styles.dataTableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Status</th>
                  <th>Uptime</th>
                  <th>CPU Usage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Auth Gateway</td>
                  <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>Operational</span></td>
                  <td>99.99%</td>
                  <td><span className={styles.techPhrase}>12%</span></td>
                </tr>
                <tr>
                  <td>Payment Processor</td>
                  <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>Operational</span></td>
                  <td>99.95%</td>
                  <td>28%</td>
                </tr>
                <tr>
                  <td>Search Indexer</td>
                  <td><span className={`${styles.statusBadge} ${styles.statusWarning}`}>High Load</span></td>
                  <td>99.80%</td>
                  <td><span style={{ color: '#FFA500', fontWeight: '600' }}>85%</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={styles.horizontalBlock}>
        <h2 className={styles.sectionTitle}>Deployment Sequence</h2>
        <div className={styles.glassPanel}>
          <ul className={styles.sequenceList}>
            <li className={styles.sequenceItem}>
              <div className={styles.sequenceIcon}>1</div>
              <div className={styles.sequenceLine}></div>
              <div className={styles.sequenceContent}>
                <h3 className={styles.sequenceTitle}>Container Image Build</h3>
                <p className={styles.sequenceDesc}>Compiled TypeScript assets and bundled via <span className={styles.techPhrase}>Webpack 5</span>.</p>
              </div>
            </li>
            <li className={styles.sequenceItem}>
              <div className={styles.sequenceIcon}>2</div>
              <div className={styles.sequenceLine}></div>
              <div className={styles.sequenceContent}>
                <h3 className={styles.sequenceTitle}>Kubernetes Pod Rolling Update</h3>
                <p className={styles.sequenceDesc}>Gradual traffic shift with <span className={styles.techPhrase}>blue-green deployment</span> strategy.</p>
              </div>
            </li>
            <li className={styles.sequenceItem}>
              <div className={styles.sequenceIcon}>3</div>
              <div className={styles.sequenceContent}>
                <h3 className={styles.sequenceTitle}>Health Check Verification</h3>
                <p className={styles.sequenceDesc}>Automated synthetic tests passed successfully across all geographic regions.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
