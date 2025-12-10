'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * QR Code Redirect Handler
 *
 * Scanned QR codes hit this route and get redirected to the appropriate page
 * with quick care mode enabled.
 *
 * URL patterns:
 *   /q/p/{plantId}     → /plants/{dbId}?quickcare=true
 *   /q/l/{locationSlug} → /batch-care?location={location}&quickcare=true
 *
 * The plantId can be either:
 *   - The human-readable ID (ANT-2025-0036)
 *   - The database CUID (cmgsezkin000xgw74...)
 */
export default function QRRedirect() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string[];

  useEffect(() => {
    async function handleRedirect() {
      if (!slug || slug.length < 2) {
        // Invalid QR - redirect to home
        router.replace('/');
        return;
      }

      const [type, ...idParts] = slug;
      const id = idParts.join('/'); // Handle IDs that might have slashes

      switch (type) {
        case 'p': // Plant
          await redirectToPlant(id);
          break;
        case 'l': // Location
          redirectToLocation(id);
          break;
        default:
          router.replace('/');
      }
    }

    async function redirectToPlant(plantId: string) {
      try {
        // Look up plant by plantId (ANT-2025-XXXX) or database ID
        const response = await fetch(`/api/plants/lookup?q=${encodeURIComponent(plantId)}`);
        if (response.ok) {
          const plant = await response.json();
          router.replace(`/plants/${plant.id}?quickcare=true`);
        } else {
          // Plant not found - go to plants list with search
          router.replace(`/plants?search=${encodeURIComponent(plantId)}`);
        }
      } catch (error) {
        console.error('QR redirect error:', error);
        router.replace('/plants');
      }
    }

    function redirectToLocation(locationSlug: string) {
      // Decode location slug (BALCONY, TENT_A, etc.)
      const location = locationSlug.replace(/_/g, ' ').toUpperCase();
      router.replace(`/batch-care?location=${encodeURIComponent(location)}&quickcare=true`);
    }

    handleRedirect();
  }, [slug, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
