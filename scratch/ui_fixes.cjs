const fs = require('fs');

const fixLanding = () => {
    let content = fs.readFileSync('frontend/src/pages/beta/BetaLanding.tsx', 'utf8');
    // Remove inline footer
    const footerRegex = /<footer className=\"bg-primary border-t border-white\/5 text-primary-foreground py-12\">[\s\S]*?<\/footer>/;
    content = content.replace(footerRegex, '');
    
    // Fix root div classes
    content = content.replace(/className=\"min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-primary overflow-x-hidden\"/, 'className=\"selection:bg-accent selection:text-primary\"');
    
    // Fix hero padding
    content = content.replace(/pt-20 pb-32 overflow-hidden border-b border-white\/5 bg-primary text-primary-foreground/, 'pt-8 pb-24 overflow-hidden border-b border-white/5 bg-primary text-primary-foreground');
    content = content.replace(/min-h-\[90vh\]/, 'min-h-[80vh]');
    
    fs.writeFileSync('frontend/src/pages/beta/BetaLanding.tsx', content);
};

const fixAbout = () => {
    let content = fs.readFileSync('frontend/src/pages/beta/BetaAbout.tsx', 'utf8');
    content = content.replace(/className=\"min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-primary\"/, 'className=\"selection:bg-accent selection:text-primary\"');
    content = content.replace(/className=\"pt-32 pb-24 px-6 relative overflow-hidden bg-primary\"/, 'className=\"pt-8 pb-24 px-6 relative overflow-hidden bg-primary\"');
    fs.writeFileSync('frontend/src/pages/beta/BetaAbout.tsx', content);
};

const fixMembership = () => {
    let content = fs.readFileSync('frontend/src/pages/beta/BetaMembership.tsx', 'utf8');
    content = content.replace(/className=\"min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-primary\"/, 'className=\"selection:bg-accent selection:text-primary\"');
    fs.writeFileSync('frontend/src/pages/beta/BetaMembership.tsx', content);
};

const fixStories = () => {
    let content = fs.readFileSync('frontend/src/pages/beta/BetaStories.tsx', 'utf8');
    content = content.replace(/className=\"min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-primary pb-32\"/, 'className=\"selection:bg-accent selection:text-primary\"');
    fs.writeFileSync('frontend/src/pages/beta/BetaStories.tsx', content);
};

const fixArticle = () => {
    let content = fs.readFileSync('frontend/src/pages/beta/BetaArticle.tsx', 'utf8');
    content = content.replace(/className=\"min-h-screen bg-background text-primary font-sans\"/g, 'className=\"\"');
    content = content.replace(/className=\"min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-primary\"/, 'className=\"selection:bg-accent selection:text-primary\"');
    content = content.replace(/z-\[100\]/g, 'z-[45]');
    content = content.replace(/border-white\/5/g, 'border-primary/10');
    fs.writeFileSync('frontend/src/pages/beta/BetaArticle.tsx', content);
};

const fixCountryHub = () => {
    let content = fs.readFileSync('frontend/src/pages/beta/BetaCountryHub.tsx', 'utf8');
    content = content.replace(/className=\"min-h-screen bg-background flex flex-col\"/g, 'className=\"flex flex-col\"');
    content = content.replace(/className=\"min-h-screen bg-background text-primary font-sans pb-24\"/g, 'className=\"pb-24\"');
    content = content.replace(/pt-24/g, 'pt-8');
    fs.writeFileSync('frontend/src/pages/beta/BetaCountryHub.tsx', content);
};

const fixMarketIntel = () => {
    let content = fs.readFileSync('frontend/src/pages/beta/BetaMarketIntel.tsx', 'utf8');
    content = content.replace(/className=\"min-h-screen bg-background text-primary font-sans pb-24\"/g, 'className=\"pb-24\"');
    content = content.replace(/pt-28/g, 'pt-8');
    fs.writeFileSync('frontend/src/pages/beta/BetaMarketIntel.tsx', content);
};

const fixOthers = () => {
    ['BetaCountryTeaser.tsx', 'BetaGallery.tsx'].forEach(file => {
        let content = fs.readFileSync('frontend/src/pages/beta/' + file, 'utf8');
        content = content.replace(/className=\"min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-primary pb-32\"/, 'className=\"selection:bg-accent selection:text-primary\"');
        fs.writeFileSync('frontend/src/pages/beta/' + file, content);
    });

    ['BetaNewsletter.tsx'].forEach(file => {
        let content = fs.readFileSync('frontend/src/pages/beta/' + file, 'utf8');
        content = content.replace(/className=\"min-h-screen bg-background text-primary flex flex-col\"/g, 'className=\"flex flex-col\"');
        fs.writeFileSync('frontend/src/pages/beta/' + file, content);
    });

    let maccess = fs.readFileSync('frontend/src/pages/beta/BetaMemberAccess.tsx', 'utf8');
    maccess = maccess.replace(/className=\"min-h-screen bg-background text-primary flex flex-col\"/g, 'className=\"flex flex-col\"');
    maccess = maccess.replace(/className=\"min-h-screen bg-background text-primary font-sans flex flex-col\"/g, 'className=\"font-sans flex flex-col\"');
    maccess = maccess.replace(/className=\"min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-primary flex flex-col\"/g, 'className=\"font-sans selection:bg-accent selection:text-primary flex flex-col\"');
    fs.writeFileSync('frontend/src/pages/beta/BetaMemberAccess.tsx', maccess);
};

const fixIndex = () => {
    let content = fs.readFileSync('frontend/src/components/beta/index.ts', 'utf8');
    content = content.replace(/export \* from '\.\/BetaNav';\n/g, '');
    content = content.replace(/export \* from '\.\/BetaFooter';\n/g, '');
    fs.writeFileSync('frontend/src/components/beta/index.ts', content);
    
    fs.writeFileSync('frontend/src/components/beta/BetaNav.tsx', '// DEPRECATED — superseded by NavBar.tsx. Safe to delete.\n' + fs.readFileSync('frontend/src/components/beta/BetaNav.tsx', 'utf8'));
    fs.writeFileSync('frontend/src/components/beta/BetaFooter.tsx', '// DEPRECATED — superseded by Footer.tsx. Safe to delete.\n' + fs.readFileSync('frontend/src/components/beta/BetaFooter.tsx', 'utf8'));
};

try {
    fixLanding();
    fixAbout();
    fixMembership();
    fixStories();
    fixArticle();
    fixCountryHub();
    fixMarketIntel();
    fixOthers();
    fixIndex();
    console.log('UI fixes applied successfully.');
} catch (e) {
    console.error(e);
}
