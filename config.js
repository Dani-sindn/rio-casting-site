/* =========================================================================
   Rio Casting — site configuration
   Edit this file to update business data. No other file needs to change.
   ========================================================================= */
window.RIO = {
  contact: {
    address: "56 West 45th St, 11th Floor, New York, NY 10036",
    phone: "+1 212-764-7674",
    email: "roberto@riocasting.com"
  },

  // Live spot prices (USD per troy ounce) from api.gold-api.com — free, no key.
  prices: {
    endpoint: "https://api.gold-api.com/price/",
    refreshMs: 60000
  },

  // Start-a-project form. Leave endpoint empty to open the visitor's email app
  // with the request pre-filled (sent to contact.email). Set a URL (Formspree,
  // Basin, your own API…) to POST the form as JSON instead.
  form: { endpoint: "" }
};
