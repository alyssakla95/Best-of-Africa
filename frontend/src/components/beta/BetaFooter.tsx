// DEPRECATED, superseded by Footer.tsx. Safe to delete.
// DEPRECATED, superseded by NavBar.tsx and Footer.tsx. Safe to delete.
import { Link } from 'react-router-dom';
import { KO_FI_URL } from '../../constants/beta';

/**
 * Shared minimal footer used across all beta pages.
 * BetaLanding uses its own full footer; this is for the secondary pages.
 */
export const BetaFooter = () => (
  <footer className="bg-background border-t border-foreground/5 py-10 px-6 mt-16 text-foreground">
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-5 text-center">
      <Link to="/" className="font-serif text-lg font-bold text-foreground">
        BOA-<span className="text-accent">Story</span>
      </Link>
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-foreground/40">
        <Link to="/about"         className="hover:text-foreground transition-colors">About</Link>
        <Link to="/membership"    className="hover:text-foreground transition-colors">Membership</Link>
        <Link to="/gallery"       className="hover:text-foreground transition-colors">Gallery</Link>
        <Link to="/posts"         className="hover:text-foreground transition-colors">Posts</Link>
        <Link to="/supporter-feed" className="hover:text-foreground transition-colors">Supporter Feed</Link>
        <Link to="/newsletter"    className="hover:text-foreground transition-colors">Newsletter</Link>
        <Link to="/member-access" className="hover:text-accent transition-colors">Member Access</Link>
        <a
          href={KO_FI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent transition-colors"
        >Ko-fi ↗</a>
      </nav>
      <p className="text-xs text-foreground/30">© {new Date().getFullYear()} BOA-Story. All rights reserved.</p>
    </div>
  </footer>
);
