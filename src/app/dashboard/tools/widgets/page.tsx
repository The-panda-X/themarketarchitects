'use client';

import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  BarChart3,
  Globe,
  Calendar,
  LineChart,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const WIDGET_CATEGORIES = [
  { id: 'overview', label: 'Market Overview', icon: Globe },
  { id: 'forex', label: 'Forex', icon: LineChart },
  { id: 'indices', label: 'Indices', icon: BarChart3 },
  { id: 'crypto', label: 'Crypto', icon: TrendingUp },
  { id: 'calendar', label: 'Economic Calendar', icon: Calendar },
] as const;

type Category = (typeof WIDGET_CATEGORIES)[number]['id'];

const FOREX_PAIRS = [
  { symbol: 'FX:EURUSD', name: 'EUR/USD' },
  { symbol: 'FX:GBPUSD', name: 'GBP/USD' },
  { symbol: 'FX:USDJPY', name: 'USD/JPY' },
  { symbol: 'FX:USDCHF', name: 'USD/CHF' },
  { symbol: 'FX:AUDUSD', name: 'AUD/USD' },
  { symbol: 'FX:NZDUSD', name: 'NZD/USD' },
  { symbol: 'FX:USDCAD', name: 'USD/CAD' },
  { symbol: 'FX:EURGBP', name: 'EUR/GBP' },
  { symbol: 'FX:EURJPY', name: 'EUR/JPY' },
  { symbol: 'FX:GBPJPY', name: 'GBP/JPY' },
];

const METALS = [
  { symbol: 'TVC:GOLD', name: 'XAU/USD' },
  { symbol: 'TVC:SILVER', name: 'XAG/USD' },
];

const INDICES = [
  { symbol: 'BLACKBULL:US30', name: 'US30' },
  { symbol: 'BLACKBULL:NAS100', name: 'NAS100' },
  { symbol: 'BLACKBULL:SPX500', name: 'SPX500' },
];

const CRYPTO = [
  { symbol: 'COINBASE:BTCUSD', name: 'BTC/USD' },
  { symbol: 'COINBASE:ETHUSD', name: 'ETH/USD' },
];

function TradingViewWidget({
  config,
  scriptSrc,
  height,
}: {
  config: Record<string, unknown>;
  scriptSrc: string;
  height: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify(config);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [config, scriptSrc]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height, width: '100%' }}
    />
  );
}

function TradingViewMiniChart({ symbol, name }: { symbol: string; name: string }) {
  return (
    <GlassCard padding="none" hover>
      <div className="p-4 pb-2">
        <h3 className="text-sm font-semibold text-text-primary">{name}</h3>
      </div>
      <div className="h-[220px] w-full overflow-hidden">
        <TradingViewWidget
          height="100%"
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js"
          config={{
            symbol,
            width: '100%',
            height: '100%',
            locale: 'en',
            dateRange: '1D',
            colorTheme: 'dark',
            isTransparent: true,
            autosize: true,
            largeChartUrl: '',
            noTimeScale: false,
            chartOnly: false,
          }}
        />
      </div>
    </GlassCard>
  );
}

function TickerTape() {
  const symbols = [
    ...METALS.map((m) => ({ proName: m.symbol, title: m.name })),
    ...FOREX_PAIRS.slice(0, 4).map((p) => ({ proName: p.symbol, title: p.name })),
    ...INDICES.map((i) => ({ proName: i.symbol, title: i.name })),
    ...CRYPTO.map((c) => ({ proName: c.symbol, title: c.name })),
  ];

  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/[0.06]">
      <TradingViewWidget
        height="46px"
        scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
        config={{
          symbols,
          showSymbolLogo: true,
          isTransparent: true,
          displayMode: 'adaptive',
          colorTheme: 'dark',
          locale: 'en',
        }}
      />
    </div>
  );
}

function MarketOverviewWidget() {
  return (
    <GlassCard padding="none">
      <div className="p-4 pb-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent-primary" />
          Market Overview
        </h3>
      </div>
      <div className="h-[500px] w-full overflow-hidden">
        <TradingViewWidget
          height="100%"
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
          config={{
            colorTheme: 'dark',
            dateRange: '1D',
            showChart: true,
            locale: 'en',
            width: '100%',
            height: '100%',
            largeChartUrl: '',
            isTransparent: true,
            showSymbolLogo: true,
            showFloatingTooltip: true,
            plotLineColorGrowing: 'rgba(230, 57, 70, 1)',
            plotLineColorFalling: 'rgba(255, 23, 68, 1)',
            gridLineColor: 'rgba(255, 255, 255, 0.06)',
            scaleFontColor: 'rgba(255, 255, 255, 0.5)',
            belowLineFillColorGrowing: 'rgba(230, 57, 70, 0.12)',
            belowLineFillColorFalling: 'rgba(255, 23, 68, 0.12)',
            belowLineFillColorGrowingBottom: 'rgba(230, 57, 70, 0)',
            belowLineFillColorFallingBottom: 'rgba(255, 23, 68, 0)',
            symbolActiveColor: 'rgba(230, 57, 70, 0.12)',
            tabs: [
              {
                title: 'Forex',
                symbols: FOREX_PAIRS.slice(0, 6).map((p) => ({
                  s: p.symbol,
                  d: p.name,
                })),
              },
              {
                title: 'Metals',
                symbols: METALS.map((m) => ({ s: m.symbol, d: m.name })),
              },
              {
                title: 'Indices',
                symbols: INDICES.map((i) => ({ s: i.symbol, d: i.name })),
              },
              {
                title: 'Crypto',
                symbols: CRYPTO.map((c) => ({ s: c.symbol, d: c.name })),
              },
            ],
          }}
        />
      </div>
    </GlassCard>
  );
}

function EconomicCalendar() {
  return (
    <GlassCard padding="none">
      <div className="p-4 pb-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent-gold" />
          Economic Calendar
        </h3>
      </div>
      <div className="h-[500px] w-full overflow-hidden">
        <TradingViewWidget
          height="100%"
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-events.js"
          config={{
            colorTheme: 'dark',
            isTransparent: true,
            width: '100%',
            height: '100%',
            locale: 'en',
            importanceFilter: '-1,0,1',
            countryFilter:
              'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu',
          }}
        />
      </div>
    </GlassCard>
  );
}

function AdvancedChart({ symbol }: { symbol: string }) {
  return (
    <GlassCard padding="none">
      <div className="h-[450px] w-full overflow-hidden">
        <TradingViewWidget
          height="100%"
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
          config={{
            autosize: true,
            symbol,
            interval: 'D',
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'en',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            gridColor: 'rgba(255, 255, 255, 0.04)',
            hide_side_toolbar: false,
            allow_symbol_change: true,
            calendar: false,
            support_host: 'https://www.tradingview.com',
          }}
        />
      </div>
    </GlassCard>
  );
}

export default function MarketWidgetsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('overview');

  const renderContent = () => {
    switch (activeCategory) {
      case 'overview':
        return (
          <div className="space-y-6">
            <MarketOverviewWidget />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...METALS, ...FOREX_PAIRS.slice(0, 4)].map((item) => (
                <TradingViewMiniChart
                  key={item.symbol}
                  symbol={item.symbol}
                  name={item.name}
                />
              ))}
            </div>
          </div>
        );
      case 'forex':
        return (
          <div className="space-y-6">
            <AdvancedChart symbol="FX:EURUSD" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {FOREX_PAIRS.map((pair) => (
                <TradingViewMiniChart
                  key={pair.symbol}
                  symbol={pair.symbol}
                  name={pair.name}
                />
              ))}
            </div>
          </div>
        );
      case 'indices':
        return (
          <div className="space-y-6">
            <AdvancedChart symbol="BLACKBULL:US30" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {INDICES.map((idx) => (
                <TradingViewMiniChart
                  key={idx.symbol}
                  symbol={idx.symbol}
                  name={idx.name}
                />
              ))}
            </div>
          </div>
        );
      case 'crypto':
        return (
          <div className="space-y-6">
            <AdvancedChart symbol="COINBASE:BTCUSD" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {CRYPTO.map((coin) => (
                <TradingViewMiniChart
                  key={coin.symbol}
                  symbol={coin.symbol}
                  name={coin.name}
                />
              ))}
            </div>
          </div>
        );
      case 'calendar':
        return <EconomicCalendar />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Market Widgets</h1>
        <p className="text-text-secondary mt-1">
          Live market data, charts and economic calendar.
        </p>
      </div>

      <TickerTape />

      <div className="flex flex-wrap gap-2">
        {WIDGET_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent-primary text-white shadow-[0_0_16px_rgba(230,57,70,0.25)]'
                  : 'bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08] hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {renderContent()}
    </div>
  );
}
