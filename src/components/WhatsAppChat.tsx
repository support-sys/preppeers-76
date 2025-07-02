
import { MessageCircle } from "lucide-react";

interface WhatsAppChatProps {
  phoneNumber?: string;
}

const WhatsAppChat = ({ phoneNumber = "1234567890" }: WhatsAppChatProps) => {
  const handleWhatsAppClick = () => {
    const message = "Hi, I have a question about your mock interview service.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
      title="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
};

export default WhatsAppChat;
