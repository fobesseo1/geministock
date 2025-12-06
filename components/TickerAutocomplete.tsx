'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface StockInfo {
  stock_code: string;
  company_name_kor: string;
  company_name_eng: string;
  industry: string;
  market_name: string;
}

interface TickerAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function TickerAutocomplete({
  value,
  onValueChange,
  placeholder = 'Search ticker, company name...',
}: TickerAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [stocks, setStocks] = useState<StockInfo[]>([]);

  // Load stock data
  useEffect(() => {
    async function loadStocks() {
      try {
        const [nasdaqRes, nyseRes] = await Promise.all([
          fetch('/finance/stocks_info_nasdaq.json'),
          fetch('/finance/stocks_info_nyse.json'),
        ]);

        const nasdaq = await nasdaqRes.json();
        const nyse = await nyseRes.json();

        setStocks([...nasdaq, ...nyse]);
      } catch (error) {
        console.error('Failed to load stock data:', error);
      }
    }

    loadStocks();
  }, []);

  // Filter stocks based on search
  const filteredStocks = useMemo(() => {
    if (!search) return stocks.slice(0, 10); // Show top 10 by default

    const query = search.toLowerCase();

    return stocks
      .filter(
        (stock) =>
          stock.stock_code.toLowerCase().includes(query) ||
          stock.company_name_eng.toLowerCase().includes(query) ||
          stock.company_name_kor.includes(search) // 한글은 대소문자 구분 없음
      )
      .slice(0, 10); // Top 10 results
  }, [search, stocks]);

  const handleSelect = (stockCode: string) => {
    // Convert dots to dashes for API compatibility (BRK.B → BRK-B)
    const converted = stockCode.replace('.', '-');
    onValueChange(converted);
    setSearch('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <Command
        className="border rounded-md"
        shouldFilter={false} // We handle filtering ourselves
      >
        <CommandInput
          placeholder={placeholder}
          value={search}
          onValueChange={setSearch}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />

        {open && filteredStocks.length > 0 && (
          <CommandList className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-lg">
            <CommandGroup>
              {filteredStocks.map((stock) => (
                <CommandItem
                  key={stock.stock_code}
                  value={stock.stock_code}
                  onSelect={() => handleSelect(stock.stock_code)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{stock.stock_code}</span>
                      <span className="text-xs text-gray-500">{stock.market_name}</span>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>{stock.company_name_kor}</span>
                      <span className="text-gray-400">·</span>
                      <span className="truncate">{stock.company_name_eng}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {filteredStocks.length === 0 && search && (
              <CommandEmpty>No stocks found.</CommandEmpty>
            )}
          </CommandList>
        )}
      </Command>

      {value && (
        <div className="mt-2 text-xs text-gray-500">
          Selected: <span className="font-semibold">{value}</span>
        </div>
      )}
    </div>
  );
}
