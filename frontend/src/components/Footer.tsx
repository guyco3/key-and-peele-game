import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="game-footer">
      <div className="game-footer-inner">
        {/* Row 1 */}
        <div className="game-footer-links">
          <Link to="/info#about">About</Link>
          <span className="footer-sep">|</span>
          <Link to="/info#terms">Terms</Link>
          <span className="footer-sep">|</span>
          <Link to="/info#privacy">Privacy</Link>
        </div>
        
        {/* Row 2 */}
        <div className="game-footer-support">
          <a href="https://www.buymeacoffee.com/guyco3" target="_blank" rel="noreferrer">
            ☕ Support this project
          </a>
        </div>
      </div>
    </footer>
  );
};