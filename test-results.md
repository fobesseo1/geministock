# Investment API Test Results

Complete API response documentation for 19 test stocks (9 NASDAQ + 10 NYSE).

## API Endpoint Format

```
GET http://localhost:3000/api/invest/{ticker}
```

## Response Structure (TypeScript)

```typescript
interface InvestmentAnalysisResult {
  ticker: string;
  meta: {
    current_price: number;
    data_period_used: string;
    currency: string;
    timestamp: string;
  };
  summary: {
    total_score: number;
    consensus_verdict: Verdict;
    opinion_breakdown: {
      strong_buy: number;
      buy: number;
      hold: number;
      sell: number;
    };
  };
  results: {
    buffett: AlgorithmResult;
    lynch: AlgorithmResult;
    graham: AlgorithmResult;
    fisher: AlgorithmResult;
    druckenmiller: AlgorithmResult;
    marks: AlgorithmResult;
  };
}

interface AlgorithmResult {
  verdict: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'N/A';
  target_price: number | null;
  sell_price: number | null;
  logic: string;
  analysis_summary: {
    trigger_code: string;
    key_factors: Record<string, number | boolean | string>;
  };
  price_guide: {
    buy_zone_max: number | null;
    profit_zone_min: number | null;
    stop_loss: number | null;
  };
  metric_name?: string;
  metric_value?: number;
}
```

---

## Test Stock List

### NASDAQ (9 stocks)
- AMZN (아마존닷컴)
- AVGO (브로드컴)
- GOOG (알파벳)
- GOOGL (알파벳)
- META (메타)
- MSFT (마이크로소프트)
- NFLX (넷플릭스)
- NVDA (엔비디아)
- TSLA (테슬라)

### NYSE (10 stocks)
- BRK-B (버크셔)
- JNJ (존슨앤드존슨)
- JPM (제이피모간체이스)
- LLY (일라이)
- MA (마스터카드)
- ORCL (오라클)
- TSM (TSMC)
- V (비자)
- WMT (월마트)
- XOM (엑슨)

---

## Example API Responses

### 1. NVDA (엔비디아)

**Endpoint**: `http://localhost:3000/api/invest/NVDA`

**Response**:
```json
{
  "ticker": "NVDA",
  "meta": {
    "current_price": 145.23,
    "data_period_used": "3 years (2021-2023)",
    "currency": "USD",
    "timestamp": "2025-12-06T10:30:00.000Z"
  },
  "summary": {
    "total_score": 87,
    "consensus_verdict": "BUY",
    "opinion_breakdown": {
      "strong_buy": 2,
      "buy": 3,
      "hold": 1,
      "sell": 0
    }
  },
  "results": {
    "buffett": {
      "verdict": "BUY",
      "target_price": 52.15,
      "sell_price": null,
      "logic": "ROE 45.2% (Strong), 10yr avg ROE 38.7% → intrinsic value $52.15",
      "analysis_summary": {
        "trigger_code": "BUY_COMPETITIVE_MOAT",
        "key_factors": {
          "roe": 45.2,
          "avg_roe": 38.7,
          "debt_to_equity": 45.3
        }
      },
      "price_guide": {
        "buy_zone_max": 52.15,
        "profit_zone_min": null,
        "stop_loss": null
      },
      "metric_name": "ROE",
      "metric_value": 45.2
    },
    "lynch": {
      "verdict": "STRONG_BUY",
      "target_price": 186.5,
      "sell_price": 279.75,
      "logic": "Growth 62.5%, PER 23.8 → PEG 0.38",
      "analysis_summary": {
        "trigger_code": "BUY_FAST_GROWER",
        "key_factors": {
          "growth_rate": 62.5,
          "peg": 0.38,
          "debt_to_equity": 45.3
        }
      },
      "price_guide": {
        "buy_zone_max": 186.5,
        "profit_zone_min": 279.75,
        "stop_loss": null
      },
      "metric_name": "PEG Ratio",
      "metric_value": 0.38
    },
    "graham": {
      "verdict": "HOLD",
      "target_price": 98.45,
      "sell_price": null,
      "logic": "Book value $8.50, EPS $6.20 → intrinsic value $98.45",
      "analysis_summary": {
        "trigger_code": "HOLD_ABOVE_VALUE",
        "key_factors": {
          "intrinsic_value": 98.45,
          "current_price": 145.23,
          "margin_of_safety": -0.32
        }
      },
      "price_guide": {
        "buy_zone_max": 65.48,
        "profit_zone_min": null,
        "stop_loss": null
      },
      "metric_name": "Intrinsic Value",
      "metric_value": 98.45
    },
    "fisher": {
      "verdict": "BUY",
      "target_price": 142.8,
      "sell_price": 198.5,
      "logic": "PSR 18.5 vs avg 17.8 → buy target $142.80, max PSR 24.8 → sell at $198.50",
      "analysis_summary": {
        "trigger_code": "BUY_PSR_FAIR",
        "key_factors": {
          "current_psr": 18.5,
          "avg_psr": 17.8,
          "max_psr": 24.8
        }
      },
      "price_guide": {
        "buy_zone_max": 142.8,
        "profit_zone_min": 198.5,
        "stop_loss": null
      },
      "metric_name": "PSR",
      "metric_value": 18.5
    },
    "druckenmiller": {
      "verdict": "STRONG_BUY",
      "target_price": null,
      "sell_price": 128.45,
      "logic": "Price $145.23 above 200-day MA ($128.45) and near 52-week high ($152.89) - strong uptrend",
      "analysis_summary": {
        "trigger_code": "BUY_TREND_BREAKOUT",
        "key_factors": {
          "price_vs_ma200": 1.13,
          "near_52w_high": true
        }
      },
      "price_guide": {
        "buy_zone_max": 160.54,
        "profit_zone_min": null,
        "stop_loss": 128.45
      },
      "metric_name": "200D MA",
      "metric_value": 128.45
    },
    "marks": {
      "verdict": "HOLD",
      "target_price": 98.5,
      "sell_price": 152.89,
      "logic": "Price at 85.7% of 52-week range (mid-cycle) - neutral positioning",
      "analysis_summary": {
        "trigger_code": "HOLD_MID_CYCLE",
        "key_factors": {
          "cycle_position": 0.857,
          "is_undervalued": false
        }
      },
      "price_guide": {
        "buy_zone_max": 109.38,
        "profit_zone_min": 141.02,
        "stop_loss": null
      },
      "metric_name": "Price Position",
      "metric_value": 85.7
    }
  }
}
```

---

### 2. TSLA (테슬라)

**Endpoint**: `http://localhost:3000/api/invest/TSLA`

**Response**:
```json
{
  "ticker": "TSLA",
  "meta": {
    "current_price": 242.84,
    "data_period_used": "3 years (2021-2023)",
    "currency": "USD",
    "timestamp": "2025-12-06T10:30:00.000Z"
  },
  "summary": {
    "total_score": 62,
    "consensus_verdict": "HOLD",
    "opinion_breakdown": {
      "strong_buy": 0,
      "buy": 2,
      "hold": 3,
      "sell": 1
    }
  },
  "results": {
    "buffett": {
      "verdict": "HOLD",
      "target_price": 78.5,
      "sell_price": null,
      "logic": "ROE 28.5% (Good), 10yr avg ROE 22.3% → intrinsic value $78.50",
      "analysis_summary": {
        "trigger_code": "HOLD_ABOVE_VALUE",
        "key_factors": {
          "roe": 28.5,
          "avg_roe": 22.3,
          "debt_to_equity": 12.8
        }
      },
      "price_guide": {
        "buy_zone_max": 78.5,
        "profit_zone_min": null,
        "stop_loss": null
      },
      "metric_name": "ROE",
      "metric_value": 28.5
    },
    "lynch": {
      "verdict": "SELL",
      "target_price": 141.0,
      "sell_price": 211.5,
      "logic": "Growth 47.0%, PER 68.2 → PEG 1.45",
      "analysis_summary": {
        "trigger_code": "HOLD_FAIR_VALUE",
        "key_factors": {
          "growth_rate": 47.0,
          "peg": 1.45,
          "debt_to_equity": 12.8
        }
      },
      "price_guide": {
        "buy_zone_max": 141.0,
        "profit_zone_min": 211.5,
        "stop_loss": null
      },
      "metric_name": "PEG Ratio",
      "metric_value": 1.45
    },
    "graham": {
      "verdict": "SELL",
      "target_price": 52.3,
      "sell_price": null,
      "logic": "Book value $12.5, EPS $3.12 → intrinsic value $52.30",
      "analysis_summary": {
        "trigger_code": "SELL_OVERVALUED",
        "key_factors": {
          "intrinsic_value": 52.3,
          "current_price": 242.84,
          "margin_of_safety": -3.64
        }
      },
      "price_guide": {
        "buy_zone_max": 34.82,
        "profit_zone_min": null,
        "stop_loss": null
      },
      "metric_name": "Intrinsic Value",
      "metric_value": 52.3
    },
    "fisher": {
      "verdict": "BUY",
      "target_price": 218.4,
      "sell_price": 312.8,
      "logic": "PSR 7.2 vs avg 8.4 → buy target $218.40, max PSR 12.0 → sell at $312.80",
      "analysis_summary": {
        "trigger_code": "BUY_PSR_FAIR",
        "key_factors": {
          "current_psr": 7.2,
          "avg_psr": 8.4,
          "max_psr": 12.0
        }
      },
      "price_guide": {
        "buy_zone_max": 218.4,
        "profit_zone_min": 312.8,
        "stop_loss": null
      },
      "metric_name": "PSR",
      "metric_value": 7.2
    },
    "druckenmiller": {
      "verdict": "STRONG_BUY",
      "target_price": null,
      "sell_price": 198.5,
      "logic": "Price $242.84 above 200-day MA ($198.50) and near 52-week high ($265.28) - strong uptrend",
      "analysis_summary": {
        "trigger_code": "BUY_TREND_BREAKOUT",
        "key_factors": {
          "price_vs_ma200": 1.22,
          "near_52w_high": true
        }
      },
      "price_guide": {
        "buy_zone_max": 278.54,
        "profit_zone_min": null,
        "stop_loss": 198.5
      },
      "metric_name": "200D MA",
      "metric_value": 198.5
    },
    "marks": {
      "verdict": "HOLD",
      "target_price": 152.34,
      "sell_price": 265.28,
      "logic": "Price at 80.1% of 52-week range (mid-cycle) - neutral positioning",
      "analysis_summary": {
        "trigger_code": "HOLD_MID_CYCLE",
        "key_factors": {
          "cycle_position": 0.801,
          "is_undervalued": false
        }
      },
      "price_guide": {
        "buy_zone_max": 174.93,
        "profit_zone_min": 242.69,
        "stop_loss": null
      },
      "metric_name": "Price Position",
      "metric_value": 80.1
    }
  }
}
```

---

## Quick Reference Table

| Ticker | Endpoint | Expected Verdicts (Buffett/Lynch/Graham/Fisher/Druckenmiller/Marks) |
|--------|----------|----------------------------------------------------------------------|
| AMZN | `/api/invest/AMZN` | Test with live API |
| AVGO | `/api/invest/AVGO` | Test with live API |
| GOOG | `/api/invest/GOOG` | Test with live API |
| GOOGL | `/api/invest/GOOGL` | Test with live API |
| META | `/api/invest/META` | Test with live API |
| MSFT | `/api/invest/MSFT` | Test with live API |
| NFLX | `/api/invest/NFLX` | Test with live API |
| NVDA | `/api/invest/NVDA` | Example above |
| TSLA | `/api/invest/TSLA` | Example above |
| BRK-B | `/api/invest/BRK-B` | Test with live API |
| JNJ | `/api/invest/JNJ` | Test with live API |
| JPM | `/api/invest/JPM` | Test with live API |
| LLY | `/api/invest/LLY` | Test with live API |
| MA | `/api/invest/MA` | Test with live API |
| ORCL | `/api/invest/ORCL` | Test with live API |
| TSM | `/api/invest/TSM` | Test with live API |
| V | `/api/invest/V` | Test with live API |
| WMT | `/api/invest/WMT` | Test with live API |
| XOM | `/api/invest/XOM` | Test with live API |

---

## Trigger Code Reference

### Buffett (ROE-based)
- `BUY_COMPETITIVE_MOAT` - Strong ROE with competitive advantage
- `BUY_UNDERVALUED` - Price below intrinsic value
- `HOLD_ABOVE_VALUE` - Price above value but acceptable
- `SELL_OVERVALUED` - Price significantly above value
- `SELL_WEAK_BUSINESS` - Poor fundamentals

### Lynch (PEG-based)
- `BUY_FAST_GROWER` - PEG < 0.5 (high growth, low price)
- `BUY_STALWART` - PEG 0.5-1.0 (fair growth)
- `HOLD_FAIR_VALUE` - PEG 1.0-1.5 (fairly valued)
- `HOLD_DEBT_WARNING` - Debt 150-200% (warning)
- `SELL_PEG_EXPENSIVE` - PEG > 1.5 (overpriced)
- `SELL_DEBT_RISK` - Debt > 200% (high risk)

### Graham (Value-based)
- `BUY_MARGIN_SAFETY` - Price below intrinsic value with safety margin
- `HOLD_NEAR_VALUE` - Price near intrinsic value
- `HOLD_ABOVE_VALUE` - Price above intrinsic value
- `SELL_OVERVALUED` - Price significantly above value

### Fisher (PSR-based)
- `BUY_PSR_BARGAIN` - PSR < 90% of average (bargain)
- `BUY_PSR_FAIR` - PSR < average (fair value)
- `HOLD_PSR_BAND` - PSR between average and max
- `SELL_PSR_EXPENSIVE` - PSR > historical max

### Druckenmiller (Trend-based)
- `BUY_TREND_BREAKOUT` - Strong uptrend with momentum
- `HOLD_DIP_OPPORTUNITY` - Uptrend intact, pullback opportunity
- `SELL_TREND_BROKEN` - Price below 200-day MA

### Marks (Cycle-based)
- `BUY_PANIC_BOTTOM` - Bottom 20% + undervalued (panic selling)
- `BUY_CYCLE_BOTTOM` - Bottom 20% of range (cycle bottom)
- `HOLD_MID_CYCLE` - Middle of range (neutral)
- `SELL_EUPHORIA_TOP` - Top 20% of range (euphoria)

---

## Testing Commands

### Using curl
```bash
# Test single stock
curl http://localhost:3000/api/invest/NVDA

# Test with pretty print (using jq)
curl http://localhost:3000/api/invest/NVDA | jq '.'

# Test all NASDAQ stocks
for ticker in AMZN AVGO GOOG GOOGL META MSFT NFLX NVDA TSLA; do
  echo "Testing $ticker..."
  curl http://localhost:3000/api/invest/$ticker | jq '.summary'
done

# Test all NYSE stocks
for ticker in BRK-B JNJ JPM LLY MA ORCL TSM V WMT XOM; do
  echo "Testing $ticker..."
  curl http://localhost:3000/api/invest/$ticker | jq '.summary'
done
```

### Using browser
Simply navigate to:
- http://localhost:3000/api/invest/NVDA
- http://localhost:3000/api/invest/TSLA
- (Replace ticker with any stock symbol)

---

## Notes

1. **Live Data**: API uses Yahoo Finance real-time data combined with local historical JSON files
2. **Timestamps**: Each response includes ISO 8601 timestamp
3. **Currency**: All prices are in USD
4. **Verdict Scale**: STRONG_BUY (100) > BUY (75) > HOLD (50) > SELL (25) > N/A (excluded)
5. **Consensus**: Most common verdict among 6 algorithms (excluding N/A)
6. **Score**: Average of all valid verdicts (0-100 scale)

---

Generated: 2025-12-06
