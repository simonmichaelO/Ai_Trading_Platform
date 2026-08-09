/**
 * Price Chart Component
 * 
 * Renders candlestick charts using TradingView's lightweight-charts v5.
 */

'use client';

import { useEffect, useRef, memo } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { Candle } from '@/hooks/useMarketData';

interface PriceChartProps {
  candles: Candle[];
  entry?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  takeProfit2?: number | null;
  height?: number;
  showVolume?: boolean;
}

function PriceChartComponent({
  candles,
  entry,
  stopLoss,
  takeProfit,
  takeProfit2,
  height = 400,
  showVolume = true,
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(55, 65, 81, 0.3)' },
        horzLines: { color: 'rgba(55, 65, 81, 0.3)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(59, 130, 246, 0.4)', width: 1, style: 2 },
        horzLine: { color: 'rgba(59, 130, 246, 0.4)', width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: 'rgba(55, 65, 81, 0.5)' },
      timeScale: {
        borderColor: 'rgba(55, 65, 81, 0.5)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height,
    });

    // v5 API: use addSeries with CandlestickSeries type
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Volume series
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
    }

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [height, showVolume]);

  // Update data
  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) return;

    const chartData = candles.map((c) => ({
      time: (new Date(c.time).getTime() / 1000) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(chartData);

    // Price lines
    if (entry) {
      candleSeriesRef.current.createPriceLine({
        price: entry, color: '#3b82f6', lineWidth: 2, lineStyle: 0,
        axisLabelVisible: true, title: 'Entry',
      });
    }
    if (stopLoss) {
      candleSeriesRef.current.createPriceLine({
        price: stopLoss, color: '#ef4444', lineWidth: 2, lineStyle: 2,
        axisLabelVisible: true, title: 'SL',
      });
    }
    if (takeProfit) {
      candleSeriesRef.current.createPriceLine({
        price: takeProfit, color: '#22c55e', lineWidth: 2, lineStyle: 2,
        axisLabelVisible: true, title: 'TP1',
      });
    }
    if (takeProfit2) {
      candleSeriesRef.current.createPriceLine({
        price: takeProfit2, color: '#22c55e', lineWidth: 1, lineStyle: 3,
        axisLabelVisible: true, title: 'TP2',
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, entry, stopLoss, takeProfit, takeProfit2]);

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden" />
      {(!candles || candles.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">No candle data available</p>
        </div>
      )}
    </div>
  );
}

export const PriceChart = memo(PriceChartComponent);
