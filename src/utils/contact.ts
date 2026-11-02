/** FrameAI team's WhatsApp (digits only, country code first) for custom-frame and partner enquiries */
export const FRAMEAI_WHATSAPP = '6281230579891';

/** wa.me link that opens a chat with the team, pre-filled with the given message */
export const whatsappLink = (message: string) =>
  `https://wa.me/${FRAMEAI_WHATSAPP}?text=${encodeURIComponent(message)}`;
