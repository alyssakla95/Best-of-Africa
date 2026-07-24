import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

// Bundled locally — the previous external GitHub URL 404'd, leaving the map blank.
const geoUrl = "/geo/africa.geojson";

interface MapData {
    country_code: string;
    country_name: string;
    score: number; // 0 to 100
}

interface BetaInteractiveMapProps {
    data: MapData[];
    onCountryClick?: (countryCode: string) => void;
    /** Legend endpoint labels — must name what `score` measures on THIS page
     *  (the old hardcoded "Higher divergence" survived a page whose scores
     *  became story counts). */
    legendLow?: string;
    legendHigh?: string;
}

export const BetaInteractiveMap: React.FC<BetaInteractiveMapProps> = ({ data, onCountryClick, legendLow = 'Fewer', legendHigh = 'More stories' }) => {
    const [tooltipContent, setTooltipContent] = useState('');

    // Divergence gap is a MAGNITUDE → sequential ramp, one hue light→dark
    // (pale champagne → deep gold). No-data countries get a faint navy tint
    // that reads against the light card without competing with the data.
    const colorScale = scaleLinear<string>()
        .domain([0, 100])
        .range(["#FFFFFF", "#0F1F3D"]);

    const getScore = (geoName: string) => {
        // Simple mapping, might need more robust country name matching in production
        const countryData = data.find(d => 
            d.country_name.toLowerCase() === geoName.toLowerCase() ||
            d.country_name.toLowerCase().includes(geoName.toLowerCase()) ||
            geoName.toLowerCase().includes(d.country_name.toLowerCase())
        );
        return countryData ? countryData.score : 0;
    };

    return (
        <div className="relative w-full h-full bg-white rounded-2xl border border-primary/10 overflow-hidden">
            <ComposableMap
                projection="geoAzimuthalEqualArea"
                projectionConfig={{
                    // Centered near [20E, 1N] at a scale that fits the WHOLE
                    // continent — at scale 400 the southern third was clipped.
                    rotate: [-20.0, 4.0, 0],
                    scale: 292
                }}
            >
                <ZoomableGroup zoom={1}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map(geo => {
                                const geoName = geo.properties.name || geo.properties.geounit;
                                const score = getScore(geoName);
                                
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => {
                                            setTooltipContent(`${geoName}: ${score > 0 ? `Score ${score}` : 'No Data'}`);
                                        }}
                                        onMouseLeave={() => {
                                            setTooltipContent("");
                                        }}
                                        onClick={() => {
                                            if (onCountryClick && score > 0) {
                                                const countryData = data.find(d => 
                                                    d.country_name.toLowerCase() === geoName.toLowerCase() ||
                                                    d.country_name.toLowerCase().includes(geoName.toLowerCase()) ||
                                                    geoName.toLowerCase().includes(d.country_name.toLowerCase())
                                                );
                                                if (countryData) {
                                                    onCountryClick(countryData.country_code);
                                                }
                                            }
                                        }}
                                        style={{
                                            default: {
                                                fill: score > 0 ? colorScale(score) : "#FFFFFF",
                                                stroke: "rgba(15,31,61,0.35)",
                                                strokeWidth: 0.75,
                                                outline: "none"
                                            },
                                            hover: {
                                                fill: "#0a2540", // primary color
                                                stroke: "#0F1F3D",
                                                strokeWidth: 1,
                                                outline: "none",
                                                cursor: score > 0 ? "pointer" : "default"
                                            },
                                            pressed: {
                                                fill: "#0F1F3D",
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            {tooltipContent && (
                <div className="absolute bottom-4 left-4 bg-navy text-white border border-accent/35 px-4 py-2 rounded-xl shadow-[0_12px_32px_rgba(15,31,61,0.35)] text-sm font-semibold pointer-events-none">
                    {tooltipContent}
                </div>
            )}
            {/* Legend — sequential ramp with ink labels (identity never color-alone) */}
            <div aria-hidden="true" className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-primary/10 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60">{legendLow}</span>
                <span className="h-2 w-24 rounded-full border border-navy/20" style={{ background: 'linear-gradient(to right, #FFFFFF, #0F1F3D)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60">{legendHigh}</span>
            </div>
        </div>
    );
};
