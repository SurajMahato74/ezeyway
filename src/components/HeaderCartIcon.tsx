import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

export function HeaderCartIcon() {
  const { cart } = useCart();
  const navigate = useNavigate();
  
  const cartItems = cart?.items || [];
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={() => navigate("/cart")}
      className="relative p-1.5 hover:bg-muted rounded-lg transition-smooth"
    >
      <ShoppingCart className="h-5 w-5 text-foreground" />
      {totalItems > 0 && (
        <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center min-w-[16px] bg-[#856043] text-white">
          {totalItems > 99 ? '99+' : totalItems}
        </Badge>
      )}
    </button>
  );
}