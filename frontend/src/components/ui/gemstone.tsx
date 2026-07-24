import React from 'react';

interface GemstoneProps {
    type: 'explorer' | 'professional' | 'corporate';
    className?: string;
}

const GEM_CONFIG = {
    explorer: {
        gradient: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 40%, #1e40af 100%)',
        glow: 'rgba(59, 130, 246, 0.3)',
        clipPath: 'polygon(50% 0%, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0% 50%, 15% 15%)', // Rough octagon
        shadow: '0 8px 32px rgba(59, 130, 246, 0.25)',
        label: '◇',
    },
    professional: {
        gradient: 'linear-gradient(135deg, #FFFFFF 0%, #586C8D 40%, #0F1F3D 100%)',
        glow: 'rgba(15, 31, 61, 0.24)',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Diamond
        shadow: '0 8px 32px rgba(15, 31, 61, 0.24)',
        label: '◆',
    },
    corporate: {
        gradient: 'linear-gradient(135deg, #FFFFFF 0%, #586C8D 45%, #0F1F3D 100%)',
        glow: 'rgba(15, 31, 61, 0.2)',
        clipPath: 'polygon(50% 0%, 80% 10%, 100% 40%, 95% 70%, 70% 100%, 30% 100%, 5% 70%, 0% 40%, 20% 10%)', // Complex gem
        shadow: '0 8px 32px rgba(15, 31, 61, 0.2)',
        label: '♦',
    },
};

export const Gemstone: React.FC<GemstoneProps> = ({ type, className }) => {
    const config = GEM_CONFIG[type];

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Ambient glow */}
            <div
                className="absolute w-24 h-24 rounded-full blur-2xl opacity-50 animate-pulse"
                style={{ background: config.glow }}
            />

            {/* Main gem shape */}
            <div
                className="relative w-20 h-20 transition-transform duration-700 hover:scale-110"
                style={{
                    clipPath: config.clipPath,
                    background: config.gradient,
                    boxShadow: config.shadow,
                    animation: 'gem-float 4s ease-in-out infinite',
                }}
            >
                {/* Inner sparkle overlay */}
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)',
                        animation: 'gem-shimmer 3s ease-in-out infinite',
                    }}
                />
            </div>

            {/* CSS keyframes (injected via style tag, safe for SSR) */}
            <style>{`
                @keyframes gem-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes gem-shimmer {
                    0%, 100% { opacity: 0.2; transform: translateX(-100%); }
                    50% { opacity: 0.6; transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
