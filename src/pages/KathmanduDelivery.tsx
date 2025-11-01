import React from 'react';
import { Helmet } from 'react-helmet-async';

const KathmanduDelivery: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Same Day Delivery in Kathmandu | ezeyway - Instant Shopping & Delivery</title>
        <meta name="description" content="Get same-day delivery in Kathmandu Valley. Shop groceries, electronics, fashion & more with instant delivery within 2 hours. Connect with trusted local vendors." />
        <meta name="keywords" content="Kathmandu delivery, same day delivery Kathmandu, instant delivery Nepal, Kathmandu Valley shopping, local delivery service Kathmandu" />
        <link rel="canonical" href="https://ezeyway.com/kathmandu-delivery" />

        {/* Structured Data for Kathmandu Delivery */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Kathmandu Same-Day Delivery Service",
          "description": "Same-day delivery service covering all areas of Kathmandu Valley",
          "provider": {
            "@type": "Organization",
            "name": "ezeyway"
          },
          "areaServed": {
            "@type": "City",
            "name": "Kathmandu",
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
            Same Day Delivery in Kathmandu
          </h1>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Why Choose ezeyway in Kathmandu?</h2>
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
                  <span>Covers entire Kathmandu Valley</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Areas We Serve</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Thamel', ' Boudha', 'Swayambhu', 'Durbar Square',
                  'New Road', 'Putalisadak', 'Baneshwor', 'Koteshwor',
                  'Jawalakhel', 'Lazimpat', 'Maharajgunj', 'Baluwatar'
                ].map(area => (
                  <div key={area} className="bg-white p-3 rounded-lg shadow-sm border">
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6">Kathmandu Delivery Zones</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Core Kathmandu</h3>
                <p className="text-gray-600 mb-4">Central business districts with fastest delivery</p>
                <p className="text-sm text-gray-500">Delivery: Within 1 hour</p>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Extended Valley</h3>
                <p className="text-gray-600 mb-4">Lalitpur, Bhaktapur, and nearby areas</p>
                <p className="text-sm text-gray-500">Delivery: Within 2 hours</p>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Premium Service</h3>
                <p className="text-gray-600 mb-4">Express delivery for urgent orders</p>
                <p className="text-sm text-gray-500">Delivery: Within 30 minutes</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/search"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Shopping in Kathmandu
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default KathmanduDelivery;