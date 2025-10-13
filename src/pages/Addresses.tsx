import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Edit3, Trash2, Home, Briefcase, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";

// Mock address data
const mockAddresses = [
  {
    id: 1,
    type: "home",
    label: "Home",
    name: "John Doe",
    phone: "+977 9841234567",
    address: "123 Thamel Street, Thamel",
    city: "Kathmandu",
    landmark: "Near Durbar Square",
    isDefault: true
  },
  {
    id: 2,
    type: "work",
    label: "Office",
    name: "John Doe",
    phone: "+977 9841234567",
    address: "456 Lazimpat Road, Lazimpat",
    city: "Kathmandu",
    landmark: "Opposite British Embassy",
    isDefault: false
  }
];

const getAddressIcon = (type: string) => {
  switch (type) {
    case "home": return <Home className="h-5 w-5" />;
    case "work": return <Briefcase className="h-5 w-5" />;
    case "other": return <Heart className="h-5 w-5" />;
    default: return <MapPin className="h-5 w-5" />;
  }
};

export default function Addresses() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState(mockAddresses);

  const handleAddAddress = () => {
    // In real app, navigate to add address form
    console.log("Add new address");
  };

  const handleEditAddress = (id: number) => {
    // In real app, navigate to edit address form
    console.log("Edit address", id);
  };

  const handleDeleteAddress = (id: number) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const handleSetDefault = (id: number) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

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
          <h1 className="font-semibold text-lg">My Addresses</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddAddress}
            className="p-2"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Addresses List */}
      <div className="p-4 space-y-4 pb-20">
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <Card key={address.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {getAddressIcon(address.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {address.label}
                        {address.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAddress(address.id)}
                      className="p-2"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <p className="font-medium">{address.name}</p>
                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                  <p className="text-sm">{address.address}</p>
                  <p className="text-sm">{address.city}</p>
                  {address.landmark && (
                    <p className="text-sm text-muted-foreground">
                      Landmark: {address.landmark}
                    </p>
                  )}
                </div>

                {!address.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                    className="w-full mt-3"
                  >
                    Set as Default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No addresses found</h3>
            <p className="text-muted-foreground mb-4">
              Add your delivery addresses to make ordering faster
            </p>
            <Button onClick={handleAddAddress}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Address
            </Button>
          </div>
        )}

        {/* Add New Address Button */}
        {addresses.length > 0 && (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <Button
                variant="ghost"
                onClick={handleAddAddress}
                className="w-full h-16 flex flex-col items-center gap-2"
              >
                <Plus className="h-6 w-6" />
                <span>Add New Address</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}