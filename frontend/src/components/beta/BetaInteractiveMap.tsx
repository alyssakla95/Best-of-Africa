import React from 'react';

interface MapData {
    country_code: string;
    country_name: string;
    score: number;
}

interface BetaInteractiveMapProps {
    data: MapData[];
    onCountryClick?: (countryCode: string) => void;
    legendLow?: string;
    legendHigh?: string;
}

/**
 * A responsive country-intensity view.
 *
 * The former implementation downloaded and parsed a full geographic map and
 * pulled an obsolete d3 zoom stack into the reader bundle. That map became
 * cramped on phones and its dependency chain carries an unfixed ReDoS advisory.
 * This native grid preserves every country value, works with touch and keyboard,
 * and stays readable without horizontal scrolling.
 */
export const BetaInteractiveMap: React.FC<BetaInteractiveMapProps> = ({
    data,
    onCountryClick,
    legendLow = 'Lower value',
    legendHigh = 'Higher value',
}) => {
    const countries = [...data]
        .map(country => ({ ...country, score: Math.max(0, Number(country.score) || 0) }))
        .sort((a, b) => b.score - a.score || a.country_name.localeCompare(b.country_name));
    const maximum = Math.max(1, ...countries.map(country => country.score));

    if (!countries.length) {
        return (
            <div className="rounded-2xl border border-dashed border-navy/20 bg-white p-6 text-sm leading-7 text-navy/70">
                No country values were supplied to this view.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-navy/15 bg-white">
            <div className="grid grid-cols-1 gap-px bg-navy/10 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {countries.map(country => {
                    const intensity = country.score / maximum;
                    const interactive = Boolean(onCountryClick);
                    return (
                        <button
                            key={country.country_code}
                            type="button"
                            disabled={!interactive}
                            onClick={() => onCountryClick?.(country.country_code)}
                            className="group min-w-0 bg-white p-4 text-left transition-colors enabled:hover:bg-navy enabled:hover:text-white disabled:cursor-default sm:p-5"
                            aria-label={`${country.country_name}: ${country.score}`}
                        >
                            <span
                                aria-hidden="true"
                                className="mb-4 block h-2.5 w-full rounded-full bg-navy/10"
                            >
                                <span
                                    className="block h-full rounded-full bg-navy transition-[width]"
                                    style={{ width: `${Math.max(4, intensity * 100)}%`, opacity: 0.35 + intensity * 0.65 }}
                                />
                            </span>
                            <span className="flex min-w-0 items-baseline justify-between gap-3">
                                <span className="truncate text-sm font-bold text-navy group-enabled:group-hover:text-white">
                                    {country.country_name}
                                </span>
                                <span className="shrink-0 font-serif text-xl tabular-nums text-navy group-enabled:group-hover:text-white">
                                    {country.score}
                                </span>
                            </span>
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.12em] text-navy/50 group-enabled:group-hover:text-white/70">
                                {country.country_code}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-navy/55 sm:px-5">
                <span>{legendLow}</span>
                <span className="h-2 min-w-24 flex-1 rounded-full bg-gradient-to-r from-navy/10 to-navy sm:max-w-48" aria-hidden="true"/>
                <span>{legendHigh}</span>
            </div>
        </div>
    );
};
