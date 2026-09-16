export const siteConfig = {
  name: 'OptiPress',
  description: 'You choose the target size. We protect visual quality and privacy.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  navItems: [
    { label: 'Compress PDF', href: '#upload-section', badge: 'Target Size' },
    { label: 'Compress Images', href: '#upload-section' },
    { label: 'Privacy Spec', href: '#privacy-section' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq-section' },
  ],
  supportedFormats: [
    { label: 'PDF', mime: 'application/pdf', extension: '.pdf', category: 'Document' },
    { label: 'JPG', mime: 'image/jpeg', extension: '.jpg', category: 'Image' },
    { label: 'JPEG', mime: 'image/jpeg', extension: '.jpeg', category: 'Image' },
    { label: 'PNG', mime: 'image/png', extension: '.png', category: 'Image' },
    { label: 'WEBP', mime: 'image/webp', extension: '.webp', category: 'Image' },
    { label: 'AVIF', mime: 'image/avif', extension: '.avif', category: 'Image' },
  ],
  maxFileSizeBytes: 100 * 1024 * 1024, // 100 MB
  minTargetKb: 99,
};
