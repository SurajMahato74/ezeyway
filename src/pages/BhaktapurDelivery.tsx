import React from 'react';
import { Helmet } from 'react-helmet-async';

const BhaktapurDelivery: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Same Day Delivery in Bhaktapur | ezeyway - Instant Shopping & Delivery</title>
        <meta name="description" content="Get same-day delivery in Bhaktapur, Nepal. Shop groceries, electronics, fashion & more with instant delivery within 2 hours. Connect with trusted local vendors." />
        <meta name="keywords" content="Bhaktapur delivery, same day delivery Bhaktapur, instant delivery Nepal, Bhadgaon shopping, local delivery service Bhaktapur" />
        <link rel="canonical" href="https://ezeyway.com/bhaktapur-delivery" />

        {/* Structured Data for Bhaktapur Delivery */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Bhaktapur Same-Day Delivery Service",
          "description": "Same-day delivery service covering all areas of Bhaktapur (Bhadgaon)",
          "provider": {
            "@type": "Organization",
            "name": "ezeyway"
          },
          "areaServed": {
            "@type": "City",
            "name": "Bhaktapur",
            "alternateName": "Bhadgaon",
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
            Same Day Delivery in Bhaktapur (Bhadgaon)
          </h1>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Why Choose ezeyway in Bhaktapur?</h2>
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
                  <span>Covers all Bhaktapur neighborhoods</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Areas We Serve in Bhaktapur</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Durbar Square', 'Taumadhi', 'Dattatreya', 'Pottery Square',
                  'Siddha Pokhari', 'Bode', 'Katunje', 'Thimi',
                  'Madhyapur', 'Suryabinayak', 'Balkot', 'Chyamhasingh'
                ].map(area => (
                  <div key={area} className="bg-white p-3 rounded-lg shadow-sm border">
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6">Bhaktapur Delivery Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Local Specialties</h3>
                <ul className="space-y-2">
                  <li>• Traditional Pottery & Crafts</li>
                  <li>• Local Juju Dhau (Yogurt)</li>
                  <li>• Fresh Vegetables & Spices</li>
                  <li>• Handmade Goods</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Delivery Times</h3>
                <ul className="space-y-2">
                  <li>• Standard Delivery: 1-2 hours</li>
                  <li>• Express Service: 45-60 minutes</li>
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
              Start Shopping in Bhaktapur
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default BhaktapurDelivery;