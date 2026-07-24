// DEPRECATED, superseded by NavBar.tsx. Safe to delete.
// DEPRECATED, superseded by NavBar.tsx and Footer.tsx. Safe to delete.
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { Menu, X } from 'lucide-react';
import { GoldButton } from './GoldButton';
import { KO_FI_URL } from '../../constants/beta';

const links = [
  { name: 'About', path: '/about' },
  { name: 'Membership', path: '/membership' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Posts', path: '/posts' },
  { name: 'Supporter Feed', path: '/supporter-feed' },
];

export const BetaNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isDarkHero = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-background/85 backdrop-blur-xl border-b border-primary/10 border-t border-t-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.05)]'
            : isDarkHero ? 'bg-background py-6 border-b border-foreground/5' : 'bg-background/70 backdrop-blur-xl border-b border-primary/10 py-3 border-t border-t-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group">
            <span className={`font-serif font-bold text-xl transition-colors ${(scrolled || !isDarkHero) ? 'text-primary' : 'text-foreground'} group-hover:opacity-90`}>
              BOA-<span className="text-accent">Story</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <NavigationMenu.Root className="hidden md:flex relative justify-center z-10">
            <NavigationMenu.List className="flex gap-8 items-center m-0 p-0 list-none">
              {links.map((link) => {
                const isActive = location.pathname === link.path ||
                  (link.path !== '/' && location.pathname.startsWith(link.path + '/'));
                return (
                  <NavigationMenu.Item key={link.path}>
                    <NavigationMenu.Link asChild active={isActive}>
                      <Link 
                        to={link.path}
                        className={`font-sans font-medium text-[0.9375rem] transition-colors duration-150 ${
                          (scrolled || !isDarkHero)
                            ? isActive ? 'text-primary' : 'text-primary/60 hover:text-primary'
                            : isActive ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                );
              })}
            </NavigationMenu.List>
          </NavigationMenu.Root>

          {/* Right side CTA / Mobile Toggle */}
          <div className="flex items-center gap-4">
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="hidden md:block">
              <GoldButton variant="primary" size="small">Support BOA, Launch Your Story</GoldButton>
            </a>
            
            <button 
              className={`md:hidden transition-colors ${(scrolled || !isDarkHero) ? 'text-primary/80 hover:text-primary' : 'text-foreground/80 hover:text-foreground'}`}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col px-6 pt-16 pb-8 border-b border-primary/10 overflow-y-auto"
          >
            <button
              className="absolute top-4 right-4 text-primary/80 hover:text-primary p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={28} />
            </button>
            <nav className="flex flex-col gap-8 mt-12">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-3xl font-serif text-primary/80 hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-10 mt-6 border-t border-primary/10">
                <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <GoldButton variant="primary" className="w-full">Support BOA, Launch Your Story</GoldButton>
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
