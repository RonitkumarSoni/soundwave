import { useState, useEffect } from "react";
import axios from "axios";

type PricingInfo = {
  countryCode: string;
  countryName: string;
  currencySymbol: string;
  price: string;
  isIndia: boolean;
  isLoading: boolean;
};

export const useCountryPricing = () => {
  const [info, setInfo] = useState<PricingInfo>({
    countryCode: "IN",
    countryName: "India",
    currencySymbol: "₹",
    price: "99.00",
    isIndia: true,
    isLoading: true,
  });

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const { data } = await axios.get("https://get.geojs.io/v1/ip/geo.json");
        const code = data.country_code;
        const name = data.country;
        
        if (code === "IN") {
          setInfo({
            countryCode: code,
            countryName: name,
            currencySymbol: "₹",
            price: "99.00",
            isIndia: true,
            isLoading: false,
          });
        } else {
          setInfo({
            countryCode: code || "US",
            countryName: name || "United States",
            currencySymbol: "$",
            price: "1.99",
            isIndia: false,
            isLoading: false,
          });
        }
      } catch (error) {
        // Fallback to IN if offline
        setInfo(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchCountry();
  }, []);

  return info;
};
