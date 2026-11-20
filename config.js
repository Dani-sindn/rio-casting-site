/* =========================================================================
   Rio Casting — site configuration
   Edit this file to update business data. No other file needs to change.
   ========================================================================= */
window.RIO = {
  contact: {
    address: "56 West 45th Street, 11th Floor, New York, NY 10036",
    phone: "(212) 764-7674",
    cell: "(914) 290-2217",
    fax: "(212) 764-7810",
    email: "print@riocastinginc.com"
  },

  // Live spot prices (USD per troy ounce) from api.gold-api.com — free, no key.
  prices: {
    endpoint: "https://api.gold-api.com/price/",
    refreshMs: 60000
  }
};
