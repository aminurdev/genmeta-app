import Script from "next/script";
import React from "react";

export const GaConnect = () => {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;
  console.log(
    "gtm url: ",
    `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  );

  return (
    <head>
      {/* GA Script Tag */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
        }}
      />
    </head>
  );
};
