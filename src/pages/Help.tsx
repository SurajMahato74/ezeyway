import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, HelpCircle, MessageCircle, Phone, Mail,
  ChevronRight, Search, Star, Clock, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BottomNavigation } from "@/components/BottomNavigation";

const helpCategories = [
  {
    id: "orders",
    title: "Orders & Delivery",
    icon: Clock,
    description: "Track orders, delivery issues, cancellations",
    articles: [
      "How to track my order?",
      "Delivery time and charges",
      "Cancel or modify order",
      "Refund policy"
    ]
  },
  {
    id: "payment",
    title: "Payment & Billing",
    icon: Star,
    description: "Payment methods, billing, refunds",
    articles: [
      "Payment methods accepted",
      "Failed payment issues",
      "Refund process",
      "Billing disputes"
    ]
  },
  {
    id: "account",
    title: "Account & Profile",
    icon: HelpCircle,
    description: "Account settings, profile management",
    articles: [
      "Update profile information",
      "Change password",
      "Manage addresses",
      "Privacy settings"
    ]
  },
  {
    id: "technical",
    title: "Technical Support",
    icon: Phone,
    description: "App issues, login problems, bugs",
    articles: [
      "App not working",
      "Login issues",
      "Payment errors",
      "Report a bug"
    ]
  }
];

const contactOptions = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support team",
    action: "Start Chat",
    available: true
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Call us for immediate help",
    action: "Call Now",
    available: true
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us an email",
    action: "Send Email",
    available: true
  }
];

export default function Help() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleContact = (action: string) => {
    switch (action) {
      case "Start Chat":
        // In real app, open chat widget
        console.log("Starting live chat");
        break;
      case "Call Now":
        window.open("tel:+977-1-234567");
        break;
      case "Send Email":
        window.open("mailto:support@kathsnap.com");
        break;
    }
  };

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article =>
      article.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Help & Support</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Help Categories */}
      <div className="p-4 space-y-4 pb-20">
        {filteredCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{category.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.articles.slice(0, 2).map((article, index) => (
                    <div key={index} className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                      • {article}
                    </div>
                  ))}
                  {category.articles.length > 2 && (
                    <div className="text-sm text-primary font-medium cursor-pointer">
                      View all {category.articles.length} articles
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleContact(option.action)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.title}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {option.available && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="font-medium text-sm">How do I track my order?</div>
              <div className="text-sm text-muted-foreground">
                Go to My Orders in your profile and click on any order to see its current status and tracking information.
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-sm">What are the delivery charges?</div>
              <div className="text-sm text-muted-foreground">
                Free delivery for orders above ₹500. For orders below ₹500, a delivery fee of ₹40 applies.
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-sm">How do I cancel an order?</div>
              <div className="text-sm text-muted-foreground">
                You can cancel an order within 30 minutes of placement. Go to My Orders and select the cancel option.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Hours */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-primary text-sm">Support Hours</p>
                <p className="text-primary/80 text-xs">
                  Monday - Sunday: 6:00 AM - 10:00 PM
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}