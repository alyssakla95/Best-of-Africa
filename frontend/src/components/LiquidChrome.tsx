import React from 'react';

export const LiquidChrome: React.FC = () => {
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-gray-900 pointer-events-none">
            {/* SVG Filter Definition */}
            <svg style={{ display: 'none' }}>
                <defs>
                    <filter id="liquid-metal">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                            result="goo"
                        />
                        {/* Specular Lighting for Metallic Shine */}
                        <feSpecularLighting in="goo" surfaceScale="15" specularConstant="1" specularExponent="20" lightingColor="#ffffff" result="specular">
                            <fePointLight x="500" y="-100" z="200" />
                        </feSpecularLighting>
                        {/* Composite Light + Color */}
                        <feComposite in="specular" in2="goo" operator="in" result="composite" />
                        <feComposite in="SourceGraphic" in2="composite" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                    </filter>
                </defs>
            </svg>

            {/* Moving Orbs */}
            <div className="w-full h-full relative filter-[url('#liquid-metal')] opacity-60">
                <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-r from-blue-900 to-slate-800 rounded-full mix-blend-multiply filter blur-xl animate-blob opacity-70"></div>
                <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-r from-slate-800 to-gray-600 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000 opacity-70"></div>
                <div className="absolute top-1/3 left-1/2 w-[350px] h-[350px] bg-gradient-to-r from-indigo-900 to-slate-900 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000 opacity-70"></div>

                {/* Metallic Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
            </div>

            {/* Scanline/Grid Overlay for "Tech" feel */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
        </div>
    );
};
