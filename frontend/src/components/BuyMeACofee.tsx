import React, { useEffect } from 'react';

export const BuyMeACoffee: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('src', 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js');
    script.setAttribute('data-id', 'guyco3');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', 'If you like the game, consider supporting the servers!');
    script.setAttribute('data-color', '#40DCA5');
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', '18');
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      // Clean up the widget when the component unmounts
      const widget = document.getElementById('bmc-wbtn');
      if (widget) widget.remove();
    };
  }, []);

  return null; // This component doesn't render HTML, it just runs the script
};