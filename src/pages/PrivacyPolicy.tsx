import { ArrowLeft, Shield, Eye, Lock, Users, FileText, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-800" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Privacy Policy
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Introduction */}
        <Card className="p-6">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h2>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              At Ezeyway, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              marketplace platform and services.
            </p>
          </div>
        </Card>

        {/* Information We Collect */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Information We Collect
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Personal Information</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Name, email address, phone number</li>
                <li>Delivery address and billing information</li>
                <li>Profile picture and account preferences</li>
                <li>Payment information (processed securely by third-party providers)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Usage Information</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Device information and IP address</li>
                <li>Location data (with your permission)</li>
                <li>App usage patterns and preferences</li>
                <li>Search queries and product interactions</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Vendor Information</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Business name, registration details, and tax information</li>
                <li>Product listings, descriptions, and images</li>
                <li>Bank account details for payments</li>
                <li>Business location and operating hours</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* How We Use Information */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            How We Use Your Information
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Service Provision</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>Process orders and payments</li>
                <li>Facilitate delivery services</li>
                <li>Provide customer support</li>
                <li>Manage user accounts</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Platform Improvement</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>Analyze usage patterns</li>
                <li>Improve app functionality</li>
                <li>Personalize user experience</li>
                <li>Develop new features</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Communication</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>Send order updates</li>
                <li>Notify about promotions</li>
                <li>Provide important announcements</li>
                <li>Respond to inquiries</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Legal Compliance</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>Comply with regulations</li>
                <li>Prevent fraud and abuse</li>
                <li>Resolve disputes</li>
                <li>Enforce terms of service</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Information Sharing */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            Information Sharing and Disclosure
          </h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 font-medium mb-2">We do not sell your personal information to third parties.</p>
              <p className="text-blue-700 text-sm">We may share information only in the following circumstances:</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-800">With Vendors</h4>
                <p className="text-gray-700 text-sm">Order details and delivery information to fulfill your purchases</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800">Service Providers</h4>
                <p className="text-gray-700 text-sm">Payment processors, delivery partners, and technical service providers</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800">Legal Requirements</h4>
                <p className="text-gray-700 text-sm">When required by law, court order, or government regulations</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800">Business Transfers</h4>
                <p className="text-gray-700 text-sm">In case of merger, acquisition, or sale of business assets</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Security */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-600" />
            Data Security
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Technical Safeguards</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure data storage with encryption</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Operational Safeguards</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>Limited employee access to personal data</li>
                <li>Regular staff training on privacy</li>
                <li>Incident response procedures</li>
                <li>Data backup and recovery systems</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Your Rights */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Your Privacy Rights
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Access & Control</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>View your personal information</li>
                <li>Update or correct your data</li>
                <li>Delete your account</li>
                <li>Export your data</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Communication Preferences</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>Opt-out of marketing emails</li>
                <li>Manage push notifications</li>
                <li>Control location sharing</li>
                <li>Adjust privacy settings</li>
              </ul>
            </div>
          </div>
        </Card>




      </div>
    </div>
  );
}