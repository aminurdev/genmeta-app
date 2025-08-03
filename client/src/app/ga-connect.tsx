import Script from "next/script";
import React from "react";

export const GTMConnect = () => {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
  
  // Don't render if GTM_ID is not provided
  if (!GTM_ID) {
    console.warn('GTM_ID not found in environment variables');
    return null;
  }

  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
      
      {/* Initialize dataLayer */}
      <Script
        id="gtm-datalayer"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
          `,
        }}
      />
    </>
  );
};

// Legacy export for backward compatibility
export const GaConnect = GTMConnect;
