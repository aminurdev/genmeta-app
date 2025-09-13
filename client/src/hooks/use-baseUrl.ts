import { useEffect, useState } from "react";

export const useBaseUrl = () => {
  const [baseUrl, setBaseUrl] = useState(
    process.env.NEXT_PUBLIC_APP_URL || "https://genmeta.app"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(`${window.location.protocol}//${window.location.host}`);
    }
  }, []);

  return baseUrl;
};
