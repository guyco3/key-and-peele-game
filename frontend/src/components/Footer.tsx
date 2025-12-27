import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="game-footer">
      <div className="game-footer-inner">

        <div className="game-footer-support">
          <a href="https://www.buymeacoffee.com/guyco3" target="_blank" rel="noreferrer">
            ☕ Support this project
          </a>
        </div>


        {/* Row 2 */}
        <div className="game-footer-support">
          <p>
            By clicking any of the buttons above, you agree to our{" "}<Link to="/info#terms">Terms of Service</Link> and{" "}<Link to="/info#privacy">Privacy Policy</Link>. Learn more about the game <Link to="/info#about">here</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
};