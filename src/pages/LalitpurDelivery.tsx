import React from 'react';
import { Helmet } from 'react-helmet-async';

const LalitpurDelivery: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Same Day Delivery in Lalitpur | ezeyway - Instant Shopping & Delivery</title>
        <meta name="description" content="Get same-day delivery in Lalitpur, Nepal. Shop groceries, electronics, fashion & more with instant delivery within 2 hours. Connect with trusted local vendors." />
        <meta name="keywords" content="Lalitpur delivery, same day delivery Lalitpur, instant delivery Nepal, Patan shopping, local delivery service Lalitpur" />
        <link rel="canonical" href="https://ezeyway.com/lalitpur-delivery" />

        {/* Structured Data for Lalitpur Delivery */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Lalitpur Same-Day Delivery Service",
          "description": "Same-day delivery service covering all areas of Lalitpur (Patan)",
          "provider": {
            "@type": "Organization",
            "name": "ezeyway"
          },
          "areaServed": {
            "@type": "City",
            "name": "Lalitpur",
            "alternateName": "Patan",
            "addressCountry": "NP"
          },
          "serviceType": "Delivery Service",
          "offers": {
            "@type": "Offer",
            "description": "Same-day delivery within 2 hours"
          }
        })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Same Day Delivery in Lalitpur (Patan)
          </h1>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Why Choose ezeyway in Lalitpur?</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Same-day delivery within 2 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Connect with verified local vendors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Fresh products and best prices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Covers all Lalitpur neighborhoods</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Areas We Serve in Lalitpur</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Patan Durbar Square', 'Jawalakhel', 'Pulchowk', 'Sanepa',
                  'Lagankhel', 'Bakhundole', 'Kupandole', 'Ekantakuna',
                  'Gwarko', 'Imadol', 'Nakhu', 'Thecho'
                ].map(area => (
                  <div key={area} className="bg-white p-3 rounded-lg shadow-sm border">
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6">Lalitpur Delivery Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Popular Shopping Areas</h3>
                <ul className="space-y-2">
                  <li>• Pulchowk - Electronics & Fashion</li>
                  <li>• Jawalakhel - Restaurants & Groceries</li>
                  <li>• Kupandole - Modern Shopping</li>
                  <li>• Lagankhel - Traditional Markets</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Delivery Times</h3>
                <ul className="space-y-2">
                  <li>• Standard Delivery: 1-2 hours</li>
                  <li>• Express Service: 30-45 minutes</li>
                  <li>• Operating Hours: 6 AM - 10 PM</li>
                  <li>• Weekend Service: Available</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/search"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Shopping in Lalitpur
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default LalitpurDelivery;