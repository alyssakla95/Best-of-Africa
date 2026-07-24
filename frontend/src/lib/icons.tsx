import React from 'react';
import {
    LightningBoltIcon,
    MobileIcon,
    RocketIcon,
    ReaderIcon,
    TriangleUpIcon,
    PaperPlaneIcon,
    GlobeIcon,
    BackpackIcon,
    PieChartIcon
} from '@radix-ui/react-icons';

export const getSectorIcon = (id: string, className?: string): React.ReactNode => {
    const props = { className: className || "h-6 w-6" };

    switch (id.toLowerCase()) {
        case 'energy':
        case 'mining':
        case 'oil':
            return <LightningBoltIcon {...props} />;
        case 'tech':
        case 'fintech':
        case 'digital':
            return <MobileIcon {...props} />;
        case 'agri':
        case 'agriculture':
            return <RocketIcon {...props} />; // Using Rocket as proxy for growth/agri tech in Radix set
        case 'infra':
        case 'infrastructure':
        case 'logistics':
            return <ReaderIcon {...props} />;
        case 'finance':
        case 'banking':
            return <TriangleUpIcon {...props} />;
        case 'tourism':
        case 'travel':
            return <PaperPlaneIcon {...props} />;
        case 'general':
        case 'business':
            return <BackpackIcon {...props} />;
        default:
            return <PieChartIcon {...props} />;
    }
};

export const getRegionIcon = (_region: string, className?: string): React.ReactNode => {
    // For future expansion if we want specific icons per region (e.g. North, South maps)
    // Currently returing a high-fidelity generic globe
    return <GlobeIcon className={className || "h-6 w-6"} />;
};
