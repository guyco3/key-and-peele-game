import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const InfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { hash } = useLocation();

  // Handle auto-scrolling to #about, #terms, or #privacy
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="game-screen-wrapper">
      <div className="info-page-view">
        
        <div className="info-page-header">
          <button className="btn-host" onClick={() => navigate('/')}>
            ← Back to Game
          </button>
        </div>

        <div className="info-page-grid">
          
          {/* --- ABOUT SECTION --- */}
          <section id="about" className="legal-info-card">
            <h2>About the Game</h2>
            <div className="legal-body-text">
                <p>
                <strong>guessthatbit</strong> began as a game between roommates. We would challenge each other to identify a <strong>Key & Peele</strong> sketch using only a short audio clip, competing to see who could guess the fastest.
                </p>
                <p>
                This site brings that experience online. You can join live rooms and compete with others in real-time to identify sketches from across the entire series.
                </p>

              <p>
                We utilize the <strong>YouTube IFrame Player API</strong> to serve video content directly from official sources. 
                This ensures the original creators receive their views while providing a synchronized trivia 
                environment for fans.
              </p>
              <p style={{ fontSize: '0.85rem', fontStyle: 'italic', marginTop: '1rem' }}>
                This is a fan-made project and is not affiliated with, endorsed by, or sponsored by Comedy Central, 
                Keegan-Michael Key, or Jordan Peele.
              </p>
            </div>
          </section>

          {/* --- TERMS OF SERVICE --- */}
          <section id="terms" className="legal-info-card">
            <h2 >Terms of Service</h2>
            <div className="legal-body-text">
              <p><strong>1. Terms:</strong> By accessing guessthatbit.com, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. The materials contained in this website are protected by applicable copyright and trademark law.</p>
              
              <p><strong>2. Use License:</strong> Permission is granted to temporarily access the materials (information or software) on guessthatbit.com for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                <ul style={{marginTop: '8px', paddingLeft: '20px'}}>
                  <li>Modify or copy the materials;</li>
                  <li>Attempt to decompile or reverse engineer any software (React/Node code) contained on the site;</li>
                  <li>Remove any copyright or other proprietary notations from the materials;</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                </ul>
              </p>
              
              <p><strong>3. Disclaimer:</strong> The materials on guessthatbit.com are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.</p>
              
              <p><strong>4. Limitations:</strong> In no event shall guessthatbit or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the website, even if we have been notified orally or in writing of the possibility of such damage.</p>

              <p><strong>5. Accuracy of Materials:</strong> The materials appearing on the website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete or current. We may make changes to the materials at any time without notice.</p>

              <p><strong>6. Links:</strong> We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement. Use of any such linked website is at the user's own risk.</p>

              <p><strong>7. Modifications:</strong> We may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>

              <p><strong>8. Governing Law:</strong> These terms and conditions are governed by and construed in accordance with the laws of <strong>the State of Washington</strong> and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
            </div>
          </section>

          {/* --- PRIVACY POLICY --- */}
          <section id="privacy" className="legal-info-card">
            <h2 >Privacy Policy</h2>
            <div className="legal-body-text">
              <p><strong>Philosophy:</strong> Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect while operating our website. We collect information by lawful and fair means and, where appropriate, with your knowledge or consent.</p>
              
              <p><strong>Local Storage:</strong> We do not use traditional advertising cookies. However, to ensure a seamless multiplayer experience, we store three identifiers in your browser's Local Storage:
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <li><code>kp_client_id</code>: A unique UUID to maintain your session.</li>
                  <li><code>kp_username</code>: Your chosen display name.</li>
                  <li><code>kp_room_code</code>: The ID of the room you are currently playing in.</li>
                </ul>
              </p>

              <p><strong>Third-Party Services:</strong> Our game relies on <strong>YouTube API Services</strong> to function. By using this application, you are bound by the <a href="https://www.google.com/policies/privacy" target="_blank" rel="noreferrer" style={{color: '#2563eb'}}>Google Privacy Policy</a> and the YouTube Terms of Service.</p>

              <p><strong>Data Protection:</strong> We protect personal information (such as technical logs or IP addresses) by using reasonable security safeguards against loss or theft, as well as unauthorized access, disclosure, or modification.</p>

              <p><strong>Retention:</strong> Active game data (scores and room membership) is stored only in temporary server memory (RAM) and is cleared once a room becomes inactive or the server restarts.</p>
            </div>
          </section>

          {/* --- DATA MANAGEMENT --- */}
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <p style={{ fontFamily: 'Gochi Hand', color: 'var(--chalk-white)', opacity: 0.7, marginBottom: '10px' }}>
              Want to start fresh?
            </p>
            <button 
              className="btn-join" 
              style={{ fontSize: '0.9rem', padding: '10px 16px', background: '#ff4444', color: 'white' }}
              onClick={() => {
                if(window.confirm("This will wipe your username and unique client ID. You will be redirected to the home page. Continue?")) {
                  localStorage.clear();
                  window.location.href = "/";
                }
              }}
            >
              Wipe My Local Data
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};